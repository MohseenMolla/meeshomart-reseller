'use client';

import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import ImageUploader, { Img } from '@/components/ImageUploader';
import {
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowRight
} from 'lucide-react';

type Banner = {
  _id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  active: boolean;
  order: number;
  createdAt: string;
};

const emptyBanner = {
  title: '',
  subtitle: '',
  badge: '',
  imageUrl: '',
  linkUrl: '/seller/catalog',
  buttonText: 'Order Now',
  order: 0,
  active: true
};

export default function AdminBannersPage() {
  const { data: banners, loading, reload } = useApi<Banner[]>('/admin/banners');

  const [form, setForm] = useState(emptyBanner);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const resetForm = () => {
    setForm(emptyBanner);
    setEditingId(null);
    setImgs([]);
  };

  const handleEdit = (b: Banner) => {
    setEditingId(b._id);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      badge: b.badge || '',
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl || '/',
      buttonText: b.buttonText || 'Order Now',
      order: b.order || 0,
      active: b.active
    });
    setImgs([{ url: b.imageUrl, publicId: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const bannerImgUrl = imgs[0]?.url || form.imageUrl;
    if (!bannerImgUrl) {
      return setMsg({ ok: false, text: 'Please upload or provide an image URL for the banner.' });
    }

    setBusy(true);
    try {
      const payload = {
        ...form,
        imageUrl: bannerImgUrl
      };

      if (editingId) {
        await api(`/admin/banners/${editingId}`, {
          method: 'PUT',
          body: payload
        });
        setMsg({ ok: true, text: 'Banner updated successfully!' });
      } else {
        await api('/admin/banners', {
          method: 'POST',
          body: payload
        });
        setMsg({ ok: true, text: 'New banner created and published to homepage!' });
      }

      resetForm();
      reload();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || 'Failed to save banner' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete banner "${title || 'Untitled'}"?`)) return;
    try {
      await api(`/admin/banners/${id}`, { method: 'DELETE' });
      reload();
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    }
  }

  async function handleToggleActive(b: Banner) {
    try {
      await api(`/admin/banners/${b._id}`, {
        method: 'PUT',
        body: { active: !b.active }
      });
      reload();
    } catch (err: any) {
      alert(err.message || 'Failed to update banner status');
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Homepage Banner Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload and manage the top promotional sliders and hero banners displayed on the homepage.
          </p>
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

      {/* Banner Create / Edit Form */}
      <form onSubmit={handleSubmit} className="card p-6 shadow-sm border border-slate-200 grid lg:grid-cols-2 gap-6">
        {/* Left Col: Banner Texts & Links */}
        <div className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {editingId ? '✏️ Edit Promotional Banner' : '➕ Upload New Banner'}
            </h2>
            {editingId && (
              <span className="badge bg-amber-100 text-amber-800 text-[10px]">Editing Mode</span>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Banner Headline / Title</label>
            <input
              placeholder="e.g. One-Click Order Processing, We Handle the Rest!"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subtitle / Marketing Message</label>
            <textarea
              rows={2}
              placeholder="e.g. No more inventory or packaging headaches. Focus on making sales while we deliver parcels straight to your customer."
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Top Pill Badge (Optional)</label>
              <input
                placeholder="e.g. Bangladesh's #1 Dropshipping Hub"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Display Order (Sort Index)</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Button Call to Action Text</label>
              <input
                placeholder="e.g. Start Dropshipping Now"
                value={form.buttonText}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Link URL</label>
              <input
                placeholder="e.g. /seller/catalog or /register"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-slate-300 text-[#00796b] focus:ring-[#00796b]"
              />
              <span>Active (Visible on Homepage)</span>
            </label>
          </div>
        </div>

        {/* Right Col: Image Upload & Preview */}
        <div className="space-y-3.5 text-xs">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Banner Image Upload</h2>
            <span className="text-[11px] text-slate-500">Recommended: 1600×600 px</span>
          </div>

          {/* Cloudinary Multi-image uploader (or direct URL) */}
          <ImageUploader value={imgs} onChange={setImgs} max={1} />

          {/* Quick Direct URL fallback */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Or Direct Image URL:</label>
            <input
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => {
                setForm({ ...form, imageUrl: e.target.value });
                if (e.target.value) setImgs([{ url: e.target.value, publicId: '' }]);
              }}
              className="input font-mono text-[11px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="btn flex-1 !py-2.5 font-bold bg-[#00796b] hover:bg-emerald-800 text-white shadow-md"
            >
              {busy ? 'Saving...' : editingId ? 'Update Banner' : 'Publish Banner to Homepage'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost">
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Existing Banners List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Published Banners ({banners?.length || 0})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading banners...</div>
        ) : !banners || banners.length === 0 ? (
          <div className="card text-center py-12 text-slate-500">
            No custom banners created yet. The platform is displaying the default promotional banner.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {banners.map((b) => (
              <div
                key={b._id}
                className={`card !p-0 overflow-hidden border transition ${
                  b.active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                {/* Banner Image Preview */}
                <div className="aspect-[16/6] bg-slate-100 overflow-hidden relative">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {b.active ? (
                      <span className="badge badge-success text-[10px]">Active</span>
                    ) : (
                      <span className="badge badge-danger text-[10px]">Inactive</span>
                    )}
                    <span className="badge bg-slate-900 text-white text-[10px]">Order: {b.order}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {b.badge && (
                    <span className="text-[10px] uppercase font-bold text-[#00796b] block">
                      {b.badge}
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{b.title || 'Untitled Banner'}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{b.subtitle}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 truncate max-w-[180px]">
                      Link: <b className="text-slate-800">{b.linkUrl}</b>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`btn-ghost !py-1 !px-2 text-[11px] ${
                          b.active ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {b.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(b)}
                        className="btn-ghost !py-1 !px-2 text-[11px]"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(b._id, b.title)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
