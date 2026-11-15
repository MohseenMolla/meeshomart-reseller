import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { requireAuth, requireRole, AuthReq } from '../middleware/auth';
import { SellerProfile, User, Order, Product, Withdrawal, WalletTransaction, SubscriptionPlan, Payment, AuditLog, Banner, Category } from '../models';
import { canTransition, lockWallet } from '../services/ledger';
import { activateSeller } from '../services/payment';

export const admin = Router();

// Allow super_admin, manager, staff
admin.use(requireAuth, requireRole('super_admin', 'manager', 'staff'));

const audit = (req: AuthReq, action: string, target: string, meta?: any) =>
  AuditLog.create({ actor: req.auth!.userId, action, target, meta });

const page = (q: any) => ({ skip: (Math.max(1, +(q.page || 1)) - 1) * 20, limit: 20 });

// Overview Dashboard Stats
admin.get('/overview', async (_q, res) => {
  const [
    sellers, activeSellers, pendingSellers, suspendedSellers,
    managers,
    totalOrders, pendingOrders, deliveredOrders,
    products,
    pendingWithdrawals,
    totalProfitsAgg,
    totalSalesAgg
  ] = await Promise.all([
    SellerProfile.countDocuments(),
    SellerProfile.countDocuments({ status: 'active' }),
    SellerProfile.countDocuments({ status: 'pending' }),
    SellerProfile.countDocuments({ status: 'suspended' }),
    User.countDocuments({ role: { $in: ['manager', 'staff'] } }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'delivered' }),
    Product.countDocuments({ active: true }),
    Withdrawal.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, sum: { $sum: '$profit' } } }
    ]),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'returned'] } } },
      { $group: { _id: null, sum: { $sum: '$customerPayable' } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      sellers,
      activeSellers,
      pendingSellers,
      suspendedSellers,
      managers,
      maxManagers: 50,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      products,
      pendingWithdrawals,
      totalResellerProfitPaid: totalProfitsAgg[0]?.sum || 0,
      totalPlatformSales: totalSalesAgg[0]?.sum || 0
    }
  });
});

// ==========================================
// MANAGER MANAGEMENT (Super Admin Only - Max 50)
// ==========================================
admin.get('/managers', requireRole('super_admin'), async (_req, res) => {
  const managers = await User.find({ role: { $in: ['manager', 'staff'] } })
    .select('name email phone role active createdAt lastSeenAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: managers, meta: { count: managers.length, max: 50 } });
});

admin.post('/managers', requireRole('super_admin'), async (req: AuthReq, res) => {
  const managerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^01[3-9]\d{8}$/, 'Must be a valid 11-digit Bangladesh phone number'),
    password: z.string().min(6)
  });

  const parsed = managerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  // Enforce 50 managers limit
  const currentCount = await User.countDocuments({ role: { $in: ['manager', 'staff'] } });
  if (currentCount >= 50) {
    return res.status(400).json({
      success: false,
      error: 'সর্বোচ্চ ৫০ জন ম্যানেজার যুক্ত করার কোটা পূর্ণ হয়ে গেছে (Maximum limit of 50 managers reached)'
    });
  }

  const { name, email, phone, password } = parsed.data;
  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email or phone already registered' });
  }

  const manager = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash: await argon2.hash(password),
    role: 'manager',
    active: true,
    verified: true
  });

  await audit(req, 'manager.create', String(manager._id), { name, email, phone });
  res.status(201).json({
    success: true,
    data: {
      id: manager._id,
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      role: manager.role
    }
  });
});

admin.post('/managers/:id/toggle', requireRole('super_admin'), async (req: AuthReq, res) => {
  const m = await User.findOne({ _id: req.params.id, role: { $in: ['manager', 'staff'] } });
  if (!m) return res.status(404).json({ success: false, error: 'Manager not found' });
  m.active = !m.active;
  await m.save();
  await audit(req, 'manager.toggle', String(m._id), { active: m.active });
  res.json({ success: true, data: { id: m._id, active: m.active } });
});

admin.delete('/managers/:id', requireRole('super_admin'), async (req: AuthReq, res) => {
  const m = await User.findOneAndDelete({ _id: req.params.id, role: { $in: ['manager', 'staff'] } });
  if (!m) return res.status(404).json({ success: false, error: 'Manager not found' });
  await audit(req, 'manager.delete', req.params.id, { email: m.email });
  res.json({ success: true });
});

