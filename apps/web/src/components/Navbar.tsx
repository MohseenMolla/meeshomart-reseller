'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useApi } from '@/lib/api';
import {
  ShoppingBag,
  Search,
  PhoneCall,
  User,
  Heart,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  Home,
  Layers,
  Shirt,
  UserCheck,
  Sparkles,
  Headphones,
  Baby,
  Utensils,
  Truck,
  HelpCircle
} from 'lucide-react';

type UserMe = {
  userId: string;
  role: string;
  name: string;
  shopName?: string;
  phone?: string;
};

export const CATEGORIES = [
  { name: 'Winter Collection', label: 'Winter', icon: Shirt },
  { name: "Men's Fashion", label: "Men's Fashion", icon: UserCheck },
  { name: "Women's Fashion", label: "Women's Fashion", icon: Sparkles },
  { name: 'Home & Lifestyle', label: 'Home & Lifestyle', icon: Home },
  { name: 'Gadgets & Electronics', label: 'Gadgets & Electronics', icon: Headphones },
  { name: 'Beauty & Personal Care', label: 'Beauty', icon: Sparkles },
  { name: 'Kids Zone', label: 'Kids Zone', icon: Baby },
  { name: 'Foods', label: 'Foods', icon: Utensils },
  { name: 'Others', label: 'Other’s', icon: Layers }
];

