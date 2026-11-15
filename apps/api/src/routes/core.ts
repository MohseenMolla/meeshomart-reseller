import { Router, Request } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { requireAuth, requireRole, requireActiveSeller, AuthReq } from '../middleware/auth';
import { SubscriptionPlan, Product, Order, WalletTransaction, User, Banner, Category } from '../models';
import { orderProfit, orderTotal, code } from '../utils';
import { deleteImage } from '../services/cloudinary';
import { config } from '../config';

export const plans = Router();
plans.get('/', async (_q, r) => r.json({ success: true, data: await SubscriptionPlan.find({ active: true }).lean() }));
plans.post('/', requireAuth, requireRole('super_admin'), async (q, r) => r.status(201).json({ success: true, data: await SubscriptionPlan.create(q.body) }));

export const banners = Router();
banners.get('/', async (_q, r) => {
  const list = await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean();
  r.json({ success: true, data: list });
});

export const categories = Router();
categories.get('/', async (_q, r) => {
  const list = await Category.find({ active: true }).sort({ order: 1, name: 1 }).lean();
  r.json({ success: true, data: list });
});

export const products = Router();

// Relaxed image schema: supports both Cloudinary uploads and any high-quality online product image URLs
const imgItem = z.object({
  url: z.string().url('Must be a valid image URL'),
  publicId: z.string().optional().default('')
});

export const productSchema = z.object({
  name: z.string().min(2).max(150),
  sku: z.string().min(2).max(50),
  category: z.string().default('General'),
  description: z.string().max(10000).optional(),
  retailPrice: z.number().positive(),
  wholesalePrice: z.number().positive(),
  stock: z.number().int().min(0),
  featured: z.boolean().optional().default(false),
  images: z.array(imgItem).max(10).default([])
}).refine(p => p.wholesalePrice <= p.retailPrice, {
  message: 'Wholesale price cannot be higher than suggested retail price',
  path: ['wholesalePrice']
});

const pubImgs = (p: any) => ({
  ...p,
  images: (p.images || []).map((i: any) => ({
    url: typeof i === 'string' ? i : i.url,
    publicId: i.publicId || ''
  }))
});

// Helper to determine if the requesting user is an authenticated reseller/manager/admin
async function getCanSeeWholesale(req: Request): Promise<boolean> {
  try {
    const t = req.cookies?.token;
    if (!t) return false;
    const p: any = jwt.verify(t, config.jwt);
    if (!p?.sub) return false;
    const user = await User.findById(p.sub).select('role active').lean();
    if (!user || !user.active) return false;
    return ['super_admin', 'manager', 'staff', 'seller', 'reseller'].includes(user.role);
  } catch {
    return false;
  }
}

// Grouped products by Category for Homepage (just like dropshipping.com.bd)
products.get('/grouped/by-category', async (req, res) => {
  const canSeeWholesale = await getCanSeeWholesale(req);
  const selectQuery = canSeeWholesale ? '' : '-wholesalePrice';

  // Find all active categories in the database (filter out any legacy Bangla categories)
  const activeCategories = (await Product.distinct('category', { active: true }))
    .filter((c: any) => typeof c === 'string' && c.trim() && !/[\u0980-\u09FF]/.test(c));

  const priorityOrder = [
    'Winter Collection',
    "Men's Fashion",
    "Women's Fashion",
    'Gadgets & Electronics',
    'Home & Lifestyle',
    'Beauty & Personal Care',
    'Kids Zone',
    'Foods',
    'Others'
  ];

  const sortedCategories = [
    ...priorityOrder.filter((c) => activeCategories.some((ac) => ac && ac.toLowerCase() === c.toLowerCase())),
    ...activeCategories.filter((c) => c && !priorityOrder.some((p) => p.toLowerCase() === c.toLowerCase()))
  ];

  const results: Record<string, any[]> = {};
  for (const cat of sortedCategories) {
    const prods = await Product.find({
      category: { $regex: new RegExp(`^${cat}$`, 'i') },
      active: true
    })
      .select(selectQuery)
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    if (prods.length > 0) {
      results[cat] = prods.map(pubImgs);
    }
  }

  res.json({
    success: true,
    data: {
      categories: results,
      canSeeWholesale
    },
    categories: results,
    canSeeWholesale,
    meta: { canSeeWholesale }
  });
});

// Reseller Wholesale Endpoint (guaranteed wholesale prices for logged-in reseller)
products.get('/wholesale', requireAuth, requireRole('seller', 'reseller', 'manager', 'staff', 'super_admin'), async (q, r) => {
  const f: any = { active: true };
  if (q.query.category && q.query.category !== 'all') f.category = String(q.query.category);
  if (q.query.q) {
    f.$or = [
      { name: { $regex: String(q.query.q), $options: 'i' } },
      { sku: { $regex: String(q.query.q), $options: 'i' } }
    ];
  }
  const products = await Product.find(f).sort({ createdAt: -1 }).limit(100).lean();
  r.json({ success: true, data: products.map(pubImgs) });
});