// ==========================================
// RESELLER MANAGEMENT (Super Admin & Manager)
// ==========================================
admin.get('/sellers', async (req, res) => {
  const f: any = {};
  if (req.query.status && req.query.status !== 'all') f.status = String(req.query.status);
  if (req.query.q) {
    const qStr = String(req.query.q);
    const users = await User.find({
      $or: [
        { name: { $regex: qStr, $options: 'i' } },
        { email: { $regex: qStr, $options: 'i' } },
        { phone: { $regex: qStr, $options: 'i' } }
      ]
    }).select('_id');
    const uIds = users.map(u => u._id);
    f.$or = [
      { userId: { $in: uIds } },
      { shopName: { $regex: qStr, $options: 'i' } },
      { sellerCode: { $regex: qStr, $options: 'i' } }
    ];
  }

  const [sellers, total] = await Promise.all([
    SellerProfile.find(f)
      .populate('userId', 'name email phone active createdAt')
      .sort({ createdAt: -1 })
      .skip(page(req.query).skip)
      .limit(20)
      .lean(),
    SellerProfile.countDocuments(f)
  ]);

  // Aggregate order stats for each seller
  const sellerIds = sellers.map(s => s._id);
  const orderCounts = await Order.aggregate([
    { $match: { sellerId: { $in: sellerIds } } },
    { $group: { _id: '$sellerId', count: { $sum: 1 }, totalProfit: { $sum: '$profit' } } }
  ]);
  const statsMap = new Map(orderCounts.map(o => [String(o._id), o]));

  const enriched = sellers.map(s => ({
    ...s,
    totalOrders: statsMap.get(String(s._id))?.count || 0,
    totalProfit: statsMap.get(String(s._id))?.totalProfit || 0
  }));

  res.json({ success: true, data: enriched, meta: { total, page: +(req.query.page || 1) } });
});

admin.post('/sellers/:id/status', requireRole('super_admin'), async (req: AuthReq, res) => {
  const { status, reason } = z.object({
    status: z.enum(['active', 'suspended']),
    reason: z.string().min(2)
  }).parse(req.body);

  const s = await SellerProfile.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!s) return res.status(404).json({ success: false, error: 'Not found' });
  await audit(req, `seller.${status}`, s.id, { reason });
  res.json({ success: true, data: s });
});

// ==========================================
// ORDERS MANAGEMENT (Super Admin & Manager)
// ==========================================
admin.get('/orders', async (req, res) => {
  const f: any = {};
  if (req.query.sellerId) f.sellerId = String(req.query.sellerId);
  if (req.query.status && req.query.status !== 'all') f.status = String(req.query.status);
  if (req.query.q) {
    f.$or = [
      { orderNo: { $regex: String(req.query.q), $options: 'i' } },
      { 'customer.name': { $regex: String(req.query.q), $options: 'i' } },
      { 'customer.phone': { $regex: String(req.query.q), $options: 'i' } },
      { 'courier.trackingCode': { $regex: String(req.query.q), $options: 'i' } }
    ];
  }

  const [data, total] = await Promise.all([
    Order.find(f)
      .populate('sellerId', 'shopName sellerCode phone')
      .populate('items.productId', 'name sku images retailPrice wholesalePrice')
      .sort({ createdAt: -1 })
      .skip(page(req.query).skip)
      .limit(20)
      .lean(),
    Order.countDocuments(f)
  ]);

  res.json({ success: true, data, meta: { total, page: +(req.query.page || 1) } });
});

