'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ShoppingBag,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  KeyRound
} from 'lucide-react';

export default function ResellerLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totp, setTotp] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      const d = await api<{ role?: string; twoFactorRequired?: boolean }>('/auth/login', {
        body: {
          identifier: identifier.trim(),
          password,
          totp: totp || undefined
        }
      });

      if (d.twoFactorRequired) {
        setNeed2fa(true);
      } else {
        const role = d.role;
        if (role === 'super_admin' || role === 'manager' || role === 'staff') {
          router.push('/admin');
        } else if (role === 'seller' || role === 'reseller') {
          router.push('/seller');
        } else {
          router.push('/');
        }
      }
    } catch (x: any) {
      setErr(x.message || 'Login failed. Please check your phone/email and password.');
    } finally {
      setBusy(false);
    }
  }

  const fillDemo = (id: string, pw: string) => {
    setIdentifier(id);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      {/* Top Navbar & Green Category Bar */}
      <Navbar />

      {/* Main Centered Login Card (Matches dropshipping.com.bd screenshot media_1794740169492_898aaeb7.png) */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            {/* Header */}
            <div className="text-center mb-6">
              <img
                src="/logo-m.jpg"
                alt="MeeshoMart"
                className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-xs border border-slate-100 object-cover"
              />
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Dropshipper Login
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Access your wholesale pricing and reseller dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Phone or Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number or Email *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01731517072 or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    readOnly={need2fa}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#00796b] focus:ring-1 focus:ring-[#00796b] text-sm text-slate-900 font-medium transition"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    readOnly={need2fa}
                    className="w-full px-4 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#00796b] focus:ring-1 focus:ring-[#00796b] text-sm text-slate-900 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgotten password */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-[#00796b] focus:ring-[#00796b] h-3.5 w-3.5"
                  />
                  <span>Remember Me</span>
                </label>
                <Link href="/forgot" className="text-[#00796b] hover:underline font-semibold">
                  Forgotten password?
                </Link>
              </div>

              {need2fa && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                  <p className="text-xs text-amber-900 font-medium">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="123456"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                    className="input tracking-widest text-center text-base font-bold"
                  />
                </div>
              )}

              {err && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-700 font-medium">
                  {err}
                </div>
              )}

              {/* Action Buttons (Matches dropshipping.com.bd styling) */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 rounded-lg bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-sm shadow-md transition"
                >
                  {busy ? 'Signing in...' : need2fa ? 'Verify & Login' : 'LOGIN'}
                </button>

                <div className="text-center text-xs text-slate-500 pt-1">
                  Don't have a dropshipper account?{' '}
                  <Link href="/register" className="font-bold text-[#00796b] hover:underline">
                    Register Here
                  </Link>
                </div>
              </div>
            </form>

            {/* Quick Test Accounts for Instant Testing */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center uppercase tracking-wider">
                1-Click Test Credentials
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillDemo('admin@meeshomart.com', 'admin123456')}
                  className="btn-ghost !py-1.5 !px-2 text-center text-[10px] hover:bg-slate-100"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('manager@meeshomart.com', 'manager123456')}
                  className="btn-ghost !py-1.5 !px-2 text-center text-[10px] hover:bg-slate-100"
                >
                  👔 Manager
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('01731517072', 'reseller123456')}
                  className="btn-ghost !py-1.5 !px-2 text-center text-[10px] hover:bg-slate-100"
                >
                  🛍️ Reseller
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
