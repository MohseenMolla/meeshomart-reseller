'use client';

import Link from 'next/link';
import { tk, useApi } from '@/lib/api';
import {
  Users,
  UserCheck,
  Package,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';

type AdminOverviewData = {
  sellers: number;
  activeSellers: number;
  pendingSellers: number;
  suspendedSellers: number;
  managers: number;
  maxManagers: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  products: number;
  pendingWithdrawals: number;
  totalResellerProfitPaid: number;
  totalPlatformSales: number;
};

export default function AdminOverview() {
  const { data, loading, error } = useApi<AdminOverviewData>('/admin/overview');

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading platform overview...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MeeshoMart Platform Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time control panel for resellers, managers, wholesale products, and financial volume.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/products" className="btn text-xs">
            <ShoppingBag className="w-3.5 h-3.5" /> Add New Product
          </Link>
          <Link href="/admin/orders" className="btn-ghost text-xs">
            <Package className="w-3.5 h-3.5" /> View All Orders
          </Link>
        </div>
      </div>

      {/* Role Hierarchy Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Managers quota */}
        <div className="card bg-slate-900 text-white border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Managers Team</span>
            <div className="p-2 rounded-lg bg-slate-800 text-brand-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.managers}</span>
            <span className="text-xs text-slate-400">/ 50 limit</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Quota usage</span>
            <Link href="/admin/managers" className="text-brand-400 hover:underline font-bold">
              Manage Staff
            </Link>
          </div>
        </div>

        {/* Resellers count */}
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Resellers</span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700">{data.sellers}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-emerald-800">
            <span>Active: <b>{data.activeSellers}</b></span>
            <span>Suspended: <b>{data.suspendedSellers}</b></span>
          </div>
        </div>

        {/* Active Products */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Live Products</span>
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-blue-700">{data.products}</p>
          <div className="mt-2 text-xs text-blue-800 flex items-center justify-between">
            <span>With multi-image Cloudinary</span>
            <Link href="/admin/products" className="font-bold underline">
              Manage Catalog
            </Link>
          </div>
        </div>

        {/* Total Orders */}
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Total Orders</span>
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-purple-700">{data.totalOrders}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-purple-800">
            <span>Pending: <b>{data.pendingOrders}</b></span>
            <span>Delivered: <b>{data.deliveredOrders}</b></span>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Platform Sales</span>
          <p className="mt-2 text-2xl font-black text-slate-900">{tk(data.totalPlatformSales)}</p>
          <p className="mt-1 text-xs text-slate-500">Gross customer COD cash volume</p>
        </div>

        <div className="card">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Disbursed Reseller Profits</span>
          <p className="mt-2 text-2xl font-black text-emerald-600">{tk(data.totalResellerProfitPaid)}</p>
          <p className="mt-1 text-xs text-slate-500">Net profits paid out to verified resellers</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Withdrawals</span>
            <span className="badge badge-warning text-[10px]">{data.pendingWithdrawals} Pending</span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{data.pendingWithdrawals}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-amber-800">
            <span>Requires verification & approval</span>
            <Link href="/admin/withdrawals" className="font-bold underline">
              Process Now
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/admin/orders"
          className="card p-5 hover:border-brand/40 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-brand transition">Order Processing & Couriers</h3>
            <p className="text-xs text-slate-500 mt-0.5">Confirm, pack, and assign Steadfast/Pathao tracking codes</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/admin/products"
          className="card p-5 hover:border-brand/40 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-brand transition">Products & Cloudinary Upload</h3>
            <p className="text-xs text-slate-500 mt-0.5">Add wholesale catalog items with multi-image gallery support</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/admin/sellers"
          className="card p-5 hover:border-brand/40 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-brand transition">Resellers Directory</h3>
            <p className="text-xs text-slate-500 mt-0.5">Inspect reseller accounts, contact numbers, and sales performance</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition" />
        </Link>
      </div>
    </div>
  );
}