// Order status change & profit unlock
admin.post('/orders/:id/status', async (req: AuthReq, res) => {
  const { status, note } = z.object({
    status: z.enum(['pending', 'confirmed', 'packaging', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded']),
    note: z.string().optional()
  }).parse(req.body);

  const s = await mongoose.startSession();
  let out: any;

  try {
    await s.withTransaction(async () => {
      const o = await Order.findById(req.params.id).session(s);
      if (!o) throw new Error('Order not found');
      if (!canTransition(o.status, status)) throw new Error(`Invalid transition ${o.status} -> ${status}`);

      const was = o.status;
      o.status = status;
      o.history.push({
        status,
        at: new Date(),
        by: new mongoose.Types.ObjectId(req.auth!.userId),
        note: note || `Status updated to ${status}`
      } as any);
      await o.save({ session: s });

      const ref = String(o._id);

      // Release stock if cancelled
      if (status === 'cancelled') {
        for (const i of o.items) {
          await Product.updateOne({ _id: i.productId }, { $inc: { reserved: -i.qty! } }, { session: s });
        }
      }

      // Delivered: deduct reserved and actual stock, unlock reseller profit to AVAILABLE in wallet
      if (status === 'delivered') {
        for (const i of o.items) {
          await Product.updateOne({ _id: i.productId }, { $inc: { reserved: -i.qty!, stock: -i.qty! } }, { session: s });
        }
        await lockWallet(o.sellerId, s);
        await WalletTransaction.updateOne(
          { sellerId: o.sellerId, type: 'order_profit', ref },
          { $setOnInsert: { amount: o.profit, status: 'available', note: `Profit for delivered order ${o.orderNo}` } },
          { upsert: true, session: s }
        );
      }

      // Returned or refunded after delivered: deduct profit compensation
      if ((status === 'returned' || status === 'refunded') && was === 'delivered') {
        await lockWallet(o.sellerId, s);
        await WalletTransaction.updateOne(
          { sellerId: o.sellerId, type: 'refund_deduction', ref },
          { $setOnInsert: { amount: -(o.profit || 0), status: 'available', note: `Deduction for returned order ${o.orderNo}` } },
          { upsert: true, session: s }
        );
      }

      out = o;
    });
  } catch (e: any) {
    return res.status(409).json({ success: false, error: e.message });
  } finally {
    await s.endSession();
  }

  await audit(req, 'order.status', req.params.id, { status, note });
  res.json({ success: true, data: out });
});

// Courier Update (Super Admin & Manager)
admin.post('/orders/:id/courier', async (req: AuthReq, res) => {
  const { name, trackingCode, notes } = z.object({
    name: z.string().min(1),
    trackingCode: z.string().min(1),
    notes: z.string().optional()
  }).parse(req.body);

  const o = await Order.findByIdAndUpdate(
    req.params.id,
    { courier: { name, trackingCode, notes: notes || '' } },
    { new: true }
  );
  if (!o) return res.status(404).json({ success: false, error: 'Order not found' });
  await audit(req, 'order.courier_update', req.params.id, { name, trackingCode });
  res.json({ success: true, data: o });
});

// ==========================================
// RESELLER PROFIT LIST (Super Admin & Manager)
// ==========================================
admin.get('/profits', async (req, res) => {
  const f: any = {};
  if (req.query.status && req.query.status !== 'all') f.status = String(req.query.status);
  const [orders, total] = await Promise.all([
    Order.find(f)
      .populate('sellerId', 'shopName sellerCode')
      .select('orderNo sellerId customer total profit customerPayable status createdAt')
      .sort({ createdAt: -1 })
      .skip(page(req.query).skip)
      .limit(30)
      .lean(),
    Order.countDocuments(f)
  ]);

  res.json({ success: true, data: orders, meta: { total, page: +(req.query.page || 1) } });
});

// ==========================================
// WITHDRAWALS MANAGEMENT (Super Admin Only)
// ==========================================
admin.get('/withdrawals', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : 'pending';
  const filter: any = status === 'all' ? {} : { status };
  const rows = await Withdrawal.find(filter)
    .populate('sellerId', 'shopName sellerCode phone')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data: rows });
});

admin.post('/withdrawals/:id/review', requireRole('super_admin'), async (req: AuthReq, res) => {
  const d = z.object({
    decision: z.enum(['approved', 'rejected']),
    reference: z.string().optional(),
    note: z.string().optional()
  }).parse(req.body);

  if (d.decision === 'approved' && !d.reference) {
    return res.status(400).json({ success: false, error: 'Transaction reference (TrxID) is required for approval' });
  }

  const s = await mongoose.startSession();
  try {
    await s.withTransaction(async () => {
      const w = await Withdrawal.findOneAndUpdate(
        { _id: req.params.id, status: 'pending' },
        { status: d.decision, reference: d.reference, note: d.note, reviewedBy: req.auth!.userId },
        { new: true, session: s }
      );
      if (!w) throw new Error('Already reviewed or not found');

      // Compensating entry on reject so funds are refunded to wallet
      if (d.decision === 'rejected') {
        await lockWallet(w.sellerId, s);
        await WalletTransaction.create([{
          sellerId: w.sellerId,
          type: 'adjustment',
          amount: w.amount,
          status: 'available',
          ref: 'rej:' + w.id,
          note: d.note || 'Withdrawal rejected - refunded to wallet'
        }], { session: s });
      }
    });
  } catch (e: any) {
    return res.status(409).json({ success: false, error: e.message });
  } finally {
    await s.endSession();
  }

  await audit(req, 'withdrawal.' + d.decision, req.params.id, { ref: d.reference, note: d.note });
  res.json({ success: true });
});

