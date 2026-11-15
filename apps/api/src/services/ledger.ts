import mongoose, { ClientSession } from 'mongoose';
import { WalletTransaction, Wallet } from '../models';

export const MIN_WITHDRAWAL = 100; // Minimum withdrawal ৳100

export const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'packaging', 'cancelled'],
  confirmed: ['packaging', 'shipped', 'cancelled'],
  processing: ['packaging', 'shipped', 'cancelled'],
  packaging: ['shipped', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned', 'refunded'],
  returned: ['refunded'],
  cancelled: [],
  refunded: []
};

export const canTransition = (from: string, to: string) => {
  if (from === to) return true;
  return (TRANSITIONS[from] || []).includes(to);
};

export async function availableBalance(sellerId: any, s?: ClientSession) {
  const r = await WalletTransaction.aggregate([
    { $match: { sellerId: new mongoose.Types.ObjectId(String(sellerId)), status: 'available' } },
    { $group: { _id: null, sum: { $sum: '$amount' } } }
  ]).session(s || null);
  return r[0]?.sum || 0;
}

/** Serialises per-seller money operations: concurrent txns conflict on the same Wallet doc. */
export const lockWallet = (sellerId: any, s: ClientSession) =>
  Wallet.updateOne({ sellerId }, { $inc: { version: 1 } }, { upsert: true, session: s, strict: false });
