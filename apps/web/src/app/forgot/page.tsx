'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ForgotPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const em = String(new FormData(e.currentTarget).get('email'));
    try {
      await api('/auth/forgot', { body: { email: em } });
      setEmail(em);
      setStep('reset');
    } catch (x: any) {
      setErr(x.message);
    }
    setBusy(false);
  }

  async function reset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const f = new FormData(e.currentTarget);
    if (f.get('password') !== f.get('confirm')) {
      setBusy(false);
      return setErr('Passwords do not match');
    }
    try {
      await api('/auth/reset', {
        body: {
          email,
          code: String(f.get('code')).trim(),
          password: f.get('password')
        }
      });
      setStep('done');
    } catch (x: any) {
      setErr(x.message);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            {step === 'done' && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h1 className="text-xl font-bold text-slate-900">Password Reset Successful</h1>
                <p className="text-xs text-slate-600">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
                <div className="pt-2">
                  <Link href="/login" className="btn w-full !py-2.5 bg-[#00796b] text-white font-bold text-sm">
                    Back to Login
                  </Link>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <form onSubmit={reset} className="space-y-4 text-xs">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold text-slate-900">Enter Reset Code</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    If an account exists for {email}, a 6-digit code has been sent.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">6-Digit Verification Code</label>
                  <input
                    name="code"
                    required
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="123456"
                    className="input font-mono font-bold text-center tracking-widest text-base"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password (Min 8 chars)</label>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    placeholder="New password"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    name="confirm"
                    type="password"
                    required
                    placeholder="Confirm new password"
                    className="input"
                  />
                </div>

                {err && <div className="p-3 bg-red-50 text-red-700 rounded-lg">{err}</div>}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn w-full !py-2.5 bg-[#00796b] text-white font-bold text-sm"
                >
                  {busy ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}

            {step === 'email' && (
              <form onSubmit={send} className="space-y-4 text-xs">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold text-slate-900">Forgot Password</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your email to receive a password reset verification code.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="input"
                  />
                </div>

                {err && <div className="p-3 bg-red-50 text-red-700 rounded-lg">{err}</div>}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn w-full !py-2.5 bg-[#00796b] text-white font-bold text-sm"
                >
                  {busy ? 'Sending code...' : 'Send Verification Code'}
                </button>

                <div className="text-center pt-2">
                  <Link href="/login" className="text-xs text-[#00796b] font-semibold hover:underline">
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
