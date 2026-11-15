'use client';

import Link from 'next/link';
import {
  ThumbsUp,
  Headphones,
  Truck,
  CreditCard,
  ShoppingBag,
  PhoneCall,
  Mail,
  MapPin
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      {/* 4 Feature Highlights Section (Matches dropshipping.com.bd screenshot media_1794740082960_b3f2922f.jpg) */}
      <div className="border-b border-slate-200 py-10 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="w-14 h-14 rounded-full bg-[#00796b] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">High-quality Goods</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Enjoy top quality items for less with verified wholesale floor rates.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="w-14 h-14 rounded-full bg-[#00796b] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <Headphones className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">24/7 Live Support</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Get instant assistance whenever you need it. Call or WhatsApp: <b>01410449778</b>
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="w-14 h-14 rounded-full bg-[#00796b] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Express Shipping</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Fast & reliable delivery options across all 64 districts in Bangladesh.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="w-14 h-14 rounded-full bg-[#00796b] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Secure Payment</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Multiple safe payment methods: Cash on Delivery, bKash, Nagad, Rocket, Bank.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Brand & Description (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo-m.jpg"
                alt="MeeshoMart"
                className="h-9 w-9 rounded-xl object-cover shadow-xs border border-slate-200"
              />
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight leading-none block">
                  Meesho<span className="text-[#00796b]">Mart</span>
                </span>
                <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase block mt-0.5">
                  DROPSHIPPING & RESELLER
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              <b>MeeshoMart Reseller</b> is Bangladesh's trusted and modern dropshipping platform, enabling entrepreneurs to start their online e-commerce business without holding inventory, handling packaging, or courier headaches. Source quality products at wholesale rates and keep 100% of your profit!
            </p>

            <div className="pt-1 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-[#00796b]" />
                <span>Hotline / WhatsApp: <a href="tel:01410449778" className="font-bold text-slate-900 hover:text-[#00796b]">01410449778</a></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#00796b]" />
                <span>Email Support: <a href="mailto:support@meeshomart.com" className="font-semibold text-slate-800 hover:underline">support@meeshomart.com</a></span>
              </div>
            </div>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/track" className="hover:text-[#00796b] transition">Order Tracking</Link>
              </li>
              <li>
                <Link href="/seller/catalog" className="hover:text-[#00796b] transition">Wholesale Catalog</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#00796b] transition">Reseller Login</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#00796b] transition">Dropshipper Register</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#00796b] transition">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Information & Policies (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Information</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <span className="cursor-pointer hover:text-[#00796b] transition">Delivery Policy</span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-[#00796b] transition">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-[#00796b] transition">Return & Refund Policy</span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-[#00796b] transition">Terms & Conditions</span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-[#00796b] transition">About Our Platform</span>
              </li>
            </ul>
          </div>

          {/* Follow Us & Social (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Follow Us</h4>
            <p className="text-xs text-slate-500">
              Stay connected with our dropshipping community for new arrivals and promotional deals.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#00796b] hover:text-white text-slate-700 flex items-center justify-center transition"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7v-3h3V9.5C10 6.46 11.82 5 14.54 5c1.3 0 2.66.23 2.66.23v2.93H15.7c-1.5 0-1.97.93-1.97 1.89V12h3.3l-.53 3h-2.77v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#00796b] hover:text-white text-slate-700 flex items-center justify-center transition"
                title="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#00796b] hover:text-white text-slate-700 flex items-center justify-center transition"
                title="Twitter / X"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#00796b] hover:text-white text-slate-700 flex items-center justify-center transition"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#00796b] hover:text-white text-slate-700 flex items-center justify-center transition"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <span className="font-bold block">Need Help?</span>
              <span>Our dedicated seller helpline is live: <b className="font-mono">01410449778</b></span>
            </div>
          </div>
        </div>

        {/* Payment Gateways Banner (Matches dropshipping.com.bd screenshot media_1794740082960_b3f2922f.jpg) */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-center gap-2 py-2">
            {[
              { name: 'VISA', bg: 'bg-blue-900 text-white font-black' },
              { name: 'Mastercard', bg: 'bg-red-600 text-white font-bold' },
              { name: 'Amex', bg: 'bg-sky-600 text-white font-bold' },
              { name: 'BRAC BANK', bg: 'bg-blue-700 text-white font-bold' },
              { name: 'DBBL NEXUS', bg: 'bg-emerald-700 text-white font-bold' },
              { name: 'City Bank', bg: 'bg-red-700 text-white font-bold' },
              { name: 'Bank Asia', bg: 'bg-blue-800 text-white font-bold' },
              { name: 'bKash', bg: 'bg-pink-600 text-white font-black' },
              { name: 'Nagad', bg: 'bg-orange-600 text-white font-black' },
              { name: 'Rocket', bg: 'bg-purple-700 text-white font-bold' },
              { name: 'Upay', bg: 'bg-blue-600 text-white font-bold' },
              { name: 'Cash On Delivery', bg: 'bg-emerald-800 text-white font-bold' }
            ].map((gw) => (
              <span
                key={gw.name}
                className={`px-3 py-1 rounded text-[11px] tracking-tight border border-slate-200 shadow-2xs ${gw.bg}`}
              >
                {gw.name}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>All right reserved © 2025 MeeshoMart Reseller</p>
          <p className="flex items-center gap-1">
            Developed by <span className="font-bold text-slate-800">MIT</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
