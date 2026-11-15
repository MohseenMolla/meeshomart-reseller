import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole, AuthReq } from '../middleware/auth';
import { SellerProfile, Order, WalletTransaction, User } from '../models';

export const sellerMe = Router();
sellerMe.use(requireAuth, requireRole('seller', 'reseller'));

sellerMe.get('/overview', async (req: AuthReq, res) => {
  if (!req.auth) return res.status(401).json({ success: false, error: 'Unauthenticated' });
  if (!req.auth.sellerId) {
    const s = await SellerProfile.findOne({ userId: req.auth.userId });
    if (s) req.auth.sellerId = s._id.toString();
    else return res.status(404).json({ success: false, error: 'Seller profile not found' });
  }

  const id = new mongoose.Types.ObjectId(req.auth.sellerId);
  const sp = await SellerProfile.findById(id).lean();
  const usr = await User.findById(req.auth.userId).select('name email phone verified totpEnabled').lean();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [byStatus, totals, today, w, ref, recentOrders] = await Promise.all([
    Order.aggregate([{ $match: { sellerId: id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { sellerId: id, status: { $nin: ['cancelled', 'returned', 'refunded'] } } },
      { $group: { _id: null, sales: { $sum: '$customerPayable' }, profit: { $sum: '$profit' } } }
    ]),
    Order.aggregate([
      { $match: { sellerId: id, createdAt: { $gte: start } } },
      { $group: { _id: null, n: { $sum: 1 }, sales: { $sum: '$customerPayable' }, profit: { $sum: '$profit' } } }
    ]),
    WalletTransaction.aggregate([{ $match: { sellerId: id } }, { $group: { _id: '$status', sum: { $sum: '$amount' } } }]),
    WalletTransaction.aggregate([{ $match: { sellerId: id, type: 'referral_commission' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    Order.find({ sellerId: id })
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  const g = (s: string) => w.find((r: any) => r._id === s)?.sum || 0;

  res.json({
    success: true,
    data: {
      name: usr?.name,
      email: usr?.email,
      phone: usr?.phone,
      verified: !!usr?.verified,
      twoFactor: !!usr?.totpEnabled,
      shopName: sp?.shopName || 'My Reseller Shop',
      status: sp?.status || 'active',
      sellerCode: sp?.sellerCode || 'RSL-' + String(sp?._id).slice(-6).toUpperCase(),
      referralCode: sp?.referralCode,
      subscriptionEndsAt: sp?.subscriptionEndsAt,
      orders: {
        byStatus: Object.fromEntries(byStatus.map((r: any) => [r._id, r.n])),
        total: byStatus.reduce((a: number, r: any) => a + r.n, 0),
        today: today[0]?.n || 0
      },
      sales: totals[0]?.sales || 0,
      profit: totals[0]?.profit || 0,
      todaySales: today[0]?.sales || 0,
      todayProfit: today[0]?.profit || 0,
      wallet: {
        available: g('available'),
        pending: g('pending')
      },
      referralEarnings: ref[0]?.sum || 0,
      recentOrders
    }
  });
});