// Public & Reseller Catalog (Search & Category filter)
products.get('/', async (q, r) => {
  const page = Math.max(1, +(q.query.page || 1));
  const lim = Math.min(50, +(q.query.limit || 30));
  const f: any = { active: true };

  if (q.query.q) {
    f.$or = [
      { name: { $regex: String(q.query.q), $options: 'i' } },
      { sku: { $regex: String(q.query.q), $options: 'i' } },
      { category: { $regex: String(q.query.q), $options: 'i' } }
    ];
  }

  if (q.query.category && q.query.category !== 'all') {
    f.category = { $regex: new RegExp(`^${String(q.query.category)}$`, 'i') };
  }

  const canSeeWholesale = await getCanSeeWholesale(q);
  const selectQuery = canSeeWholesale ? '' : '-wholesalePrice';

  const [d, n, cats] = await Promise.all([
    Product.find(f).select(selectQuery).sort({ createdAt: -1 }).skip((page - 1) * lim).limit(lim).lean().then(a => a.map(pubImgs)),
    Product.countDocuments(f),
    Product.distinct('category', { active: true })
  ]);

  r.json({
    success: true,
    data: d,
    meta: {
      page,
      total: n,
      canSeeWholesale,
      categories: cats.filter(Boolean)
    }
  });
});

// Single product details with related products (Accepts ID or SKU)
products.get('/:idOrSku', async (q, r) => {
  const param = q.params.idOrSku;
  const canSeeWholesale = await getCanSeeWholesale(q);
  const selectQuery = canSeeWholesale ? '' : '-wholesalePrice';

  const isId = mongoose.Types.ObjectId.isValid(param);
  let p = isId ? await Product.findOne({ _id: param, active: true }).select(selectQuery).lean() : null;
  if (!p) {
    p = await Product.findOne({ sku: { $regex: new RegExp(`^${param}$`, 'i') }, active: true }).select(selectQuery).lean();
  }
  if (!p && isId) {
    p = await Product.findOne({ _id: param }).select(selectQuery).lean();
  }
  if (!p) {
    p = await Product.findOne({ sku: param }).select(selectQuery).lean();
  }
  if (!p) return r.status(404).json({ success: false, error: 'Product not found' });

  // Find related products in the same category
  let related = await Product.find({
    category: p.category,
    _id: { $ne: p._id },
    active: true
  })
    .select(selectQuery)
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  // If fewer than 4 related in the same category, fill with other popular active products
  if (related.length < 4) {
    const additional = await Product.find({
      _id: { $ne: p._id, $nin: related.map((r) => r._id) },
      active: true
    })
      .select(selectQuery)
      .sort({ featured: -1, createdAt: -1 })
      .limit(6 - related.length)
      .lean();
    related = [...related, ...additional];
  }

  const formattedProduct = pubImgs(p);
  const formattedRelated = related.map(pubImgs);

  r.json({
    success: true,
    data: {
      product: formattedProduct,
      related: formattedRelated,
      canSeeWholesale
    },
    product: formattedProduct,
    related: formattedRelated,
    meta: { canSeeWholesale }
  });
});

// Create product (Manager & Super Admin)
products.post('/', requireAuth, requireRole('super_admin', 'manager', 'staff'), async (q, r) => {
  try {
    const data = productSchema.parse(q.body);
    const p = await Product.create(data);
    r.status(201).json({ success: true, data: pubImgs(p) });
  } catch (e: any) {
    if (e.code === 11000) return r.status(409).json({ success: false, error: 'Product SKU already exists' });
    throw e;
  }
});

// Edit product (Manager & Super Admin)
products.put('/:id', requireAuth, requireRole('super_admin', 'manager', 'staff'), async (q, r) => {
  const d = productSchema.parse(q.body);
  const old = await Product.findById(q.params.id);
  if (!old) return r.status(404).json({ success: false, error: 'Product not found' });

  const keep = new Set(d.images.map(i => i.publicId).filter(Boolean));
  const removed = (old.images || []).map((i: any) => i.publicId).filter((id: string) => id && !keep.has(id));

  try {
    Object.assign(old, d);
    await old.save();
  } catch (e: any) {
    if (e.code === 11000) return r.status(409).json({ success: false, error: 'Product SKU already exists' });
    throw e;
  }

  // Delete removed images from Cloudinary if publicId exists
  await Promise.allSettled(removed.map((id: string) => deleteImage(id)));
  r.json({ success: true, data: pubImgs(old) });
});

