'use client';

import { useRef, useState } from 'react';
import { imgUrl } from '@/lib/img';
import { UploadCloud, Link as LinkIcon, Plus, X, Star } from 'lucide-react';

export type Img = { url: string; publicId: string };
const MAX = 8, MAX_MB = 5, OK = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({
  value,
  onChange,
  max = MAX
}: {
  value: Img[];
  onChange: (v: Img[]) => void;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const fresh = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  async function add(list: FileList | File[]) {
    setErr('');
    const files = Array.from(list);
    if (!files.length) return;
    if (value.length + files.length > max) {
      return setErr(`You can upload up to ${max} image${max > 1 ? 's' : ''}`);
    }

    const bad = files.find((f) => !OK.includes(f.type) || f.size > MAX_MB * 1024 * 1024);
    if (bad) {
      return setErr(`${bad.name}: please use JPG, PNG or WebP under ${MAX_MB} MB`);
    }

    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const r = await fetch('/api/v1/uploads/product-images', {
        method: 'POST',
        body: fd,
        credentials: 'include'
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof j.error === 'string' ? j.error : 'Image upload failed');
      (j.data as Img[]).forEach((i) => fresh.current.add(i.publicId));
      onChange([...value, ...j.data]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  function handleAddUrl(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return setErr('Please provide a valid web URL starting with https://');
    }
    if (value.length >= MAX) {
      return setErr(`Maximum ${MAX} images allowed`);
    }

    onChange([
      ...value,
      {
        url: trimmed,
        publicId: 'online-' + Math.random().toString(36).substring(2, 9)
      }
    ]);
    setUrlInput('');
  }

  async function remove(i: Img) {
    onChange(value.filter((v) => v.publicId !== i.publicId));
    if (fresh.current.has(i.publicId)) {
      fresh.current.delete(i.publicId);
      fetch('/api/v1/uploads/product-images/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: i.publicId })
      }).catch(() => {});
    }
  }

  const makeMain = (i: Img) => onChange([i, ...value.filter((v) => v.publicId !== i.publicId)]);

  return (
    <div className="space-y-3">
      {/* Cloudinary Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
          drag
            ? 'border-brand bg-emerald-50'
            : 'border-slate-300 bg-slate-50/70 hover:border-brand hover:bg-white'
        }`}
      >
        <UploadCloud className="mb-1.5 h-7 w-7 text-slate-400" />
        <p className="text-xs font-semibold text-slate-700">
          {busy ? 'Uploading to Cloudinary...' : 'Drag photos here or click to browse'}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          JPG, PNG or WebP · Up to {MAX_MB} MB each · Up to {MAX} images
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={OK.join(',')}
          className="hidden"
          onChange={(e) => e.target.files && add(e.target.files)}
        />
      </div>

      {/* Online Image URL Input */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Or paste online image URL (https://...)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="input !py-1.5 text-xs flex-1"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="btn-ghost !py-1.5 !px-3 text-xs shrink-0 font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Add URL
        </button>
      </div>

      {err && <p role="alert" className="text-xs font-semibold text-red-600">{err}</p>}

      {/* Uploaded / Added Thumbnails */}
      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 pt-1">
          {value.map((i, idx) => (
            <li
              key={i.publicId || idx}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs"
            >
              <img
                src={imgUrl(i.url, 200)}
                alt={`Product photo ${idx + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />

              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded bg-[#00796b] px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                  MAIN
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-between items-center bg-black/75 px-1.5 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                {idx > 0 ? (
                  <button
                    type="button"
                    onClick={() => makeMain(i)}
                    className="hover:text-emerald-300 font-bold"
                  >
                    Set Main
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="hover:text-red-400 font-bold"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