function NavbarContent({ onSearch }: { onSearch?: (q: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  const [search, setSearch] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const { data: user } = useApi<UserMe>('/auth/me');

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setAccountMenuOpen(false);
  }, [pathname, searchParams]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileDrawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };

  const isStaff = user && ['super_admin', 'manager', 'staff'].includes(user.role);
  const isReseller = user && ['seller', 'reseller'].includes(user.role);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top Micro-Bar (Hotline, Free Dropshipping announcement) */}
        <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 hidden sm:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Bangladesh #1 Dropshipping Platform
              </span>
              <span className="text-slate-500">|</span>
              <span>Delivery Inside Dhaka 60 TK • Outside 120 TK</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="tel:01410449778"
                className="hover:text-white transition flex items-center gap-1 font-mono font-bold"
              >
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                Hotline: 01410449778
              </a>
              <span className="text-slate-600">|</span>
              <a
                href="https://wa.me/8801410449778"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-300 transition flex items-center gap-1 text-emerald-400"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp Live
              </a>
              <span className="text-slate-600">|</span>
              <Link href="/track" className="hover:text-white transition">
                Order Tracking
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Mobile Hamburger & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Button (Mobile Only) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 text-slate-700 hover:text-[#00796b] hover:bg-slate-100 rounded-lg transition"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <img
                src="/logo-m.jpg"
                alt="MeeshoMart"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover shadow-xs border border-slate-100 group-hover:scale-105 transition"
              />
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center leading-none">
                  Meesho<span className="text-[#00796b] ml-0.5 sm:ml-1">Mart</span>
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 tracking-wider uppercase block mt-0.5">
                  DROPSHIPPING & RESELLER
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop & Tablet) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for wholesale products by name, code or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
                className="w-full pl-4 pr-11 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00796b] focus:ring-1 focus:ring-[#00796b] transition"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#00796b] transition rounded-lg"
                title="Search products"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </form>

          {/* Right: Hotline Call & Account Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Desktop Hotline Box */}
            <a
              href="tel:01410449778"
              className="hidden lg:flex items-center gap-2 text-left group pl-2"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 group-hover:bg-emerald-100 transition">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block leading-tight">Hotline Support:</span>
                <span className="text-xs font-bold text-slate-900 font-mono tracking-tight group-hover:text-[#00796b] transition">
                  01410449778
                </span>
              </div>
            </a>

            {/* User Account / Logged in Dashboard Button */}
            {user ? (
              <div className="relative">
                <Link
                  href={isStaff ? '/admin' : '/seller'}
                  className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl border border-slate-200 hover:border-[#00796b] bg-slate-50 hover:bg-white transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#00796b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left pr-2">
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[110px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#00796b] font-semibold capitalize block leading-tight">
                      {user.role === 'super_admin'
                        ? 'Admin Panel'
                        : user.role === 'manager'
                        ? 'Manager Panel'
                        : 'Reseller Panel'}
                    </span>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#00796b] px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="btn text-xs font-bold !py-1.5 !px-3 shadow-xs bg-[#00796b] hover:bg-[#00695c]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar (visible on screens < md) */}
        <div className="md:hidden px-3 pb-2.5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products by name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00796b] transition"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#00796b]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Green Category Navigation Bar (Touch-optimized horizontal scroll) */}
        <nav className="bg-[#00796b] text-white shadow-inner">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center overflow-x-auto scrollbar-none py-0.5 whitespace-nowrap">
            {CATEGORIES.map((cat) => {
              const isSelected = currentCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <Link
                  key={cat.name}
                  href={`/?category=${encodeURIComponent(cat.name)}`}
                  className={`px-3 py-2 text-[11px] sm:text-xs font-bold tracking-wide uppercase transition shrink-0 flex items-center gap-1 border-b-2 ${
                    isSelected
                      ? 'border-amber-300 bg-emerald-800 text-amber-200'
                      : 'border-transparent hover:bg-emerald-800/80 hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Sidebar */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2"
              >
                <img src="/logo-m.jpg" alt="MeeshoMart" className="h-8 w-8 rounded-lg object-cover" />
                <div>
                  <span className="text-base font-black text-slate-900 leading-none block">
                    Meesho<span className="text-[#00796b]">Mart</span>
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dropshipping & Reseller
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              {/* User Account / Login State */}
              {user ? (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{user.phone || 'Reseller'}</p>
                  <div className="mt-2.5 pt-2 border-t border-emerald-100 flex gap-2">
                    <Link
                      href={isStaff ? '/admin' : '/seller'}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="btn flex-1 !py-1.5 text-xs font-bold justify-center"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-800">Become a Reseller Today</p>
                  <p className="text-[11px] text-slate-500">
                    Access factory wholesale prices with zero investment
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="btn-ghost !py-1.5 text-xs justify-center font-bold"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="btn !py-1.5 text-xs justify-center font-bold"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                  Quick Navigation
                </span>
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 text-slate-800 font-medium"
                >
                  <Home className="w-4 h-4 text-[#00796b]" /> Home
                </Link>
                <Link
                  href="/seller/catalog"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 text-slate-800 font-medium"
                >
                  <ShoppingBag className="w-4 h-4 text-[#00796b]" /> Wholesale Catalog
                </Link>
                <Link
                  href="/track"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 text-slate-800 font-medium"
                >
                  <Truck className="w-4 h-4 text-[#00796b]" /> Order Tracking
                </Link>
              </div>

              {/* Categories Section */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                  Product Categories
                </span>
                <div className="space-y-0.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.name}
                        href={`/?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => setMobileDrawerOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span>{cat.name}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Bottom Support Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2 text-xs">
              <a
                href="tel:01410449778"
                className="flex items-center gap-2 font-bold text-slate-800 hover:text-[#00796b]"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Call Hotline: 01410449778</span>
              </a>
              <a
                href="https://wa.me/8801410449778"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-bold text-emerald-600"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Live Chat</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* App-Like Mobile Bottom Navigation Bar (Fixed for mobile, hidden on md+) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
            pathname === '/' && !currentCategory ? 'text-[#00796b]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
            currentCategory ? 'text-[#00796b]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Categories</span>
        </button>

        <Link
          href="/seller/catalog"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
            pathname.startsWith('/seller/catalog') ? 'text-[#00796b]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Catalog</span>
        </Link>

        <a
          href="https://wa.me/8801410449778?text=Hello%20MeeshoMart"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold text-emerald-600"
        >
          <MessageCircle className="w-5 h-5 mb-0.5 fill-emerald-100" />
          <span>WhatsApp</span>
        </a>

        <Link
          href={user ? (isStaff ? '/admin' : '/seller') : '/login'}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
            pathname.startsWith('/seller') || pathname.startsWith('/admin') || pathname.startsWith('/login')
              ? 'text-[#00796b]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>{user ? 'Account' : 'Login'}</span>
        </Link>
      </div>
    </>
  );
}

export default function Navbar(props: { onSearch?: (q: string) => void }) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-m.jpg" alt="MeeshoMart" className="h-8 w-8 rounded-xl object-cover" />
              <span className="text-lg font-black tracking-tight text-slate-900">
                Meesho<span className="text-[#00796b]">Mart</span>
              </span>
            </div>
          </div>
        </header>
      }
    >
      <NavbarContent {...props} />
    </Suspense>
  );
}