// Archive product (Manager & Super Admin)
products.delete('/:id', requireAuth, requireRole('super_admin', 'manager', 'staff'), async (q, r) => {
  const p = await Product.findByIdAndUpdate(q.params.id, { active: false }, { new: true });
  p ? r.json({ success: true }) : r.status(404).json({ success: false, error: 'Product not found' });
});

export const orders = Router();

const oSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().int().positive().default(1),
    unitPrice: z.number().positive() // Reseller customer selling price
  })).min(1),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().regex(/^01[3-9]\d{8}$/, 'Must be a valid 11-digit phone number (e.g. 01410449778)'),
    address: z.string().min(5),
    district: z.string().default('Dhaka')
  }),
  deliveryCharge: z.number().min(0).default(70),
  notes: z.string().optional(),
  idemKey: z.string().optional()
});

// Reseller Place Dropship Order
orders.post('/', requireAuth, requireRole('seller', 'reseller'), requireActiveSeller, async (req: AuthReq, res) => {
  const d = oSchema.parse(req.body);
  const sellerId = req.auth!.sellerId!;

  if (d.idemKey) {
    const ex = await Order.findOne({ sellerId, idemKey: d.idemKey });
    if (ex) return res.json({ success: true, data: ex });
  }

  const s = await mongoose.startSession();
  let order: any;

  try {
    await s.withTransaction(async () => {
      const items = [];
      let totalProfit = 0;
      let totalSubtotal = 0;

      for (const i of d.items) {
        const p = await Product.findOneAndUpdate(
          { _id: i.productId, active: true, $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, i.qty] } },
          { $inc: { reserved: i.qty } },
          { new: true, session: s }
        );
        if (!p) throw new Error('Insufficient stock for product');
        if (i.unitPrice < p.wholesalePrice!) {
          throw new Error(`Customer selling price (৳${i.unitPrice}) cannot be lower than wholesale price (৳${p.wholesalePrice})`);
        }
        const itemProfit = (i.unitPrice - p.wholesalePrice!) * i.qty;
        const itemSubtotal = i.unitPrice * i.qty;
        totalProfit += itemProfit;
        totalSubtotal += itemSubtotal;

        items.push({
          productId: p._id,
          name: p.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          wholesale: p.wholesalePrice!
        });
      }

      const customerPayable = totalSubtotal + (d.deliveryCharge || 0);

      [order] = await Order.create([{
        orderNo: code('ORD', 8),
        sellerId,
        items,
        customer: d.customer,
        deliveryCharge: d.deliveryCharge || 70,
        customerPayable,
        notes: d.notes || '',
        total: totalSubtotal,
        profit: totalProfit,
        status: 'pending',
        history: [{ status: 'pending', at: new Date(), by: req.auth!.userId, note: 'Order placed by reseller' }],
        idemKey: d.idemKey,
        source: 'reseller_panel'
      }], { session: s });
    });
  } catch (e: any) {
    return res.status(409).json({ success: false, error: e.message });
  } finally {
    await s.endSession();
  }

  res.status(201).json({ success: true, data: order });
});

// Reseller Get Orders
orders.get('/', requireAuth, requireRole('seller', 'reseller'), async (req: AuthReq, res) => {
  const page = Math.max(1, +(req.query.page || 1));
  const filter: any = { sellerId: req.auth!.sellerId };
  if (req.query.status && req.query.status !== 'all') {
    filter.status = String(req.query.status);
  }
  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate('items.productId', 'name sku images retailPrice wholesalePrice')
      .sort({ createdAt: -1 })
      .skip((page - 1) * 20)
      .limit(20)
      .lean(),
    Order.countDocuments(filter)
  ]);
  res.json({ success: true, data, meta: { total, page } });
});

orders.get('/:id', requireAuth, requireRole('seller', 'reseller'), async (req: AuthReq, res) => {
  const o = await Order.findOne({ _id: req.params.id, sellerId: req.auth!.sellerId })
    .populate('items.productId', 'name sku images retailPrice wholesalePrice')
    .lean();
  o ? res.json({ success: true, data: o }) : res.status(404).json({ success: false, error: 'Not found' });
});

export const wallet = Router();
wallet.get('/', requireAuth, requireRole('seller', 'reseller'), async (req: AuthReq, res) => {
  const rows = await WalletTransaction.aggregate([
    { $match: { sellerId: new mongoose.Types.ObjectId(req.auth!.sellerId) } },
    { $group: { _id: '$status', sum: { $sum: '$amount' } } }
  ]);
  const g = (s: string) => rows.find(r => r._id === s)?.sum || 0;
  res.json({ success: true, data: { available: g('available'), pending: g('pending') } });
});
