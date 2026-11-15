'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, tk, useApi } from '@/lib/api';
import { NEXT } from '@/lib/transitions';
import {
  Package,
  Search,
  Truck,
  Eye,
  X,
  ExternalLink
} from 'lucide-react';

type Order = {
  _id: string;
  orderNo: string;
  status: string;
  total: number;
  deliveryCharge?: number;
  customerPayable?: number;
  profit: number;
  createdAt: string;
  sellerId?: {
    _id: string;
    shopName?: string;
    sellerCode?: string;
    phone?: string;
  };
  customer: {
    name: string;
    phone: string;
    address: string;
    district: string;
  };
  courier?: {
    name: string;
    trackingCode: string;
    notes?: string;
  };
  items: {
    productId?: any;
    name?: string;
    qty: number;
    unitPrice: number;
    wholesale: number;
  }[];
};

export default function AdminOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [courierOrder, setCourierOrder] = useState<Order | null>(null);
  const [courierForm, setCourierForm] = useState({
    name: 'Steadfast Courier',
    trackingCode: '',
    notes: ''
  });

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const query = `${selectedStatus ? `?status=${selectedStatus}` : `?page=${page}`}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
  const { data: orders, loading, reload } = useApi<Order[]>(`/admin/orders${query}`);

  async function handleStatusChange(id: string, to: string) {
    setMsg(null);
    try {
      await api(`/admin/orders/${id}/status`, { body: { status: to } });
      setMsg({ ok: true, text: `Order status successfully transitioned to "${to}".` });
      reload();
      if (detailOrder && detailOrder._id === id) {
        setDetailOrder(null);
      }
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  }

  async function handleCourierSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courierOrder) return;
    setBusy(true);
    try {
      await api(`/admin/orders/${courierOrder._id}/courier`, {
        body: courierForm
      });
      setMsg({ ok: true, text: 'Courier and tracking consignment updated successfully!' });
      setCourierOrder(null);
      reload();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const statusBadge = (s: string) => {
    switch (s) {
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
      case 'returned':
        return <span className="badge bg-slate-200 text-slate-800">Returned</span>;
      default:
        return <span className="badge bg-slate-100">{s}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Management & Fulfillment</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Process dropship orders, assign Steadfast/Pathao couriers, and advance workflow status.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search Order No, Phone, Tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 !py-1.5 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Notification alert */}
      {msg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Status Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedStatus('')}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
            selectedStatus === ''
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Orders
        </button>
        {Object.keys(NEXT).map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === st
                ? 'bg-brand text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-bold">Order No</th>
                <th className="p-3.5 font-bold">Reseller Shop</th>
                <th className="p-3.5 font-bold">Customer Info</th>
                <th className="p-3.5 font-bold">COD Cash Collection</th>
                <th className="p-3.5 font-bold">Reseller Profit</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold">Courier & Tracking</th>
                <th className="p-3.5 font-bold text-center">Fulfill / Next State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                    Loading orders...
                  </td>
                </tr>
              ) : !orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const allowedNext = NEXT[ord.status] || [];

                  return (
                    <tr key={ord._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-brand block">{ord.orderNo}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString('en-US')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{ord.sellerId?.shopName || 'Reseller'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {ord.sellerId?.sellerCode || 'RSL'}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{ord.customer?.name}</p>
                        <p className="font-mono text-slate-600 text-[11px]">{ord.customer?.phone}</p>
                        <p className="text-slate-400 text-[10px] truncate max-w-xs">{ord.customer?.address}</p>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">
                        {tk(ord.customerPayable || ord.total)}
                      </td>

                      <td className="p-3.5 font-bold text-emerald-700">
                        {tk(ord.profit)}
                      </td>

                      <td className="p-3.5">{statusBadge(ord.status)}</td>

                      <td className="p-3.5">
                        {ord.courier?.trackingCode ? (
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] block">{ord.courier.name}</span>
                            <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[10px] border border-blue-200">
                              #{ord.courier.trackingCode}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setCourierOrder(ord);
                              setCourierForm({
                                name: 'Steadfast Courier',
                                trackingCode: '',
                                notes: ''
                              });
                            }}
                            className="btn-ghost !py-1 !px-2 text-[10px] text-brand border-brand/30 hover:bg-brand-50"
                          >
                            + Assign Courier
                          </button>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailOrder(ord)}
                            className="btn-ghost !py-1 !px-2 text-[10px]"
                            title="View details"
                          >
                            <Eye className="w-3 h-3 text-slate-500" /> Details
                          </button>

                          {allowedNext.map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(ord._id, st)}
                              className={`btn !py-1 !px-2 text-[10px] ${
                                st === 'delivered'
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : st === 'cancelled'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-slate-800 hover:bg-slate-900'
                              }`}
                            >
                              → {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Modal */}
      {courierOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setCourierOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck className="w-5 h-5 text-brand" />
              <h2 className="text-base font-bold text-slate-900">Assign Courier & Tracking Code</h2>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Order No: <b className="font-mono text-slate-800">{courierOrder.orderNo}</b> ({courierOrder.customer?.name})
            </p>

            <form onSubmit={handleCourierSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courier Service *</label>
                <select
                  value={courierForm.name}
                  onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                  className="input font-medium"
                >
                  <option value="Steadfast Courier">Steadfast Courier</option>
                  <option value="Pathao Courier">Pathao Courier</option>
                  <option value="RedX Logistics">RedX Logistics</option>
                  <option value="Paperfly">Paperfly</option>
                  <option value="eCourier">eCourier</option>
                  <option value="Sundarban Courier">Sundarban Courier</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tracking Code / Consignment ID *</label>
                <input
                  required
                  placeholder="e.g. STDF-109283 or CID-9921"
                  value={courierForm.trackingCode}
                  onChange={(e) => setCourierForm({ ...courierForm, trackingCode: e.target.value })}
                  className="input font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courier Notes (Optional)</label>
                <input
                  placeholder="e.g. Parcel picked up from warehouse"
                  value={courierForm.notes}
                  onChange={(e) => setCourierForm({ ...courierForm, notes: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={busy} className="btn flex-1 !py-2 font-bold">
                  {busy ? 'Saving...' : 'Save Courier Info'}
                </button>
                <button
                  type="button"
                  onClick={() => setCourierOrder(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-lg bg-white p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setDetailOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Order Details</span>
                <h3 className="text-lg font-black font-mono text-brand">{detailOrder.orderNo}</h3>
              </div>
              <div className="mr-8">{statusBadge(detailOrder.status)}</div>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Reseller Box */}
              <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-200">
                <p className="font-bold text-brand-900 uppercase tracking-wider text-[10px]">Reseller Shop</p>
                <p className="font-semibold text-slate-900">{detailOrder.sellerId?.shopName || 'Reseller Store'}</p>
                <p className="text-slate-600 font-mono">ID: {detailOrder.sellerId?.sellerCode || 'RSL'}</p>
              </div>

              {/* Customer Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Customer Delivery Details</p>
                <p className="font-semibold text-slate-900">{detailOrder.customer?.name}</p>
                <p className="text-slate-600 font-mono">Phone: {detailOrder.customer?.phone}</p>
                <p className="text-slate-600">Address: {detailOrder.customer?.address}</p>
                <p className="text-slate-500">District: {detailOrder.customer?.district}</p>
              </div>

              {/* Items List */}
              <div>
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Ordered Products</p>
                <div className="space-y-2">
                  {detailOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <Link
                          href={`/product/${item.productId?.sku || item.productId?._id || item.productId || ''}`}
                          target="_blank"
                          className="font-semibold text-slate-900 hover:text-brand transition inline-flex items-center gap-1 group"
                          title="View live product details"
                        >
                          <span>{item.name || item.productId?.name || 'Product'}</span>
                          <ExternalLink className="w-3 h-3 text-brand opacity-60 group-hover:opacity-100" />
                        </Link>
                        <p className="text-slate-500 text-[11px]">Qty: {item.qty} pcs</p>
                        <p className="text-slate-400 text-[10px]">Wholesale: {tk(item.wholesale)} | Customer Price: {tk(item.unitPrice)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{tk(item.unitPrice * item.qty)}</span>
                        <p className="text-emerald-700 font-bold text-[11px]">
                          Reseller Profit: {tk((item.unitPrice - item.wholesale) * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary */}
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Product Subtotal:</span>
                  <span>{tk(detailOrder.total)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charge:</span>
                  <span>{tk(detailOrder.deliveryCharge || 0)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-sm text-accent">
                  <span>Customer Cash on Delivery (COD):</span>
                  <span>{tk(detailOrder.customerPayable || detailOrder.total)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between font-black text-sm text-emerald-400">
                  <span>Reseller Net Profit:</span>
                  <span>{tk(detailOrder.profit)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={() => setDetailOrder(null)} className="btn w-full !py-2">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
