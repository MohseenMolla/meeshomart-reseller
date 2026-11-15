'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tk, useApi } from '@/lib/api';
import {
  Package,
  Search,
  Eye,
  X,
  Truck,
  ShoppingBag,
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
  history?: {
    status: string;
    at: string;
    note?: string;
  }[];
};

export default function ResellerOrdersPage() {
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const statusQuery = selectedStatus !== 'all' ? `&status=${selectedStatus}` : '';
  const { data: orders, loading, error, reload } = useApi<Order[]>(`/orders?page=${page}${statusQuery}`);

  const statusList = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

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
        return <span className="badge badge-success">Delivered (Profit Added)</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      case 'returned':
        return <span className="badge bg-slate-200 text-slate-800">Returned</span>;
      default:
        return <span className="badge bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const filtered = (orders || []).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNo.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.courier?.trackingCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Customer Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor real-time fulfillment status, courier tracking numbers, and dropship profit margins.
          </p>
        </div>

        <Link href="/seller/catalog" className="btn text-xs sm:text-sm self-start sm:self-auto">
          <ShoppingBag className="w-4 h-4" /> Place Dropship Order
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {statusList.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setSelectedStatus(st.id);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === st.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
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

      {/* Orders Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-bold">Order No & Date</th>
                <th className="p-3.5 font-bold">Customer Info</th>
                <th className="p-3.5 font-bold">COD Cash Collection</th>
                <th className="p-3.5 font-bold">Your Profit</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold">Courier & Tracking</th>
                <th className="p-3.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    Loading orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-brand">{ord.orderNo}</p>
                      <p className="text-[11px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString('en-US')}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{ord.customer?.name}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{ord.customer?.phone}</p>
                      <p className="text-slate-400 text-[10px] truncate max-w-xs">{ord.customer?.address}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{tk(ord.customerPayable || ord.total)}</p>
                      <p className="text-[10px] text-slate-400">Delivery: {tk(ord.deliveryCharge || 0)}</p>
                    </td>

                    <td className="p-3.5 font-bold text-emerald-700 text-sm">
                      {tk(ord.profit)}
                    </td>

                    <td className="p-3.5">{statusBadge(ord.status)}</td>

                    <td className="p-3.5">
                      {ord.courier?.trackingCode ? (
                        <div>
                          <span className="font-semibold text-slate-800 text-[11px] block">{ord.courier.name}</span>
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200">
                            #{ord.courier.trackingCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Courier Pending</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setViewOrder(ord)}
                        className="btn-ghost !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Page: {page}</span>
          <div className="flex gap-2">
            <button
              className="btn-ghost !py-1 !px-3"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn-ghost !py-1 !px-3"
              disabled={(filtered.length || 0) < 20}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-lg bg-white p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setViewOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Order Number</span>
                <h3 className="text-lg font-black font-mono text-brand">{viewOrder.orderNo}</h3>
              </div>
              <div className="mr-8">{statusBadge(viewOrder.status)}</div>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Customer Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Customer Delivery Details</p>
                <p className="font-semibold text-slate-900">{viewOrder.customer?.name}</p>
                <p className="text-slate-600 font-mono">Phone: {viewOrder.customer?.phone}</p>
                <p className="text-slate-600">Address: {viewOrder.customer?.address}</p>
                <p className="text-slate-500">Area: {viewOrder.customer?.district}</p>
              </div>

              {/* Items List */}
              <div>
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Ordered Products</p>
                <div className="space-y-2">
                  {viewOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <Link
                          href={`/product/${item.productId?.sku || item.productId?._id || item.productId || ''}`}
                          target="_blank"
                          className="font-semibold text-slate-900 hover:text-brand transition inline-flex items-center gap-1 group"
                          title="View live product details page"
                        >
                          <span>{item.name || item.productId?.name || 'Product'}</span>
                          <ExternalLink className="w-3 h-3 text-brand opacity-60 group-hover:opacity-100" />
                        </Link>
                        <p className="text-slate-500 text-[11px]">
                          Qty: {item.qty} pcs × Customer Price {tk(item.unitPrice)}
                        </p>
                        <p className="text-slate-400 text-[10px]">Wholesale Cost: {tk(item.wholesale)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{tk(item.unitPrice * item.qty)}</span>
                        <p className="text-emerald-700 font-bold text-[11px]">
                          Profit: {tk((item.unitPrice - item.wholesale) * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courier info */}
              {viewOrder.courier?.name && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <Truck className="w-4 h-4" /> Courier Delivery Update
                  </div>
                  <p className="text-blue-800">Courier: <b>{viewOrder.courier.name}</b></p>
                  <p className="text-blue-800 font-mono">Tracking Code: <b>{viewOrder.courier.trackingCode}</b></p>
                  {viewOrder.courier.notes && <p className="text-blue-600 text-[11px]">Notes: {viewOrder.courier.notes}</p>}
                </div>
              )}

              {/* Financial summary */}
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Product Subtotal:</span>
                  <span>{tk(viewOrder.total)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Courier Charge:</span>
                  <span>{tk(viewOrder.deliveryCharge || 0)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-sm text-accent">
                  <span>Customer Total COD Payable:</span>
                  <span>{tk(viewOrder.customerPayable || viewOrder.total)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between font-black text-sm text-emerald-400">
                  <span>Your Net Profit Earned:</span>
                  <span>{tk(viewOrder.profit)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={() => setViewOrder(null)} className="btn w-full !py-2">
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
