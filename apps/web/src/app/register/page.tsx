'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  User,
  Phone,
  Store,
  Lock,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    shopName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr('');

    if (form.name.trim().length < 2) {
      return setErr('Please enter your full name');
    }
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
      return setErr('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01731517072 or 01410449778)');
    }
    if (form.password.length < 6) {
      return setErr('Password must be at least 6 characters');
    }
    if (form.confirmPassword && form.password !== form.confirmPassword) {
      return setErr('Passwords do not match');
    }

    setBusy(true);
    try {
      await api('/auth/register', {
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          shopName: form.shopName.trim() || undefined,
          email: form.email.trim() || undefined,
          password: form.password,
          referralCode: form.referralCode.trim() || undefined
        }
      });

      // User is automatically signed in via session cookie
      router.push('/seller');
    } catch (x: any) {
      setErr(x.message || 'Registration failed. Please check your information.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-6">
          <img
            src="/logo-m.jpg"
            alt="MeeshoMart"
            className="w-12 h-12 rounded-2xl mx-auto mb-3 shadow-xs border border-slate-100 object-cover"
          />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dropshipper Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Join thousands of resellers across Bangladesh with zero investment
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <input
                required
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                className="input pl-9"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Store / Shop Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Store / Shop Name (Optional)</label>
            <div className="relative">
              <input
                name="shopName"
                placeholder="e.g. Dhaka Trends & Gadgets"
                value={form.shopName}
                onChange={handleChange}
                className="input pl-9"
              />
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Number (Login Identifier) *</label>
            <div className="relative">
              <input
                required
                name="phone"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={handleChange}
                className="input pl-9 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Optional Email */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              name="email"
              placeholder="youremail@example.com"
              value={form.email}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password (Min 6 chars) *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                className="input pl-9 pr-10"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input pl-9 pr-10"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Referral Code if any */}
          {form.referralCode && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-[11px]">
              Referred by partner code: <b>{form.referralCode}</b>
            </div>
          )}

          {err && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {err}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-sm shadow-md transition"
            >
              {busy ? 'Creating your dropshipper account...' : 'REGISTER'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#00796b] hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResellerRegisterPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      {/* Top Navbar & Green Category Bar */}
      <Navbar />

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
          <RegisterForm />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
