'use client';

import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import {
  Users,
  PlusCircle,
  Trash2,
  X,
  Phone,
  Mail,
  User,
  Lock
} from 'lucide-react';

type Manager = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastSeenAt?: string;
};

export default function ManagersPage() {
  const { data: managers, loading, reload } = useApi<Manager[]>('/admin/managers');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const managerCount = managers?.length || 0;
  const maxManagers = 50;

  async function handleCreateManager(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (managerCount >= maxManagers) {
      return setMsg({ ok: false, text: 'Maximum limit of 50 managers reached!' });
    }

    if (!/^01[3-9]\d{8}$/.test(form.phone)) {
      return setMsg({ ok: false, text: 'Please enter a valid 11-digit mobile number (01XXXXXXXXX)' });
    }

    setBusy(true);
    try {
      await api('/admin/managers', {
        body: form
      });
      setMsg({ ok: true, text: 'New manager account created successfully!' });
      setForm({ name: '', email: '', phone: '', password: '' });
      setTimeout(() => {
        setModalOpen(false);
        setMsg(null);
        reload();
      }, 1500);
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || 'Failed to create manager' });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(m: Manager) {
    try {
      await api(`/admin/managers/${m._id}/toggle`, { method: 'POST', body: {} });
      reload();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(m: Manager) {
    if (!confirm(`Are you sure you want to delete manager "${m.name}"?`)) return;
    try {
      await api(`/admin/managers/${m._id}`, { method: 'DELETE' });
      reload();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manager Management</h1>
            <span className="badge bg-slate-900 text-white font-bold text-xs">Super Admin Access</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Create and manage staff managers (capped at 50 managers max) to handle product catalogs, orders, and courier dispatch.
          </p>
        </div>

        <button
          onClick={() => {
            setModalOpen(true);
            setMsg(null);
          }}
          disabled={managerCount >= maxManagers}
          className="btn text-xs sm:text-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Add New Manager
        </button>
      </div>

      {/* Quota Progress Bar */}
      <div className="card p-4 bg-slate-900 text-white">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300">Manager Team Quota</span>
          <span className="font-bold text-brand-400">
            {managerCount} / {maxManagers} Managers Active
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(managerCount / maxManagers) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          * Managers can add and edit products, upload multiple images via Cloudinary, view reseller orders, and update courier tracking codes.
        </p>
      </div>

      {/* Managers Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-bold">Manager Name</th>
                <th className="p-3.5 font-bold">Email</th>
                <th className="p-3.5 font-bold">Phone Number</th>
                <th className="p-3.5 font-bold">Role</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold">Joined Date</th>
                <th className="p-3.5 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    Loading managers...
                  </td>
                </tr>
              ) : !managers || managers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No managers created yet. Click "Add New Manager" above.
                  </td>
                </tr>
              ) : (
                managers.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-900">{m.name}</td>
                    <td className="p-3.5 text-slate-600">{m.email}</td>
                    <td className="p-3.5 font-mono text-slate-700">{m.phone}</td>
                    <td className="p-3.5">
                      <span className="badge bg-slate-100 text-slate-800 font-semibold uppercase text-[10px]">
                        {m.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {m.active ? (
                        <span className="badge badge-success text-[10px]">Active</span>
                      ) : (
                        <span className="badge badge-danger text-[10px]">Suspended</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggle(m)}
                          className={`btn-ghost !py-1 !px-2 text-[11px] ${
                            m.active ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {m.active ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete Manager"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Manager Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-5 h-5 text-brand" />
              <h2 className="text-base font-bold text-slate-900">Create New Manager</h2>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-lg mt-3 text-xs font-medium ${
                  msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                }`}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreateManager} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Manager Name *</label>
                <div className="relative">
                  <input
                    required
                    placeholder="e.g. Tareq Mahmud"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input pl-9"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="manager@meeshomart.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input pl-9"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <input
                    required
                    placeholder="017XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input pl-9"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password (Min 6 characters) *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input pl-9"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500 text-[11px]">
                Managers can log in with their email/phone from the main <code>/login</code> page.
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={busy} className="btn flex-1 !py-2 font-bold">
                  {busy ? 'Creating...' : 'Save Manager'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
