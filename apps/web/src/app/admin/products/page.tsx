'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, tk, useApi } from '@/lib/api';
import { imgUrl } from '@/lib/img';
import ImageUploader, { Img } from '@/components/ImageUploader';
import {
  ShoppingBag,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Archive,
  Image as ImageIcon,
  Eye,
  ExternalLink
} from 'lucide-react';

type Product = {
  _id: string;
  name: string;
  sku: string;
  category?: string;
  description?: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  reserved: number;
  active: boolean;
  images?: Img[];
};

const empty = {
  name: '',
  sku: '',
  category: "Men's Fashion",
  description: '',
  retailPrice: '',
  wholesalePrice: '',
  stock: '50'
};

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, reload } = useApi<Product[]>(`/admin/products${search ? `?q=${encodeURIComponent(search)}` : ''}`);

  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [f, setF] = useState(empty);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const categories = [
    'Winter Collection',
    "Men's Fashion",
    "Women's Fashion",
    'Home & Lifestyle',
    'Gadgets & Electronics',
    'Kids Zone',
    'Foods',
    'Others'
  ];

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const reset = () => {
    setF(empty);
    setImgs([]);
    setEditing(null);
  };

  const margin = Number(f.retailPrice) - Number(f.wholesalePrice);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const retail = Number(f.retailPrice);
    const whole = Number(f.wholesalePrice);

    if (whole > retail) {
      return setMsg({ ok: false, t: 'Wholesale price cannot be greater than retail price (MRP).' });
    }

    setBusy(true);
    try {
      const body = {
        name: f.name,
        sku: f.sku,
        category: f.category,
        description: f.description || undefined,
        retailPrice: retail,
        wholesalePrice: whole,
        stock: Number(f.stock),
        images: imgs
      };

      await api(editing ? `/products/${editing}` : '/products', {
        method: editing ? 'PUT' : 'POST',
        body
      });

      setMsg({ ok: true, t: editing ? 'Product updated successfully!' : 'New product created with image gallery!' });
      reset();
      reload();
    } catch (x: any) {
      setMsg({ ok: false, t: x.message || 'Failed to save product' });
    } finally {
      setBusy(false);
    }
  }

  function edit(p: Product) {
    setEditing(p._id);
    setF({
      name: p.name,
      sku: p.sku,
      category: p.category || "Men's Fashion",
      description: p.description || '',
      retailPrice: String(p.retailPrice),
      wholesalePrice: String(p.wholesalePrice),
      stock: String(p.stock)
    });
    setImgs(p.images || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function archive(p: Product) {
    if (!confirm(`Are you sure you want to archive "${p.name}"? It will be hidden from the wholesale catalog.`)) return;
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      reload();
    } catch (x: any) {
      setMsg({ ok: false, t: x.message });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products & Media Gallery</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload multiple images via Cloudinary or web URLs, set dropshipper wholesale rates, and manage stock.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 !py-1.5 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {msg && (
        <div
          role="status"
          className={`rounded-lg p-3 text-xs font-semibold ${
            msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {msg.t}
        </div>
      )}

      {/* Add / Edit Product Form */}
      <form onSubmit={save} className="card grid gap-6 lg:grid-cols-2 shadow-sm">
        {/* Left column: Text details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {editing ? '✏️ Edit Product' : '➕ Add Wholesale Product'}
            </h2>
            {editing && (
              <span className="badge bg-amber-100 text-amber-800 text-[10px]">Editing Mode</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
            <input
              className="input font-medium"
              required
              placeholder="e.g. Premium Casual Combo Set #13051"
              value={f.name}
              onChange={set('name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code (SKU) *</label>
              <input
                className="input font-mono font-bold"
                required
                placeholder="13051"
                value={f.sku}
                onChange={set('sku')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                className="input font-medium"
                value={f.category}
                onChange={set('category')}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Description</label>
            <textarea
              className="input min-h-24 text-xs"
              placeholder="Fabric details, sizing specs, colors, features..."
              value={f.description}
              onChange={set('description')}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Retail Price (MRP) *</label>
              <input
                className="input font-bold"
                type="number"
                min={1}
                required
                placeholder="1250"
                value={f.retailPrice}
                onChange={set('retailPrice')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wholesale Dropship *</label>
              <input
                className="input font-bold text-brand"
                type="number"
                min={1}
                required
                placeholder="890"
                value={f.wholesalePrice}
                onChange={set('wholesalePrice')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Units *</label>
              <input
                className="input font-bold"
                type="number"
                min={0}
                required
                placeholder="100"
                value={f.stock}
                onChange={set('stock')}
              />
            </div>

            {f.retailPrice && f.wholesalePrice && (
              <div className="col-span-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Reseller Profit Margin:</span>
                <span className={`font-black text-sm ${margin < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {tk(margin)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Multi-image uploader */}
        <div className="space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">
              Product Images <span className="text-xs font-normal text-slate-500">(Cloudinary or Online URL)</span>
            </h2>
            <span className="text-[11px] text-brand font-semibold">1st image will be cover photo</span>
          </div>

          <ImageUploader value={imgs} onChange={setImgs} />

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button className="btn flex-1 !py-2.5 font-bold" disabled={busy}>
              {busy ? 'Saving...' : editing ? 'Update Product' : 'Publish Product'}
            </button>
            {editing && (
              <button type="button" className="btn-ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Products List Title */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-lg font-bold text-slate-900">All Published Products ({data?.length || 0})</h2>
      </div>

      {loading && <div className="text-center py-10 text-slate-500 font-medium">Loading products...</div>}
      {data?.length === 0 && (
        <div className="card text-center py-12 text-slate-500">
          No products found. Use the form above to add your first product.
        </div>
      )}

      {/* Grid of products */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.map((p) => (
          <div
            key={p._id}
            className={`card overflow-hidden !p-0 flex flex-col justify-between hover:shadow-md transition ${
              p.active ? '' : 'opacity-60 bg-slate-100'
            }`}
          >
            <div>
              <Link
                href={`/product/${p.sku || p._id}`}
                target="_blank"
                className="block relative aspect-square bg-slate-100 group/img overflow-hidden"
                title="View live product details page"
              >
                {p.images?.[0] ? (
                  <img
                    src={imgUrl(p.images[0].url, 400)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover/img:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No Image</div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                  <Eye className="w-4 h-4" /> View Details
                </div>

                {!p.active && (
                  <span className="absolute left-2 top-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-white">
                    Archived
                  </span>
                )}

                {(p.images?.length || 0) > 1 && (
                  <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    {p.images!.length} photos
                  </span>
                )}
              </Link>

              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate">{p.category || 'General'}</span>
                  <span className="font-mono bg-slate-100 px-1 rounded font-bold">{p.sku}</span>
                </div>
                <Link
                  href={`/product/${p.sku || p._id}`}
                  target="_blank"
                  className="truncate font-bold text-slate-900 text-sm block hover:text-brand transition"
                  title={p.name}
                >
                  {p.name}
                </Link>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Retail: <b>{tk(p.retailPrice)}</b></span>
                  <span className="text-brand font-bold">Wholesale: {tk(p.wholesalePrice)}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Stock: <b>{p.stock - (p.reserved || 0)}</b> available ({p.reserved || 0} reserved)
                </p>
              </div>
            </div>

            <div className="p-3.5 pt-0 flex gap-1.5">
              <Link
                href={`/product/${p.sku || p._id}`}
                target="_blank"
                className="btn-ghost !py-1 !px-2.5 text-xs text-brand hover:bg-emerald-50 justify-center flex items-center gap-1"
                title="View live product page"
              >
                <Eye className="w-3.5 h-3.5" /> Details
              </Link>
              <button
                className="btn-ghost flex-1 !py-1 text-xs justify-center"
                onClick={() => edit(p)}
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              {p.active && (
                <button
                  className="btn-ghost !py-1 !px-2 text-xs text-red-600 hover:bg-red-50 justify-center"
                  onClick={() => archive(p)}
                  title="Archive product"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
