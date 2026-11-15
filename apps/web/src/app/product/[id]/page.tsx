'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, bdt, tk, useApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ShoppingBag,
  PhoneCall,
  MessageCircle,
  Truck,
  Heart,
  Share2,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  ShoppingCart
} from 'lucide-react';

type Product = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  retailPrice: number;
  wholesalePrice?: number;
  stock: number;
  reserved?: number;
  active: boolean;
  images?: { url: string; publicId: string }[];
};

type ProductDetailResponse = {
  data: Product;
  related: Product[];
  meta: {
    canSeeWholesale: boolean;
  };
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSku = params.id as string;

  const { data: res, loading, error, reload } = useApi<any>(`/products/${idOrSku}`);

  const product: Product | null = res?.product || res?.data || (res?._id ? res : null);
  const related: Product[] = res?.related || [];
  const canSeeWholesale: boolean = res?.canSeeWholesale ?? res?.meta?.canSeeWholesale ?? false;

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('L');
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // Instant Dropship Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [customerSellingPrice, setCustomerSellingPrice] = useState<number>(0);
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'subarea' | 'outside'>('dhaka');
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

  useEffect(() => {
    if (product) {
      setCustomerSellingPrice(product.retailPrice);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
          Loading product details...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">The requested product could not be found or has been archived.</p>
          <Link href="/" className="btn mt-4 text-xs">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images.map((i) => (typeof i === 'string' ? i : i.url))
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

  const mainImage = images[selectedImgIdx] || images[0];

  const dropshipperPrice = product.wholesalePrice;
  const suggestedRetailPrice = product.retailPrice;
  const profitMargin = dropshipperPrice !== undefined ? suggestedRetailPrice - dropshipperPrice : 0;

  const getDeliveryCharge = () => {
    if (deliveryArea === 'dhaka') return 60;
    if (deliveryArea === 'subarea') return 100;
    return 120;
  };

  const currentDeliveryCharge = getDeliveryCharge();
  const customerSubtotal = customerSellingPrice * qty;
  const customerTotalPayable = customerSubtotal + currentDeliveryCharge;
  const resellerTotalProfit = dropshipperPrice ? (customerSellingPrice - dropshipperPrice) * qty : 0;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToCart = () => {
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2500);
  };

  async function handlePlaceDropshipOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setOrderError(null);

    if (dropshipperPrice && customerSellingPrice < dropshipperPrice) {
      return setOrderError(`Selling price cannot be lower than dropshipper wholesale price (${tk(dropshipperPrice)})`);
    }

    if (!/^01[3-9]\d{8}$/.test(customer.phone)) {
      return setOrderError('Please provide a valid 11-digit phone number (e.g. 01410449778)');
    }

    setOrderBusy(true);
    try {
      const res = await api<{ orderNo: string }>('/orders', {
        body: {
          items: [
            {
              productId: product._id,
              qty,
              unitPrice: customerSellingPrice
            }
          ],
          customer: {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            district: deliveryArea === 'dhaka' ? 'Dhaka' : customer.district || 'Outside Dhaka'
          },
          deliveryCharge: currentDeliveryCharge,
          notes: customer.notes
        }
      });

      setOrderSuccess(`Order placed successfully! Order No: ${res.orderNo}`);
      setTimeout(() => {
        setOrderModalOpen(false);
        setOrderSuccess(null);
        router.push('/seller/orders');
      }, 2500);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order');
    } finally {
      setOrderBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="border-b border-slate-100 bg-slate-50/60 py-2.5 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-brand transition">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href={`/?category=${encodeURIComponent(product.category)}`} className="hover:text-brand transition">
            {product.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Product Detail Main Grid (Inspired by dropshipping.com.bd screenshot) */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white font-bold text-sm">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                      selectedImgIdx === idx ? 'border-brand' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Middle Column: Details & Pricing (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* WhatsApp Ask for Details */}
            <div className="flex items-center gap-3 text-xs">
              <a
                href={`https://wa.me/8801410449778?text=Hello,%20I%20am%20interested%20in%20product%20Code:%20${product.sku}%20(${encodeURIComponent(product.name)})`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-600 font-bold hover:underline"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
                Ask for details
              </a>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-600 font-semibold">
                Code: <b className="text-slate-900">{product.sku}</b>
              </span>
            </div>

            {/* Pricing Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              {canSeeWholesale && dropshipperPrice !== undefined ? (
                <>
                  <div className="text-sm font-semibold text-slate-700">
                    Dropshipper Price: <b className="text-slate-900 font-black">{tk(dropshipperPrice)}</b>
                  </div>
                  <div className="text-xs text-slate-500">
                    Suggested Retail Price: <span className="line-through">{tk(suggestedRetailPrice)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-sm font-bold text-emerald-700 flex items-center justify-between">
                    <span>Your Profit:</span>
                    <span className="text-base font-black text-emerald-800">{tk(profitMargin)}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700">
                    Retail Price: <b className="text-slate-900 font-black text-base">{tk(suggestedRetailPrice)}</b>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Wholesale & Profit:
                    </span>
                    <Link href="/login" className="btn !py-1 !px-2.5 text-xs bg-amber-600 hover:bg-amber-700">
                      Login to View
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Select Size */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Select Size</span>
              <div className="flex gap-2 text-xs">
                {['M', 'L', 'XL', 'XXL'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-9 h-9 rounded-lg border font-bold flex items-center justify-center transition ${
                      selectedSize === sz
                        ? 'border-brand bg-brand text-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart / Wishlist (Matches dropshipping.com.bd screenshot) */}
            <div className="flex items-center gap-2 sm:gap-2.5 pt-1 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">Qty:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-slate-800 min-w-[2rem] text-center font-mono">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs ${
                  cartAdded
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-[#00796b] hover:text-[#00796b]'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{cartAdded ? 'Added ✓' : 'Add To Cart'}</span>
              </button>

              {/* Wishlist Heart button */}
              <button
                type="button"
                onClick={() => setWishlisted(!wishlisted)}
                className={`p-1.5 rounded-lg border transition ${
                  wishlisted
                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                    : 'border-slate-300 text-slate-400 hover:text-rose-500 hover:border-rose-300 bg-white'
                }`}
                title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Action Buttons: Big Green Order Now */}
            <div className="pt-2 flex flex-col gap-2">
              {canSeeWholesale ? (
                <button
                  onClick={() => setOrderModalOpen(true)}
                  className="w-full py-3 px-4 text-sm font-bold bg-[#00796b] hover:bg-[#00695c] text-white shadow-md flex items-center justify-center gap-2 rounded-xl transition duration-150 cursor-pointer"
                >
                  <span>Order Now</span>
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/register"
                  className="w-full py-3 px-4 text-sm font-bold bg-[#00796b] hover:bg-[#00695c] text-white shadow-md flex items-center justify-center gap-2 rounded-xl transition duration-150 text-center"
                >
                  <span>Become a Reseller to Order</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="btn-ghost flex-1 !py-2 text-xs justify-center"
                >
                  {copied ? '✓ Link Copied' : 'Share Product'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery Info & Hotline (3 cols, matches dropshipping.com.bd screenshot media_1794740108177_24242d36.jpg) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Delivery Charge Table */}
            <div className="rounded-xl border border-dashed border-[#00796b] p-4 bg-white text-xs space-y-2 shadow-2xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-800 font-bold">
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2 text-right">Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="py-2 font-medium">Inside Dhaka</td>
                    <td className="py-2 text-slate-500">1-2 days</td>
                    <td className="py-2 text-right font-bold text-slate-900 font-mono">60 TK</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Dhaka Sub Area</td>
                    <td className="py-2 text-slate-500">1-2 days</td>
                    <td className="py-2 text-right font-bold text-slate-900 font-mono">100 TK</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Outside Dhaka</td>
                    <td className="py-2 text-slate-500">2-4 days</td>
                    <td className="py-2 text-right font-bold text-slate-900 font-mono">120 TK</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Hotline Call Box */}
            <div className="rounded-xl border border-dashed border-[#00796b] p-4 bg-white text-xs text-slate-700 space-y-2 shadow-2xs">
              <p className="font-semibold text-slate-800 leading-tight">
                Have question about this product ? please call
              </p>
              <a
                href="tel:01410449778"
                className="flex items-center gap-2 text-[#00796b] font-mono text-base font-bold hover:underline"
              >
                <PhoneCall className="w-4 h-4 text-[#00796b]" />
                01410449778
              </a>
            </div>

            {/* Trust highlights */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00796b] shrink-0" />
                <span>100% Quality Checked</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#00796b] shrink-0" />
                <span>Cash on Delivery Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Product Description</h2>
          <div className="card p-6 bg-slate-50/70 border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {product.description || 'Quality guaranteed dropshipping product. Ready to ship directly to your customer.'}
          </div>
        </div>

        {/* Related Products Section */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Related Products</h2>
              <Link
                href={`/?category=${encodeURIComponent(product.category)}`}
                className="text-xs font-semibold text-brand hover:underline"
              >
                View all in {product.category} →
              </Link>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {related.map((rel) => {
                const img = rel.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                return (
                  <Link
                    key={rel._id}
                    href={`/product/${rel.sku || rel._id}`}
                    className="card !p-0 overflow-hidden group hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden">
                      <img
                        src={img}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-2.5 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">Code: {rel.sku}</span>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={rel.name}>
                        {rel.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-800">{tk(rel.retailPrice)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Instant Dropship Order Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-lg bg-white p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setOrderModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShoppingBag className="w-5 h-5 text-brand" />
              <h2 className="text-base font-bold text-slate-900">Dropship Customer Order Form</h2>
            </div>

            {orderSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Success!</h3>
                <p className="text-sm text-emerald-700">{orderSuccess}</p>
                <p className="text-xs text-slate-500">Redirecting to your orders list...</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceDropshipOrder} className="mt-4 space-y-4 text-xs">
                {/* Product Summary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center">
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{product.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Code: {product.sku}</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                      Wholesale Price: {tk(dropshipperPrice || 0)}
                    </p>
                  </div>
                </div>

                {/* Selling Price & Profit Calculation */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">
                      Customer Selling Price *
                    </label>
                    <input
                      type="number"
                      required
                      min={dropshipperPrice || 1}
                      value={customerSellingPrice}
                      onChange={(e) => setCustomerSellingPrice(Number(e.target.value))}
                      className="input !py-1.5 font-bold text-sm"
                    />
                    <span className="text-[10px] text-emerald-700">Min {tk(dropshipperPrice || 0)}</span>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                      className="input !py-1.5 text-center font-bold"
                    />
                  </div>

                  {/* Net Profit Banner */}
                  <div className="col-span-2 pt-2 border-t border-emerald-200 flex items-center justify-between text-sm font-black text-emerald-800">
                    <span>Your Total Profit:</span>
                    <span className="text-base text-emerald-900">{tk(resellerTotalProfit)}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Customer Shipping Information
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Customer Name *</label>
                      <input
                        required
                        placeholder="e.g. Sultana Begum"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Customer Phone Number *</label>
                      <input
                        required
                        placeholder="01XXXXXXXXX"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="input font-mono"
                      />
                    </div>
                  </div>

                  {/* Delivery Location Selector */}
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Delivery Area *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <label
                        className={`p-2 rounded-lg border text-center cursor-pointer transition text-[11px] ${
                          deliveryArea === 'dhaka'
                            ? 'border-brand bg-brand-50 text-brand font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delArea"
                          className="sr-only"
                          checked={deliveryArea === 'dhaka'}
                          onChange={() => setDeliveryArea('dhaka')}
                        />
                        <span>Inside Dhaka (60 TK)</span>
                      </label>
                      <label
                        className={`p-2 rounded-lg border text-center cursor-pointer transition text-[11px] ${
                          deliveryArea === 'subarea'
                            ? 'border-brand bg-brand-50 text-brand font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delArea"
                          className="sr-only"
                          checked={deliveryArea === 'subarea'}
                          onChange={() => setDeliveryArea('subarea')}
                        />
                        <span>Sub Area (100 TK)</span>
                      </label>
                      <label
                        className={`p-2 rounded-lg border text-center cursor-pointer transition text-[11px] ${
                          deliveryArea === 'outside'
                            ? 'border-brand bg-brand-50 text-brand font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delArea"
                          className="sr-only"
                          checked={deliveryArea === 'outside'}
                          onChange={() => setDeliveryArea('outside')}
                        />
                        <span>Outside (120 TK)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Full Delivery Address *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="House No, Road No, Area, Thana & District"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Courier Delivery Notes (Optional)</label>
                    <input
                      placeholder="Special instructions for courier delivery"
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
                    <span>{tk(customerSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Charge:</span>
                    <span>{tk(currentDeliveryCharge)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-sm text-accent">
                    <span>Customer Cash on Delivery (COD):</span>
                    <span>{tk(customerTotalPayable)}</span>
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
                    className="btn flex-1 !py-2.5 text-sm font-bold bg-[#00796b] hover:bg-emerald-800 shadow-md"
                  >
                    {orderBusy ? 'Processing...' : 'Confirm Dropship Order'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
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

      {/* Mobile Sticky Quick Order Bar (Positioned above mobile bottom bar) */}
      <div className="md:hidden fixed bottom-[52px] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          {canSeeWholesale && dropshipperPrice !== undefined ? (
            <div>
              <span className="text-[10px] text-slate-500 block leading-tight">Wholesale Price</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900">{tk(dropshipperPrice)}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Profit: {tk(profitMargin)}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-[10px] text-slate-500 block leading-tight">Retail Price</span>
              <span className="text-sm font-black text-slate-900">{tk(suggestedRetailPrice)}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => (canSeeWholesale ? setOrderModalOpen(true) : router.push('/login'))}
          className="py-2 px-4 rounded-xl text-xs font-bold bg-[#00796b] hover:bg-[#00695c] text-white shadow-md flex items-center gap-1.5 shrink-0 transition"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{canSeeWholesale ? 'Order Now' : 'Login to Order'}</span>
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
