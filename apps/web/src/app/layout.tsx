import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MeeshoMart Reseller - Bangladesh Premier Dropshipping Platform',
  description: 'Start your dropshipping & reselling business with 0 investment. Wholesale pricing, cash on delivery, and instant profit withdrawal.',
  keywords: 'meeshomart reseller, dropshipping bangladesh, dropshipping.com.bd, wholesale supplier bangladesh',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo-m.jpg'
  }
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans pb-14 md:pb-0">
        {children}
      </body>
    </html>
  );
}