// Catalog with wholesale prices for admin screens
admin.get('/products', async (req, res) => {
  const f: any = {};
  if (req.query.q) {
    f.$or = [
      { name: { $regex: String(req.query.q), $options: 'i' } },
      { sku: { $regex: String(req.query.q), $options: 'i' } }
    ];
  }
  const [data, total] = await Promise.all([
    Product.find(f).sort({ createdAt: -1 }).skip(page(req.query).skip).limit(20).lean(),
    Product.countDocuments(f)
  ]);
  res.json({ success: true, data, meta: { total, page: +(req.query.page || 1) } });
});

// Audit log
admin.get('/audit', requireRole('super_admin'), async (req, res) =>
  res.json({ success: true, data: await AuditLog.find().sort({ createdAt: -1 }).skip(page(req.query.skip).skip).limit(20).lean() })
);

// ==========================================
// BANNER MANAGEMENT (Super Admin & Manager)
// ==========================================
const bannerSchema = z.object({
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  badge: z.string().optional().default(''),
  imageUrl: z.string().url('Must be a valid image URL'),
  linkUrl: z.string().optional().default('/'),
  buttonText: z.string().optional().default('Shop Now'),
  active: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0)
});

admin.get('/banners', async (_req, res) => {
  const data = await Banner.find().sort({ order: 1, createdAt: -1 }).lean();
  res.json({ success: true, data });
});

admin.post('/banners', async (req: AuthReq, res) => {
  const parsed = bannerSchema.parse(req.body);
  const banner = await Banner.create(parsed);
  await audit(req, 'banner.create', banner.id, { title: banner.title });
  res.status(201).json({ success: true, data: banner });
});

admin.put('/banners/:id', async (req: AuthReq, res) => {
  const parsed = bannerSchema.partial().parse(req.body);
  const banner = await Banner.findByIdAndUpdate(req.params.id, parsed, { new: true });
  if (!banner) return res.status(404).json({ success: false, error: 'Banner not found' });
  await audit(req, 'banner.update', banner.id, { title: banner.title });
  res.json({ success: true, data: banner });
});

admin.delete('/banners/:id', async (req: AuthReq, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ success: false, error: 'Banner not found' });
  await audit(req, 'banner.delete', req.params.id, { title: banner.title });
  res.json({ success: true });
});

// ==========================================
// CATEGORY MANAGEMENT (Super Admin & Manager)
// ==========================================
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  label: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  order: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true)
});

admin.get('/categories', async (_req, res) => {
  const data = await Category.find().sort({ order: 1, name: 1 }).lean();
  res.json({ success: true, data });
});

admin.post('/categories', async (req: AuthReq, res) => {
  const parsed = categorySchema.parse(req.body);
  const cat = await Category.findOneAndUpdate(
    { name: parsed.name },
    { $set: parsed },
    { upsert: true, new: true }
  );
  await audit(req, 'category.upsert', cat.id, { name: cat.name });
  res.status(201).json({ success: true, data: cat });
});

admin.put('/categories/:id', async (req: AuthReq, res) => {
  const parsed = categorySchema.partial().parse(req.body);
  const cat = await Category.findByIdAndUpdate(req.params.id, parsed, { new: true });
  if (!cat) return res.status(404).json({ success: false, error: 'Category not found' });
  await audit(req, 'category.update', cat.id, { name: cat.name });
  res.json({ success: true, data: cat });
});

admin.delete('/categories/:id', async (req: AuthReq, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) return res.status(404).json({ success: false, error: 'Category not found' });
  await audit(req, 'category.delete', req.params.id, { name: cat.name });
  res.json({ success: true });
});
