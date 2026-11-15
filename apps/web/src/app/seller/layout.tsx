'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, tk, useApi } from '@/lib/api';
import { OverviewCtx, type Overview } from '@/lib/overview';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wallet,
  Store,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  X,
  CreditCard,
  PlusCircle,
  Truck
} from 'lucide-react';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data, error, loading, reload } = useApi<Overview>(
    path === '/seller/payment-result' ? null : '/sellers/me/overview'
  );

  useEffect(() => {
    if (error) router.replace('/login');
  }, [error, router]);

  if (path === '/seller/payment-result') return <>{children}</>;
  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Loading panel...</div>;
  if (!data) return null;

  const nav = [
    { href: '/seller', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/seller/catalog', label: 'Wholesale Catalog', icon: ShoppingBag },
    { href: '/seller/orders', label: 'My Orders', icon: Package },
    { href: '/seller/wallet', label: 'Profit & Withdraw', icon: Wallet },
    { href: '/seller/store', label: 'Store Settings', icon: Store },
    { href: '/seller/security', label: 'Security & Password', icon: Shield }
  ];

  async function handleLogout() {
    await api('/auth/logout', { method: 'POST', body: {} });
    router.push('/login');
  }

  return (
    <OverviewCtx.Provider value={data}>
      <div className="flex min-h-screen flex-col md:flex-row bg-slate-50">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white p-5 shrink-0 justify-between">
          <div>
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 pb-5 border-b border-slate-100">
              <img
                src="/logo-m.jpg"
                alt="MeeshoMart"
                className="h-9 w-9 rounded-xl object-cover shadow-sm border border-slate-200"
              />
              <div>
                <span className="text-base font-black text-slate-900 tracking-tight leading-none block">
                  MeeshoMart
                </span>
                <span className="text-[10px] font-bold text-[#00796b] uppercase tracking-wider">
                  Reseller Panel
                </span>
              </div>
            </Link>

            {/* Seller profile card */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-900 truncate">{data.shopName || data.name}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>ID: {data.sellerCode || 'RSL-ACTIVE'}</span>
                <span className="badge badge-success text-[10px]">Active</span>
              </div>
            </div>

            {/* Quick Wallet Summary Pill */}
            <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-medium block">Available Balance</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-lg font-black text-emerald-700">{tk(data.wallet.available)}</span>
                <Link href="/seller/wallet" className="text-[11px] text-brand hover:underline font-semibold">
                  Withdraw
                </Link>
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
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <span>Visit Public Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-xs text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <Link href="/seller" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900">MeeshoMart Reseller</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/seller/wallet" className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded border border-emerald-200">
              {tk(data.wallet.available)}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1 shadow-lg">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <Link href="/" target="_blank" className="text-slate-500">Public Store</Link>
              <button onClick={handleLogout} className="text-red-600 font-medium">Logout</button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </OverviewCtx.Provider>
  );
}
