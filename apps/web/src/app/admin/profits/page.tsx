'use client';

import { useState } from 'react';
import { tk, useApi } from '@/lib/api';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';

type OrderProfit = {
  _id: string;
  orderNo: string;
  total: number;
  customerPayable?: number;
  profit: number;
  status: string;
  createdAt: string;
  sellerId?: {
    _id: string;
    shopName?: string;
    sellerCode?: string;
  };
  customer?: {
    name: string;
    phone: string;
  };
};

export default function AdminProfitsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');

  const statusQuery = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
  const { data: orders, loading } = useApi<OrderProfit[]>(`/admin/profits${statusQuery}`);

  const filtered = (orders || []).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNo.toLowerCase().includes(q) ||
      o.sellerId?.shopName?.toLowerCase().includes(q) ||
      o.sellerId?.sellerCode?.toLowerCase().includes(q)
    );
  });

  const totalDeliveredProfit = filtered
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.profit || 0), 0);

  const totalPendingProfit = filtered
    .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'returned')
    .reduce((sum, o) => sum + (o.profit || 0), 0);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'delivered':
        return <span className="badge badge-success">Added to Wallet</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'shipped':
        return <span className="badge bg-blue-100 text-blue-800">In Transit (Pending)</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge bg-slate-100">{s}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reseller Profits & Commissions Ledger</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit earned profit margins per order, commission status, and dropship gross volume.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search Order No, Shop Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 !py-1.5 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Delivered Reseller Profit</span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700">{tk(totalDeliveredProfit)}</p>
          <p className="mt-1 text-xs text-emerald-800">Successfully credited to resellers' available wallet</p>
        </div>

        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Delivery Profit</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-amber-700">{tk(totalPendingProfit)}</p>
          <p className="mt-1 text-xs text-amber-800">Locked pending customer delivery by courier</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs">
        {['all', 'delivered', 'shipped', 'pending', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`rounded-full px-4 py-1.5 font-semibold capitalize transition ${
              selectedStatus === st
                ? 'bg-brand text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'all' ? 'All Orders' : st}
          </button>
        ))}
      </div>

      {/* Profit Ledger Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-bold">Order No</th>
                <th className="p-3.5 font-bold">Reseller Shop & Code</th>
                <th className="p-3.5 font-bold">Customer COD Collection</th>
                <th className="p-3.5 font-bold">Reseller Net Profit</th>
                <th className="p-3.5 font-bold">Date</th>
                <th className="p-3.5 font-bold">Commission Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    Loading profit records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No profit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-brand">{ord.orderNo}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{ord.sellerId?.shopName || 'Reseller Shop'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ord.sellerId?.sellerCode || 'RSL'}</p>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {tk(ord.customerPayable || ord.total)}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700 text-sm">
                      {tk(ord.profit)}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="p-3.5">{statusBadge(ord.status)}</td>
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
