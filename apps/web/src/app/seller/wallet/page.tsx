'use client';

import { useState } from 'react';
import { api, tk, useApi } from '@/lib/api';
import {
  Wallet,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

type Withdrawal = {
  _id: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  account: string;
  accountType?: string;
  status: 'pending' | 'approved' | 'rejected';
  reference?: string;
  note?: string;
  createdAt: string;
};

export default function ResellerWalletPage() {
  const { data: bal, reload: reloadBal } = useApi<{ available: number; pending: number }>('/wallet');
  const { data: withdrawals, loading, reload: reloadWd } = useApi<Withdrawal[]>('/withdrawals');

  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [accountType, setAccountType] = useState('personal');
  const [account, setAccount] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const available = bal?.available || 0;
  const pending = bal?.pending || 0;
  const totalApproved = (withdrawals || [])
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      return setMsg({ ok: false, text: 'Minimum withdrawal amount is 100 TK' });
    }
    if (numAmount > available) {
      return setMsg({ ok: false, text: `Insufficient funds. Your available balance is ${tk(available)}` });
    }
    if (!account.trim()) {
      return setMsg({ ok: false, text: 'Please enter a valid mobile or bank account number' });
    }

    setBusy(true);
    try {
      await api('/withdrawals', {
        body: {
          amount: numAmount,
          method,
          account,
          accountType
        }
      });

      setMsg({ ok: true, text: 'Withdrawal request submitted successfully! Admin will process and disburse funds shortly.' });
      setAmount('');
      setAccount('');
      reloadBal();
      reloadWd();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || 'Failed to submit withdrawal request' });
    } finally {
      setBusy(false);
    }
  }

  const methodLabel = (m: string) => {
    switch (m) {
      case 'bkash':
        return <span className="font-bold text-pink-600">bKash</span>;
      case 'nagad':
        return <span className="font-bold text-orange-600">Nagad</span>;
      case 'rocket':
        return <span className="font-bold text-purple-600">Rocket</span>;
      case 'bank':
        return <span className="font-bold text-blue-600">Bank Transfer</span>;
      default:
        return m;
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge bg-slate-100">{s}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profit Wallet & Withdrawals</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Transfer your dropshipping earnings directly to your bKash, Nagad, Rocket, or Bank account.
        </p>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Available for withdraw */}
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Available Balance</span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700">{tk(available)}</p>
          <p className="mt-2 text-xs text-emerald-800">Ready for instant cashout request</p>
        </div>

        {/* Pending delivery */}
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Profit</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-amber-700">{tk(pending)}</p>
          <p className="mt-2 text-xs text-amber-800">Credited upon parcel delivery by courier</p>
        </div>

        {/* Total withdrawn */}
        <div className="card bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Withdrawn</span>
            <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{tk(totalApproved)}</p>
          <p className="mt-2 text-xs text-slate-500">Lifetime payouts disbursed to your account</p>
        </div>
      </div>

      {/* Withdraw Request Form */}
      <div className="card">
        <h2 className="text-base font-bold text-slate-900 mb-1">Request Profit Payout</h2>
        <p className="text-xs text-slate-500 mb-4">
          Enter payout details below (Minimum withdrawal: 100 TK)
        </p>

        {msg && (
          <div
            className={`p-3 rounded-lg mb-4 text-xs font-medium ${
              msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Withdraw Amount (TK) *</label>
            <input
              type="number"
              min={100}
              max={available}
              required
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="input font-bold"
            />
            <span className="text-[10px] text-slate-400">Max {tk(available)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
            <select
              value={method}
              onChange={(e: any) => setMethod(e.target.value)}
              className="input font-medium"
            >
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="input"
            >
              <option value="personal">Personal</option>
              <option value="agent">Agent</option>
              <option value="bank_account">Bank Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / Account Number *</label>
            <input
              type="text"
              required
              placeholder="01XXXXXXXXX or Bank A/C"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="input"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              disabled={busy || available < 100}
              className="btn !py-2.5 !px-6 text-sm font-bold shadow-md"
            >
              {busy ? 'Submitting Request...' : 'Confirm Withdrawal'} <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>

      {/* Withdrawals History Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Withdrawal Payout History</h2>
            <p className="text-xs text-slate-500">History of all requested profit disbursements</p>
          </div>
          <span className="text-xs text-slate-400">Total Records: {withdrawals?.length || 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-bold">Date & Time</th>
                <th className="p-3.5 font-bold">Method</th>
                <th className="p-3.5 font-bold">Account Number</th>
                <th className="p-3.5 font-bold">Amount</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold">Admin TrxID / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    Loading payout history...
                  </td>
                </tr>
              ) : !withdrawals || withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No withdrawals requested yet.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 text-slate-500">
                      {new Date(w.createdAt).toLocaleString('en-US')}
                    </td>
                    <td className="p-3.5 font-semibold">{methodLabel(w.method)}</td>
                    <td className="p-3.5 font-mono text-slate-800">
                      {w.account} <span className="text-[10px] text-slate-400">({w.accountType || 'personal'})</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 text-sm">{tk(w.amount)}</td>
                    <td className="p-3.5">{statusBadge(w.status)}</td>
                    <td className="p-3.5">
                      {w.reference ? (
                        <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          TrxID: {w.reference}
                        </span>
                      ) : w.note ? (
                        <span className="text-slate-500 italic text-[11px]">{w.note}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Processing</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
