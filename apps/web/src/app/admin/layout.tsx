'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, useApi, logoutUser } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShoppingBag,
  Package,
  TrendingUp,
  Wallet,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Image as ImageIcon,
  Layers
} from 'lucide-react';

type UserMe = {
  userId: string;
  role: string;
  name: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user, error, loading } = useApi<UserMe>('/auth/me');

  const isSuperAdmin = user?.role === 'super_admin';
  const isManager = user?.role === 'manager' || user?.role === 'staff';
  const ok = isSuperAdmin || isManager;

  useEffect(() => {
    if (error) router.replace('/login');
    else if (user && !ok) router.replace('/');
  }, [error, user, ok, router]);

  if (loading || !ok) {
    return <div className="p-12 text-center text-slate-500 font-medium">Verifying authorization...</div>;
  }

  // Define navigation items based on role
  const nav = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    ...(isSuperAdmin ? [{ href: '/admin/managers', label: 'Managers (Max 50)', icon: Users }] : []),
    { href: '/admin/sellers', label: 'Resellers (Unlimited)', icon: UserCheck },
    { href: '/admin/orders', label: 'All Orders', icon: Package },
    { href: '/admin/products', label: 'Products & Media', icon: ShoppingBag },
    { href: '/admin/categories', label: 'Categories & Images', icon: Layers },
    { href: '/admin/banners', label: 'Home Banners', icon: ImageIcon },
    { href: '/admin/profits', label: 'Profit Breakdown', icon: TrendingUp },
    ...(isSuperAdmin ? [{ href: '/admin/withdrawals', label: 'Payout Requests', icon: Wallet }] : []),
    { href: '/admin/security', label: 'Security & 2FA', icon: Shield }
  ];

  async function handleLogout() {
    await api('/auth/logout', { method: 'POST', body: {} });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900 text-slate-200 p-5 shrink-0 justify-between">
        <div>
          {/* Logo & Platform Name */}
          <Link href="/admin" className="flex items-center gap-2.5 pb-5 border-b border-slate-800">
            <img
              src="/logo-m.jpg"
              alt="MeeshoMart"
              className="h-9 w-9 rounded-xl object-cover shadow-sm border border-slate-700"
            />
            <div>
              <span className="text-base font-black text-white tracking-tight leading-none block">
                MeeshoMart
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                {isSuperAdmin ? '👑 Super Admin' : '👔 Manager Panel'}
              </span>
            </div>
          </Link>

          {/* Current User Pill */}
          <div className="mt-4 p-3 bg-slate-800/70 rounded-xl border border-slate-700/50">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
              <span className="badge badge-success text-[10px]">Online</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <span>Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => logoutUser('/login')}
            className="w-full flex items-center gap-2 text-xs text-rose-400 hover:bg-rose-950/40 px-3 py-2 rounded-lg transition font-bold border border-rose-900/50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header with Quick Logout Button */}
      <div className="md:hidden bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <Link href="/admin" className="flex items-center gap-2">
          <img src="/logo-m.jpg" alt="MeeshoMart" className="h-7 w-7 rounded-lg object-cover" />
          <div>
            <span className="font-black text-xs text-white leading-tight block">MeeshoMart</span>
            <span className="text-[9px] text-emerald-400 font-semibold block leading-tight">
              {isSuperAdmin ? 'Admin' : 'Manager'}
            </span>
          </div>
        </Link>

        {/* Right side mobile actions: Quick Logout + Menu Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => logoutUser('/login')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Log out of Admin Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2 text-slate-300 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? 'bg-brand text-white' : 'hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Bottom Action Block */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => logoutUser('/login')}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout from Admin Panel</span>
            </button>

            <div className="flex justify-between items-center text-[11px] px-1 text-slate-400 pt-1">
              <Link href="/" target="_blank" className="hover:text-white flex items-center gap-1">
                <span>Public Store</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span>{user?.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
