import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth, requireRole, requireActiveSeller, AuthReq } from '../middleware/auth';
import { Withdrawal, WalletTransaction } from '../models';
import { availableBalance, lockWallet, MIN_WITHDRAWAL } from '../services/ledger';

export const withdrawals = Router();
withdrawals.use(requireAuth, requireRole('seller', 'reseller'));

withdrawals.post('/', requireActiveSeller, async (req: AuthReq, res) => {
  const d = z.object({
    amount: z.number().int().min(MIN_WITHDRAWAL, `সর্বনিম্ন উত্তোলনের পরিমাণ ৳${MIN_WITHDRAWAL}`),
    method: z.enum(['bkash', 'nagad', 'rocket', 'bank']),
    account: z.string().min(5),
    accountType: z.string().optional().default('personal')
  }).parse(req.body);

  const sellerId = req.auth!.sellerId!;
  const s = await mongoose.startSession();
  let w: any;

  try {
    await s.withTransaction(async () => {
      await lockWallet(sellerId, s);
      const balance = await availableBalance(sellerId, s);
      if (balance < d.amount) throw new Error(`পর্যাপ্ত ব্যালেন্স নেই। আপনার উপলব্ধ ব্যালেন্স: ৳${balance}`);
      [w] = await Withdrawal.create([{ sellerId, ...d }], { session: s });
      await WalletTransaction.create([{
        sellerId,
        type: 'withdrawal',
        amount: -d.amount,
        status: 'available',
        ref: String(w._id),
        note: `Withdrawal request via ${d.method} to ${d.account}`
      }], { session: s });
    });
  } catch (e: any) {
    return res.status(409).json({ success: false, error: e.message });
  } finally {
    await s.endSession();
  }

  res.status(201).json({ success: true, data: w });
});

withdrawals.get('/', async (req: AuthReq, res) => {
  res.json({
    success: true,
    data: await Withdrawal.find({ sellerId: req.auth!.sellerId }).sort({ createdAt: -1 }).limit(50).lean()
  });
});
