'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, tk, useApi } from '@/lib/api';
import { imgUrl } from '@/lib/img';
import {
  ShoppingBag,
  Search,
  Copy,
  Check,
  Download,
  X,
  Plus,
  Minus,
  Truck,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye
} from 'lucide-react';

type Product = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  reserved?: number;
  active: boolean;
  images?: { url: string; publicId: string }[];
};

function CatalogContent() {
  const searchParams = useSearchParams();
  const prefillSku = searchParams.get('orderSku');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Dropship order modal state
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);
  const [customerSellingPrice, setCustomerSellingPrice] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'sub_area' | 'outside'>('dhaka');
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    district: 'Dhaka',
    notes: ''
  });
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fetch wholesale catalog
  const { data: products, loading, reload } = useApi<Product[]>('/products/wholesale');

  // Handle prefill SKU if passed from URL
  useEffect(() => {
    if (prefillSku && products && products.length > 0) {
      const found = products.find((p) => p.sku === prefillSku);
      if (found) {
        startOrder(found);
      }
    }
  }, [prefillSku, products]);

  const categories = [
    'all',
    'Winter Collection',
    "Men's Fashion",
    "Women's Fashion",
    'Home & Lifestyle',
    'Gadgets & Electronics',
    'Kids Zone',
    'Foods',
    'Others'
  ];

  const filtered = (products || []).filter((p) => {
    const matchCat =
      selectedCat === 'all' ||
      (p.category && p.category.toLowerCase() === selectedCat.toLowerCase());
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const startOrder = (p: Product) => {
    setOrderingProduct(p);
    setCustomerSellingPrice(p.retailPrice);
    setQty(1);
    setOrderError(null);
    setOrderSuccess(null);
  };

  const handleCopyDetails = (p: Product) => {
    const text = `🔹 Product: ${p.name}\n🔖 SKU / Code: ${p.sku}\n💵 Retail MRP: ${tk(p.retailPrice)}\n\n📝 Description:\n${p.description || ''}\n\n🚚 Cash on Delivery available nationwide! Call/WhatsApp: 01410449778`;
    navigator.clipboard.writeText(text);
    setCopiedSku(p.sku);
    setTimeout(() => setCopiedSku(null), 2500);
  };

  const deliveryCharge =
    deliveryArea === 'dhaka' ? 60 : deliveryArea === 'sub_area' ? 100 : 120;
  const unitProfit = orderingProduct ? customerSellingPrice - orderingProduct.wholesalePrice : 0;
  const totalProfit = unitProfit * qty;
  const customerSubtotal = customerSellingPrice * qty;
  const customerTotalPayable = customerSubtotal + deliveryCharge;

  async function handlePlaceDropshipOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!orderingProduct) return;
    setOrderError(null);

    if (customerSellingPrice < orderingProduct.wholesalePrice) {
      return setOrderError(`Customer selling price cannot be lower than wholesale price (${tk(orderingProduct.wholesalePrice)})`);
    }

    if (!/^01[3-9]\d{8}$/.test(customer.phone)) {
      return setOrderError('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01731517072)');
    }

    setOrderBusy(true);
    try {
      const res = await api<{ orderNo: string }>('/orders', {
        body: {
          items: [
            {
              productId: orderingProduct._id,
              qty,
              unitPrice: customerSellingPrice
            }
          ],
          customer: {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            district:
              deliveryArea === 'dhaka'
                ? 'Inside Dhaka'
                : deliveryArea === 'sub_area'
                ? 'Dhaka Sub Area'
                : customer.district || 'Outside Dhaka'
          },
          deliveryCharge,
          notes: customer.notes
        }
      });

      setOrderSuccess(`Order placed successfully! Order No: ${res.orderNo}`);
      setTimeout(() => {
        setOrderingProduct(null);
        setOrderSuccess(null);
        reload();
      }, 3000);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place dropship order');
    } finally {
      setOrderBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Order products directly at wholesale dropshipper prices. We pick, pack, and deliver to your customer!
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 !py-1.5 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              selectedCat === cat
                ? 'bg-brand text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 font-medium">Loading wholesale catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">No products found matching your search.</div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const margin = p.retailPrice - p.wholesalePrice;
            const mainImg = p.images?.[0]?.url;

            return (
              <div key={p._id} className="card !p-0 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div>
                  {/* Photo container */}
                  <Link
                    href={`/product/${p.sku || p._id}`}
                    target="_blank"
                    className="block relative aspect-square bg-slate-100 overflow-hidden group/img"
                    title="Click to view product details"
                  >
                    {mainImg ? (
                      <img
                        src={imgUrl(mainImg, 400)}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover/img:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                      <Eye className="w-4 h-4" /> View Details
                    </div>

                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="badge badge-success text-[10px]">Stock {p.stock - (p.reserved || 0)}</span>
                    </div>

                    {(p.images?.length || 0) > 1 && (
                      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                        {p.images!.length} photos
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate">{p.category || 'General'}</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold">{p.sku}</span>
                    </div>

                    <Link
                      href={`/product/${p.sku || p._id}`}
                      target="_blank"
                      className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug hover:text-brand transition block"
                      title={p.name}
                    >
                      {p.name}
                    </Link>

                    {/* Pricing breakdown box */}
                    <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Wholesale Price:</span>
                        <span className="font-black text-brand text-sm">{tk(p.wholesalePrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Suggested Retail:</span>
                        <span className="font-semibold">{tk(p.retailPrice)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-emerald-700 font-bold">
                        <span>Estimated Profit:</span>
                        <span>{tk(margin)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/product/${p.sku || p._id}`}
                      target="_blank"
                      className="btn-ghost !py-2 text-xs font-bold text-slate-700 hover:text-brand justify-center flex items-center gap-1 border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand" /> View Details
                    </Link>
                    <button
                      onClick={() => startOrder(p)}
                      className="btn !py-2 text-xs font-bold justify-center"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Order
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleCopyDetails(p)}
                      className="btn-ghost !py-1.5 !px-2 text-[11px] justify-center"
                    >
                      {copiedSku === p.sku ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Details
                        </>
                      )}
                    </button>

                    {p.images && p.images.length > 0 ? (
                      <a
                        href={p.images[0].url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost !py-1.5 !px-2 text-[11px] justify-center"
                      >
                        <Download className="w-3 h-3" /> Download Pic
                      </a>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropship Order Modal */}
      {orderingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-xl bg-white p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setOrderingProduct(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShoppingBag className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-slate-900">Dropship Customer Order Form</h2>
            </div>

            {orderSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Success!</h3>
                <p className="text-sm text-emerald-700">{orderSuccess}</p>
                <p className="text-xs text-slate-500">We will pack and dispatch this order with courier tracking shortly.</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceDropshipOrder} className="mt-4 space-y-4 text-xs">
                {/* Selected Product Banner */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center">
                  <img
                    src={imgUrl(orderingProduct.images?.[0]?.url || '', 100)}
                    alt={orderingProduct.name}
                    className="w-14 h-14 object-cover rounded-lg bg-white border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{orderingProduct.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">SKU: {orderingProduct.sku}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-semibold text-brand">Wholesale: {tk(orderingProduct.wholesalePrice)}</span>
                      <span className="text-slate-500 line-through">MRP: {tk(orderingProduct.retailPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Selling Price & Profit Calculation */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">
                      Customer Selling Price (Per Unit) *
                    </label>
                    <input
                      type="number"
                      required
                      min={orderingProduct.wholesalePrice}
                      value={customerSellingPrice}
                      onChange={(e) => setCustomerSellingPrice(Number(e.target.value))}
                      className="input !py-1.5 font-bold text-sm"
                    />
                    <span className="text-[10px] text-emerald-700">Min {tk(orderingProduct.wholesalePrice)}</span>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Quantity *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="btn-ghost !p-2"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={orderingProduct.stock}
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                        className="input !py-1.5 text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(qty + 1)}
                        className="btn-ghost !p-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Live Profit Preview */}
                  <div className="col-span-2 pt-2 border-t border-emerald-200 flex items-center justify-between text-sm font-black text-emerald-800">
                    <span>Your Estimated Profit:</span>
                    <span className="text-base text-brand">{tk(totalProfit)}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Customer Delivery Information
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Customer Full Name *</label>
                      <input
                        required
                        placeholder="e.g. Md Mohseen Molla"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Customer Mobile Number *</label>
                      <input
                        required
                        placeholder="01XXXXXXXXX"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Delivery Location Selection (3 Tiers) */}
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Delivery Destination *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <label
                        className={`p-2 rounded-lg border text-center cursor-pointer transition text-xs ${
                          deliveryArea === 'dhaka'
                            ? 'border-brand bg-brand-50 text-brand font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryArea"
                          className="sr-only"
                          checked={deliveryArea === 'dhaka'}
                          onChange={() => setDeliveryArea('dhaka')}
                        />
                        <div className="font-bold">Inside Dhaka</div>
                        <div className="text-[11px] text-slate-500">1-2 days • 60 TK</div>
                      </label>
                      <label
                        className={`p-2 rounded-lg border text-center cursor-pointer transition text-xs ${
                          deliveryArea === 'sub_area'
                            ? 'border-brand bg-brand-50 text-brand font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryArea"
                          className="sr-only"
                          checked={deliveryArea === 'sub_area'}
                          onChange={() => setDeliveryArea('sub_area')}
                        />
                        <div className="font-bold">Dhaka Sub Area</div>
                        <div className="text-[11px] text-slate-500">1-2 days • 100 TK</div>
                      </label>
                      <label
                        className={`p-2 rounded-lg border text-center cursor-pointer transition text-xs ${
                          deliveryArea === 'outside'
                            ? 'border-brand bg-brand-50 text-brand font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryArea"
                          className="sr-only"
                          checked={deliveryArea === 'outside'}
                          onChange={() => setDeliveryArea('outside')}
                        />
                        <div className="font-bold">Outside Dhaka</div>
                        <div className="text-[11px] text-slate-500">2-4 days • 120 TK</div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Full Delivery Address *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="House, Road, Area, Thana and District"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Special Courier Instructions (Optional)</label>
                    <input
                      placeholder="e.g. Call before delivery, deliver in afternoon"
                      value={customer.notes}
                      onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                {/* Final Checkout Summary */}
                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Product Subtotal ({qty} pcs):</span>
                    <span className="text-white font-semibold">{tk(customerSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Courier Delivery Charge:</span>
                    <span className="text-white font-semibold">{tk(deliveryCharge)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 flex justify-between font-black text-sm">
                    <span className="text-accent">Customer COD Cash Collection:</span>
                    <span className="text-accent">{tk(customerTotalPayable)}</span>
                  </div>
                </div>

                {orderError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {orderError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={orderBusy}
                    className="btn flex-1 !py-2.5 text-sm font-bold shadow-md"
                  >
                    {orderBusy ? 'Submitting Order...' : 'Confirm Dropship Order'} <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderingProduct(null)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResellerCatalogPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-medium text-slate-500">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
