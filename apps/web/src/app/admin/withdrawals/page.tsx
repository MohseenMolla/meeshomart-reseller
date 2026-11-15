'use client';

import { useState } from 'react';
import { api, tk, useApi } from '@/lib/api';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';

type Withdrawal = {
  _id: string;
  sellerId?: {
    _id: string;
    shopName?: string;
    sellerCode?: string;
    phone?: string;
  };
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  account: string;
  accountType?: string;
  status: 'pending' | 'approved' | 'rejected';
  reference?: string;
  note?: string;
  createdAt: string;
};

export default function AdminWithdrawalsPage() {
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const { data: withdrawals, loading, reload } = useApi<Withdrawal[]>(
    `/admin/withdrawals${selectedStatus !== 'all' ? `?status=${selectedStatus}` : '?status=all'}`
  );

  const [activeModal, setActiveModal] = useState<{
    id: string;
    action: 'approved' | 'rejected';
    amount: number;
    method: string;
    account: string;
    shop: string;
  } | null>(null);

  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeModal) return;

    if (activeModal.action === 'approved' && !reference.trim()) {
      return alert('Please enter the payment TrxID / reference number.');
    }

    setBusy(true);
    setMsg(null);
    try {
      await api(`/admin/withdrawals/${activeModal.id}/review`, {
        body: {
          decision: activeModal.action,
          reference: reference || undefined,
          note: note || undefined
        }
      });

      setMsg({
        ok: true,
        text: activeModal.action === 'approved'
          ? 'Withdrawal payout approved and TrxID recorded!'
          : 'Withdrawal rejected and funds refunded to reseller wallet.'
      });
      setActiveModal(null);
      setReference('');
      setNote('');
      reload();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message });
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Withdrawal Approvals & Cashout</h1>
            <span className="badge bg-slate-900 text-white font-bold text-xs">Super Admin Disbursal</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Review reseller cashout requests, disburse payments via bKash/Nagad/Bank, and log TrxIDs.
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 text-xs">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`rounded-full px-4 py-1.5 font-semibold capitalize transition ${
              selectedStatus === st
                ? 'bg-brand text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'pending'
              ? 'Pending'
              : st === 'approved'
              ? 'Approved'
              : st === 'rejected'
              ? 'Rejected'
              : 'All Requests'}
          </button>
        ))}
      </div>

      {/* Withdrawals List / Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-bold">Date & Time</th>
                <th className="p-3.5 font-bold">Reseller Shop & Code</th>
                <th className="p-3.5 font-bold">Amount</th>
                <th className="p-3.5 font-bold">Payment Method & Account</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold">TrxID / Reference</th>
                <th className="p-3.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    Loading requests...
                  </td>
                </tr>
              ) : !withdrawals || withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No withdrawal requests in this category.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 text-slate-500">
                      {new Date(w.createdAt).toLocaleString('en-US')}
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{w.sellerId?.shopName || 'Reseller'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{w.sellerId?.sellerCode || 'RSL'}</p>
                    </td>

                    <td className="p-3.5 font-black text-slate-900 text-sm">
                      {tk(w.amount)}
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold">{methodLabel(w.method)}</p>
                      <p className="font-mono text-slate-700 text-[11px] font-semibold">
                        {w.account} <span className="text-[10px] text-slate-400">({w.accountType || 'personal'})</span>
                      </p>
                    </td>

                    <td className="p-3.5">{statusBadge(w.status)}</td>

                    <td className="p-3.5">
                      {w.reference ? (
                        <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          TrxID: {w.reference}
                        </span>
                      ) : w.note ? (
                        <span className="text-slate-500 italic text-[11px]">{w.note}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {w.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() =>
                              setActiveModal({
                                id: w._id,
                                action: 'approved',
                                amount: w.amount,
                                method: w.method,
                                account: w.account,
                                shop: w.sellerId?.shopName || 'Reseller'
                              })
                            }
                            className="btn !py-1 !px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 font-bold"
                          >
                            Approve (Pay)
                          </button>
                          <button
                            onClick={() =>
                              setActiveModal({
                                id: w._id,
                                action: 'rejected',
                                amount: w.amount,
                                method: w.method,
                                account: w.account,
                                shop: w.sellerId?.shopName || 'Reseller'
                              })
                            }
                            className="btn-ghost !py-1 !px-2 text-[11px] text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              {activeModal.action === 'approved' ? '✅ Approve Payout & Enter TrxID' : '❌ Reject Payout & Refund Wallet'}
            </h3>

            {/* Target details */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">Shop: <b>{activeModal.shop}</b></p>
              <p className="text-slate-600">Amount: <b className="text-slate-900 text-sm">{tk(activeModal.amount)}</b></p>
              <p className="text-slate-600">Method & A/C: <b className="text-brand font-mono">{activeModal.method.toUpperCase()} - {activeModal.account}</b></p>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3 text-xs">
              {activeModal.action === 'approved' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Disbursement TrxID / Reference *
                  </label>
                  <input
                    required
                    placeholder="e.g. BK-992182 or TrxID"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="input font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter the transaction ID received after sending the money.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rejection Reason (Optional)</label>
                  <input
                    placeholder="e.g. Invalid account number or flagged account"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input"
                  />
                  <p className="text-[10px] text-red-600 mt-1">
                    * Rejecting will automatically refund {tk(activeModal.amount)} back to the reseller's available wallet.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className={`btn flex-1 !py-2 font-bold ${
                    activeModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {busy ? 'Processing...' : activeModal.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
