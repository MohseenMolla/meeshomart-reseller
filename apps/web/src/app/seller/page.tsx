'use client';

import Link from 'next/link';
import { tk } from '@/lib/api';
import { useOverview } from '@/lib/overview';
import {
  Wallet,
  TrendingUp,
  Package,
  Clock,
  ArrowRight,
  ShoppingBag,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

export default function ResellerOverview() {
  const o = useOverview();
  const s = o.orders.byStatus;
  const [copiedRef, setCopiedRef] = useState(false);

  const copyReferral = () => {
    if (typeof window !== 'undefined' && o.referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${o.referralCode}`);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'confirmed':
        return <span className="badge badge-info">Confirmed</span>;
      case 'packaging':
        return <span className="badge bg-purple-100 text-purple-800">Packaging</span>;
      case 'shipped':
        return <span className="badge bg-blue-100 text-blue-800">Shipped</span>;
      case 'delivered':
        return <span className="badge badge-success">Delivered</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="card bg-gradient-to-r from-brand-900 via-brand-800 to-brand-950 text-white p-6 shadow-md border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-brand-500/30 text-brand-100 border border-brand-400/30 text-xs">
                Reseller ID: {o.sellerCode || 'RSL-ACTIVE'}
              </span>
              <span className="badge bg-emerald-500 text-white text-xs">Active</span>
            </div>
            <h1 className="text-2xl font-black mt-2 tracking-tight">
              Welcome, {o.name || o.shopName}
            </h1>
            <p className="text-brand-100/80 text-xs sm:text-sm mt-1">
              Manage your dropshipping orders, wholesale products, and profit withdrawals from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/seller/catalog"
              className="btn bg-white hover:bg-slate-100 text-brand-900 font-bold text-xs sm:text-sm shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 text-brand" /> New Dropship Order
            </Link>
            <Link
              href="/seller/wallet"
              className="btn bg-accent hover:bg-accent-dark text-slate-950 font-bold text-xs sm:text-sm shadow-sm"
            >
              <Wallet className="w-4 h-4" /> Withdraw Profit
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available balance */}
        <div className="card bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Available Balance</span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-700">{tk(o.wallet.available)}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-emerald-800">
            <span>Ready for cashout</span>
            <Link href="/seller/wallet" className="font-bold underline">
              Withdraw Now
            </Link>
          </div>
        </div>

        {/* Pending balance */}
        <div className="card bg-amber-50/60 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Profit</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-700">{tk(o.wallet.pending)}</p>
          <p className="mt-2 text-xs text-amber-800">Credited to wallet upon successful delivery</p>
        </div>

        {/* Total profit earned */}
        <div className="card bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Profit Earned</span>
            <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{tk(o.profit)}</p>
          <p className="mt-2 text-xs text-slate-500">Lifetime earnings from delivered orders</p>
        </div>

        {/* Total orders */}
        <div className="card bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Orders</span>
            <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{o.orders.total}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Today: <b>{o.orders.today}</b></span>
            <span>Delivered: <b>{s.delivered || 0}</b></span>
          </div>
        </div>
      </div>

      {/* Order Status Pipeline */}
      <div className="card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          Order Delivery Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <span className="text-xs text-amber-800 font-medium">Pending</span>
            <p className="text-xl font-bold text-amber-900 mt-1">{s.pending || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <span className="text-xs text-blue-800 font-medium">Confirmed</span>
            <p className="text-xl font-bold text-blue-900 mt-1">{s.confirmed || 0}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
            <span className="text-xs text-purple-800 font-medium">Packaging</span>
            <p className="text-xl font-bold text-purple-900 mt-1">{s.packaging || 0}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
            <span className="text-xs text-indigo-800 font-medium">Shipped</span>
            <p className="text-xl font-bold text-indigo-900 mt-1">{s.shipped || 0}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-800 font-medium">Delivered</span>
            <p className="text-xl font-bold text-emerald-900 mt-1">{s.delivered || 0}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
            <span className="text-xs text-rose-800 font-medium">Cancelled</span>
            <p className="text-xl font-bold text-rose-900 mt-1">{s.cancelled || 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="card">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500">Track real-time shipment status and dropship profit</p>
          </div>
          <Link href="/seller/orders" className="btn-ghost text-xs">
            View All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {(!o.recentOrders || o.recentOrders.length === 0) ? (
          <div className="text-center py-8 text-slate-500 space-y-2">
            <p className="text-sm">No orders placed yet.</p>
            <Link href="/seller/catalog" className="btn text-xs inline-flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" /> Place First Order from Catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Order No</th>
                  <th className="p-3 font-semibold">Customer</th>
                  <th className="p-3 font-semibold">Cash Collection (COD)</th>
                  <th className="p-3 font-semibold">Your Profit</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Courier Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {o.recentOrders.map((ord: any) => (
                  <tr key={ord._id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-brand">{ord.orderNo}</td>
                    <td className="p-3">
                      <p className="font-medium text-slate-900">{ord.customer?.name}</p>
                      <p className="text-slate-500 text-[11px]">{ord.customer?.phone}</p>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{tk(ord.customerPayable || ord.total)}</td>
                    <td className="p-3 font-bold text-emerald-700">{tk(ord.profit)}</td>
                    <td className="p-3">{statusBadge(ord.status)}</td>
                    <td className="p-3 text-slate-600">
                      {ord.courier?.trackingCode ? (
                        <span className="font-mono bg-slate-100 px-2 py-1 rounded text-[11px]">
                          {ord.courier?.name}: {ord.courier?.trackingCode}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Referral Link & Earnings */}
      {o.referralCode && (
        <div className="card bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="badge bg-brand text-white text-[10px] font-bold">Referral Program</span>
            <h3 className="font-bold text-base">Earn passive commissions by referring fellow resellers!</h3>
            <p className="text-xs text-slate-400">
              Your referral code: <b className="text-brand-300 font-mono">{o.referralCode}</b>
            </p>
          </div>
          <button
            onClick={copyReferral}
            className="btn bg-white hover:bg-slate-100 text-slate-900 text-xs shrink-0 font-bold"
          >
            {copiedRef ? '✓ Link Copied' : 'Copy Referral Link'}
          </button>
        </div>
      )}
    </div>
  );
}
