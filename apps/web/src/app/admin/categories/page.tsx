'use client';

import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import ImageUploader, { Img } from '@/components/ImageUploader';
import { imgUrl } from '@/lib/img';
import {
  Layers,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  ImageIcon,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

type CategoryItem = {
  _id: string;
  name: string;
  label?: string;
  imageUrl?: string;
  order: number;
  active: boolean;
};

export default function AdminCategoriesPage() {
  const { data: categories, loading, reload } = useApi<CategoryItem[]>('/admin/categories');

  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState({
    name: '',
    label: '',
    imageUrl: '',
    order: 0,
    active: true
  });
  const [imgs, setImgs] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: '',
      label: '',
      imageUrl: '',
      order: 0,
      active: true
    });
    setImgs([]);
    setErr('');
  };

  const handleEdit = (cat: CategoryItem) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      label: cat.label || cat.name,
      imageUrl: cat.imageUrl || '',
      order: cat.order || 0,
      active: cat.active ?? true
    });
    if (cat.imageUrl) {
      setImgs([{ url: cat.imageUrl, publicId: '' }]);
    } else {
      setImgs([]);
    }
    setErr('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync uploaded image with form
  const handleImageChange = (newImgs: Img[]) => {
    setImgs(newImgs);
    if (newImgs.length > 0) {
      setForm((prev) => ({ ...prev, imageUrl: newImgs[0].url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setSuccess('');

    const finalImageUrl = imgs[0]?.url || form.imageUrl.trim();
    if (!form.name.trim()) {
      setBusy(false);
      return setErr('Category name is required');
    }

    const payload = {
      name: form.name.trim(),
      label: form.label.trim() || form.name.trim(),
      imageUrl: finalImageUrl,
      order: Number(form.order) || 0,
      active: form.active
    };

    try {
      if (editing) {
        await api(`/admin/categories/${editing._id}`, {
          method: 'PUT',
          body: payload
        });
        setSuccess('Category updated successfully!');
      } else {
        await api('/admin/categories', {
          method: 'POST',
          body: payload
        });
        setSuccess('Category created successfully!');
      }
      resetForm();
      reload();
    } catch (x: any) {
      setErr(x.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api(`/admin/categories/${id}`, { method: 'DELETE' });
      reload();
    } catch (x: any) {
      alert(x.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#00796b]" /> Category Image & Catalog Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage categories, upload category thumbnail photos, and customize order on the homepage
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#00796b]" />
          {editing ? `Edit Category: ${editing.name}` : 'Add / Update Category with Image'}
        </h2>

        {err && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {err}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Fields */}
          <div className="md:col-span-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category Name * <span className="text-[11px] font-normal text-slate-400">(matches product category)</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Winter Collection, Men's Fashion..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Display Label <span className="text-[11px] font-normal text-slate-400">(short name on homepage card)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Winter, Men's..."
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="input"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 text-[#00796b] rounded"
                  />
                  <span className="font-semibold text-slate-700">Active & Visible</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Or Direct Image URL:
              </label>
              <input
                type="url"
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
                className="btn !py-2.5 !px-5 text-xs font-bold bg-[#00796b] hover:bg-[#00695c]"
              >
                {busy ? 'Saving...' : editing ? 'Update Category' : 'Save Category'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-ghost !py-2.5 !px-4 text-xs"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Right Image Uploader & Live Preview */}
          <div className="md:col-span-6 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Upload Category Image (Cloudinary or Direct URL)
            </label>
            <ImageUploader value={imgs} onChange={handleImageChange} max={1} />

            {/* Live Preview Card */}
            {(imgs[0]?.url || form.imageUrl) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">Homepage Preview:</span>
                <div className="w-20 p-2.5 rounded-xl border border-slate-200 bg-white text-center shadow-xs">
                  <div className="w-14 h-14 rounded-lg overflow-hidden mx-auto mb-1 bg-slate-100">
                    <img
                      src={imgUrl(imgs[0]?.url || form.imageUrl, 200)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 line-clamp-1">
                    {form.label || form.name || 'Category'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Categories List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Configured Categories ({categories?.length || 0})
          </h3>
          <span className="text-xs text-slate-500">
            Changes reflect instantly on homepage and catalog filters
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading categories...</div>
        ) : !categories || categories.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No custom categories configured yet. Add your first one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Display Label</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{c.order}</td>
                    <td className="py-3 px-4">
                      {c.imageUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img
                            src={imgUrl(c.imageUrl, 100)}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.label || c.name}</td>
                    <td className="py-3 px-4">
                      {c.active ? (
                        <span className="badge badge-success text-[10px]">Active</span>
                      ) : (
                        <span className="badge badge-danger text-[10px]">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="btn-ghost !py-1 !px-2 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c._id, c.name)}
                        className="btn-ghost !py-1 !px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
