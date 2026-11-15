'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ShoppingBag,
  Truck,
  ArrowRight,
  Clock,
  Package
} from 'lucide-react';

type TrackResult = {
  orderNo: string;
  status: string;
  courier?: {
    name: string;
    trackingCode: string;
    notes?: string;
  };
  timeline: { status: string; at: string; note?: string }[];
};

export default function TrackPage() {
  const [orderNo, setOrderNo] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setResult(null);
    setBusy(true);

    try {
      const data = await api<TrackResult>('/stores/track/lookup', {
        body: {
          orderNo: orderNo.trim(),
          phone: phone.trim()
        }
      });
      setResult(data);
    } catch (x: any) {
      setErr(x.message || 'Tracking information not found. Please verify Order No and Phone number.');
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
      default:
        return <span className="badge bg-slate-100">{s}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-slate-900">
                Parcel & Order Tracking
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your Order Number and Mobile Number to check real-time delivery status.
              </p>
            </div>

            <form onSubmit={handleTrack} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Number *</label>
                <input
                  required
                  placeholder="e.g. ORDF10D93D0"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="input font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Mobile Number *</label>
                <input
                  required
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input font-mono"
                />
              </div>

              {err && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-lg bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-sm shadow-md transition"
              >
                {busy ? 'Searching tracking...' : 'Track Order'}
              </button>
            </form>

            {/* Results Display */}
            {result && (
              <div className="mt-6 pt-5 border-t border-slate-200 space-y-4 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500">Order Number</span>
                    <p className="font-mono font-bold text-brand text-sm">{result.orderNo}</p>
                  </div>
                  <div>{statusBadge(result.status)}</div>
                </div>

                {result.courier?.name && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                      <Truck className="w-4 h-4" /> Courier Details
                    </div>
                    <p className="text-blue-800">Courier: <b>{result.courier.name}</b></p>
                    <p className="text-blue-800 font-mono">Consignment / Tracking: <b>{result.courier.trackingCode}</b></p>
                  </div>
                )}

                {/* Timeline */}
                {result.timeline && result.timeline.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="font-bold text-slate-800 text-[11px]">Fulfillment Timeline</p>
                    <div className="space-y-2">
                      {result.timeline.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-800 capitalize">{item.status}</p>
                            <p className="text-[10px] text-slate-400">{new Date(item.at).toLocaleString('en-US')}</p>
                            {item.note && <p className="text-[11px] text-slate-500">{item.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
