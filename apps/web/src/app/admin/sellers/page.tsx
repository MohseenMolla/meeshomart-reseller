'use client';

import { useState } from 'react';
import { api, tk, useApi } from '@/lib/api';
import {
  UserCheck,
  Search,
  X
} from 'lucide-react';

type Seller = {
  _id: string;
  shopName: string;
  sellerCode?: string;
  phone?: string;
  address?: string;
  status: string;
  totalOrders?: number;
  totalProfit?: number;
  createdAt: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
  };
};

export default function AdminSellersPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [suspendModal, setSuspendModal] = useState<{ id: string; name: string; targetStatus: 'active' | 'suspended' } | null>(null);
  const [reason, setReason] = useState('Policy violation or unverified activity');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const query = `${status !== 'all' ? `?status=${status}` : ''}${search ? `${status !== 'all' ? '&' : '?'}q=${encodeURIComponent(search)}` : ''}`;
  const { data: sellers, loading, reload } = useApi<Seller[]>(`/admin/sellers${query}`);

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendModal) return;
    setBusy(true);
    setMsg(null);

    try {
      await api(`/admin/sellers/${suspendModal.id}/status`, {
        body: {
          status: suspendModal.targetStatus,
          reason
        }
      });
      setMsg({ ok: true, text: `Reseller status successfully updated to "${suspendModal.targetStatus}".` });
      setSuspendModal(null);
      reload();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'suspended':
        return <span className="badge badge-danger">Suspended</span>;
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reseller Directory</h1>
            <span className="badge bg-emerald-100 text-emerald-800 font-bold text-xs">Unlimited Resellers</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit registered dropshippers, view contact phones, track lifetime earnings, and manage access.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search Shop, Phone, Reseller Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 !py-1.5 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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

      {/* Filter tabs */}
      <div className="flex gap-2 text-xs">
        {['all', 'active', 'pending', 'suspended'].map((st) => (
          <button
            key={st}
            onClick={() => setStatus(st)}
            className={`rounded-full px-4 py-1.5 font-semibold capitalize transition ${
              status === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'all' ? 'All Resellers' : st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-bold">Reseller Shop & Code</th>
                <th className="p-3.5 font-bold">Owner Name & Email</th>
                <th className="p-3.5 font-bold">Contact Phone</th>
                <th className="p-3.5 font-bold">Total Orders</th>
                <th className="p-3.5 font-bold">Earned Profit</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    Loading resellers...
                  </td>
                </tr>
              ) : !sellers || sellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No resellers found matching your criteria.
                  </td>
                </tr>
              ) : (
                sellers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{s.shopName}</p>
                      <p className="text-[10px] font-mono text-brand font-semibold">{s.sellerCode || 'RSL'}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{s.userId?.name || 'Reseller'}</p>
                      <p className="text-slate-500 text-[11px]">{s.userId?.email}</p>
                    </td>

                    <td className="p-3.5 font-mono text-slate-700">
                      {s.userId?.phone || s.phone || '-'}
                    </td>

                    <td className="p-3.5 font-bold text-slate-800">
                      {s.totalOrders || 0} orders
                    </td>

                    <td className="p-3.5 font-bold text-emerald-700">
                      {tk(s.totalProfit || 0)}
                    </td>

                    <td className="p-3.5">{statusBadge(s.status)}</td>

                    <td className="p-3.5 text-center">
                      {s.status === 'suspended' ? (
                        <button
                          onClick={() => setSuspendModal({ id: s._id, name: s.shopName, targetStatus: 'active' })}
                          className="btn-ghost !py-1 !px-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setSuspendModal({ id: s._id, name: s.shopName, targetStatus: 'suspended' })}
                          className="btn-ghost !py-1 !px-2 text-[11px] text-red-600 hover:bg-red-50"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSuspendModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Change Reseller Status
            </h3>

            <p className="mt-3 text-xs text-slate-600">
              Are you sure you want to change shop <b>{suspendModal.name}</b> status to{' '}
              <b className={suspendModal.targetStatus === 'suspended' ? 'text-red-600' : 'text-emerald-600'}>
                {suspendModal.targetStatus === 'suspended' ? 'Suspended' : 'Active'}
              </b>?
            </p>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Internal Note *</label>
                <input
                  required
                  placeholder="e.g. Terms violation or requested reactivation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className={`btn flex-1 !py-2 font-bold ${
                    suspendModal.targetStatus === 'suspended' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {busy ? 'Updating...' : 'Confirm Status Change'}
                </button>
                <button
                  type="button"
                  onClick={() => setSuspendModal(null)}
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
