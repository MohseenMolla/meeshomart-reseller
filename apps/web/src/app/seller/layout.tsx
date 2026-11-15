'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, tk, useApi, logoutUser } from '@/lib/api';
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
  Truck,
  Loader2
} from 'lucide-react';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function triggerLogout(e?: React.SyntheticEvent) {
    setIsLoggingOut(true);
    await logoutUser('/login', e);
  }

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
              type="button"
              disabled={isLoggingOut}
              onClick={triggerLogout}
              className="w-full flex items-center gap-2 text-xs text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition font-bold border border-rose-100 cursor-pointer disabled:opacity-60"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <LogOut className="w-4 h-4" />}
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </aside>

        {/* Mobile Top Header with Quick Logout Button */}
        <div className="md:hidden bg-white border-b border-slate-200 p-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <Link href="/seller" className="flex items-center gap-2">
            <img src="/logo-m.jpg" alt="MeeshoMart" className="h-7 w-7 rounded-lg object-cover" />
            <div>
              <span className="font-black text-xs text-slate-900 leading-tight block">MeeshoMart</span>
              <span className="text-[9px] text-[#00796b] font-semibold block leading-tight">Reseller</span>
            </div>
          </Link>

          {/* Right side mobile actions: Wallet + Quick Logout + Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/seller/wallet"
              className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-200 shrink-0"
              title="Available Wallet Balance"
            >
              {tk(data.wallet.available)}
            </Link>

            <button
              type="button"
              disabled={isLoggingOut}
              onClick={triggerLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
              title="Log out of Reseller Panel"
            >
              {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>{isLoggingOut ? '...' : 'Logout'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150">
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
                      active ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Bottom Action Block */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={triggerLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98 disabled:opacity-60"
              >
                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <LogOut className="w-4 h-4" />}
                <span>{isLoggingOut ? 'Logging out...' : 'Logout from Reseller Panel'}</span>
              </button>

              <div className="flex justify-between items-center text-[11px] px-1 text-slate-500 pt-1">
                <Link href="/" target="_blank" className="hover:text-slate-800 flex items-center gap-1">
                  <span>Visit Public Store</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <span>{data.shopName || data.name}</span>
              </div>
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
