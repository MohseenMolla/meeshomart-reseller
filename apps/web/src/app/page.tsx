'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApi, tk } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
  Lock,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Shirt,
  UserCheck,
  Watch,
  Headphones,
  Home,
  Baby,
  Utensils,
  Layers
} from 'lucide-react';

type Product = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  retailPrice: number;
  wholesalePrice?: number;
  stock: number;
  images?: { url: string; publicId: string }[];
};

type Banner = {
  _id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  active: boolean;
  order: number;
};

function HomeContent() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Fetch active banners from API (uploaded via admin panel)
  const { data: banners } = useApi<Banner[]>('/banners');

  // Fetch grouped products for category-wise display
  const { data: groupedRes, loading: groupedLoading } = useApi<any>('/products/grouped/by-category');

  // Fetch all products for "New Arrivals" & "Top Selling"
  const { data: allProductsRes, loading: allLoading } = useApi<any>('/products?limit=60');

  // Fetch dynamic categories with images
  const { data: dbCategories } = useApi<any[]>('/categories');

  // Also fetch search results if query is active
  const { data: searchResults, loading: searchLoading } = useApi<any>(
    searchQuery ? `/products?q=${encodeURIComponent(searchQuery)}` : null
  );

  // Robust array unwrapping: handles both direct Array and { data: [...] }
  const allProducts: Product[] = Array.isArray(allProductsRes)
    ? allProductsRes
    : Array.isArray(allProductsRes?.data)
    ? allProductsRes.data
    : [];

  const groupedData: Record<string, Product[]> = (
    groupedRes && typeof groupedRes === 'object' && !Array.isArray(groupedRes)
      ? (groupedRes.categories || groupedRes.data || groupedRes)
      : {}
  ) as Record<string, Product[]>;

  const canSeeWholesale = Boolean(
    groupedRes?.meta?.canSeeWholesale ||
    groupedRes?.canSeeWholesale ||
    allProductsRes?.meta?.canSeeWholesale
  );

  const searchList: Product[] = Array.isArray(searchResults)
    ? searchResults
    : Array.isArray(searchResults?.data)
    ? searchResults.data
    : [];

  // Default fallback banners if none uploaded yet (pure image banners matching dropshipping.com.bd)
  const defaultBanners: Banner[] = [
    {
      _id: 'b-default-1',
      title: 'One-Click Order Processing, We Handle the Rest!',
      subtitle: 'No more inventory or packaging headaches.',
      badge: "Bangladesh's #1 Dropshipping Hub",
      imageUrl: '/banners/hero-banner-1.svg',
      linkUrl: '/seller/catalog',
      buttonText: 'Start Dropshipping Now',
      active: true,
      order: 1
    },
    {
      _id: 'b-default-2',
      title: 'Trending Winter & Fashion Collection 2025',
      subtitle: 'Premium combo suits, jackets, luxury watches & trending electronics.',
      badge: 'New Arrivals Ready to Ship',
      imageUrl: '/banners/hero-banner-2.svg',
      linkUrl: '/?category=Winter%20Collection',
      buttonText: 'Explore Winter Deals',
      active: true,
      order: 2
    }
  ];

  const activeBanners = banners && banners.length > 0 ? banners : defaultBanners;

  // Banner auto-play slider
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[activeBannerIdx] || activeBanners[0];

  // Category Icon Card Config (Matches dropshipping.com.bd screenshot)
  const categoryCards = [
    { name: 'Winter', label: 'Winter', icon: Shirt, catKey: 'Winter Collection' },
    { name: "Men's Fashion", label: "Men's Fashion", icon: UserCheck, catKey: "Men's Fashion" },
    { name: "Women's Fashion", label: "Women's Fashion", icon: Sparkles, catKey: "Women's Fashion" },
    { name: 'Home & Lifestyle', label: 'Home & Lifestyle', icon: Home, catKey: 'Home & Lifestyle' },
    { name: 'Gadgets & Electronics', label: 'Gadgets & Electronics', icon: Headphones, catKey: 'Gadgets & Electronics' },
    { name: 'Kids Zone', label: 'Kids Zone', icon: Baby, catKey: 'Kids Zone' },
    { name: 'Foods', label: 'Foods', icon: Utensils, catKey: 'Foods' },
    { name: 'Others', label: 'Other’s', icon: Layers, catKey: 'Others' }
  ];

  // Merge configured category cards with dynamic DB category images
  const finalCategoryCards = categoryCards.map((card) => {
    const dbCat = (dbCategories || []).find(
      (c: any) =>
        c.name?.toLowerCase() === card.catKey.toLowerCase() ||
        c.name?.toLowerCase() === card.name.toLowerCase() ||
        c.label?.toLowerCase() === card.label.toLowerCase()
    );
    return {
      ...card,
      imageUrl: dbCat?.imageUrl || ''
    };
  });

  // Products filtered by selected category if param is present
  const categoryFilteredProducts = selectedCategory
    ? allProducts.filter(
        (p) => p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar onSearch={setSearchQuery} />

      {/* Main Promo Banner / Hero Slider (Matches dropshipping.com.bd) */}
      {/* "in hero banner avobe no text will show fix it full functional" */}
      {!searchQuery && !selectedCategory && (
        <section className="bg-white border-b border-slate-200 pt-3 sm:pt-5 pb-3">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100 aspect-[16/7] sm:aspect-[21/8] md:aspect-[3.1/1] max-h-[440px]">
              {/* Pure Image Banner Link (NO text overlay, full image artwork is visible) */}
              <Link
                href={currentBanner.linkUrl || '/seller/catalog'}
                className="block w-full h-full group"
                title={currentBanner.title}
              >
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title || 'MeeshoMart Reseller Banner'}
                  className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-[1.01]"
                />
              </Link>

              {/* Slider Controls (Prev / Next Buttons) */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveBannerIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition z-20 backdrop-blur-xs shadow-md"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveBannerIdx((prev) => (prev + 1) % activeBanners.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition z-20 backdrop-blur-xs shadow-md"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-full">
                    {activeBanners.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveBannerIdx(idx);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          activeBannerIdx === idx ? 'w-6 bg-[#00796b]' : 'w-2 bg-white/70 hover:bg-white'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Guest Notice Banner */}
      {!canSeeWholesale && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              Notice: Wholesale dropshipper prices & profit margins are hidden from guests. Log in or register as a reseller to view wholesale prices.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/login" className="font-bold underline text-brand hover:text-brand-dark">
                Login
              </Link>
              <span>or</span>
              <Link href="/register" className="font-bold underline text-brand hover:text-brand-dark">
                Free Registration
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Categories Showcase Section (Matches dropshipping.com.bd screenshot) */}
      {!searchQuery && (
        <section className="bg-white border-b border-slate-200 py-7">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-center font-bold text-slate-800 text-xs sm:text-sm tracking-wider uppercase mb-5">
              Categories
            </h2>

            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-4">
              {finalCategoryCards.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory.toLowerCase() === cat.catKey.toLowerCase();
                return (
                  <Link
                    key={cat.name}
                    href={isSelected ? '/' : `/?category=${encodeURIComponent(cat.catKey)}`}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition group text-center ${
                      isSelected
                        ? 'border-[#00796b] bg-emerald-50/50 shadow-xs ring-1 ring-[#00796b]'
                        : 'border-slate-100 hover:border-[#00796b]/40 hover:shadow-md bg-white'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center transition shadow-2xs mb-2 overflow-hidden ${
                        isSelected
                          ? 'bg-[#00796b] text-white'
                          : 'bg-slate-50 text-slate-700 group-hover:bg-[#00796b] group-hover:text-white'
                      }`}
                    >
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt={cat.label}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <Icon className="w-6 h-6 transition" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold line-clamp-1 transition ${
                        isSelected ? 'text-[#00796b] font-bold' : 'text-slate-700 group-hover:text-[#00796b]'
                      }`}
                    >
                      {cat.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-10">
        {/* If Search is Active */}
        {searchQuery ? (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Search Results for "{searchQuery}"
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Clear search
              </button>
            </div>

            {searchLoading ? (
              <div className="text-center py-12 text-slate-500 font-medium">Searching products...</div>
            ) : searchList.length === 0 ? (
              <div className="card text-center py-12 text-slate-500">
                No products found matching "{searchQuery}".
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {searchList.map((p) => (
                  <ProductCard key={p._id} product={p} canSeeWholesale={canSeeWholesale} />
                ))}
              </div>
            )}
          </div>
        ) : selectedCategory ? (
          /* If a Category is Filtered */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 bg-[#00796b] rounded-full" />
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedCategory}
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  ({categoryFilteredProducts.length} Products)
                </span>
              </div>
              <Link
                href="/"
                className="text-xs font-semibold text-[#00796b] hover:underline"
              >
                ← View All Categories
              </Link>
            </div>

            {categoryFilteredProducts.length === 0 ? (
              <div className="card text-center py-12 text-slate-500">
                No products currently found in {selectedCategory}.
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {categoryFilteredProducts.map((p) => (
                  <ProductCard key={p._id} product={p} canSeeWholesale={canSeeWholesale} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Homepage Layout: New Arrivals + Top Selling + Category Rows */
          <>
            {/* New Arrival Products Section (Matches dropshipping.com.bd) */}
            {allProducts.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      New Arrival Products
                    </h2>
                  </div>
                  <Link
                    href="/seller/catalog"
                    className="text-xs font-semibold text-[#00796b] hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {allProducts.slice(0, 5).map((p) => (
                    <ProductCard key={p._id} product={p} canSeeWholesale={canSeeWholesale} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Selling Products Section (Matches dropshipping.com.bd) */}
            {allProducts.length > 5 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Top Selling Products
                    </h2>
                  </div>
                  <Link
                    href="/seller/catalog"
                    className="text-xs font-semibold text-[#00796b] hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {allProducts.slice(5, 10).map((p) => (
                    <ProductCard key={p._id} product={p} canSeeWholesale={canSeeWholesale} />
                  ))}
                </div>
              </section>
            )}

            {/* Category-Wise Product Sections (Matches dropshipping.com.bd) */}
            {Object.keys(groupedData).map((categoryName) => {
              const prods = groupedData[categoryName];
              if (!prods || prods.length === 0) return null;

              return (
                <section key={categoryName} className="space-y-4">
                  {/* Category Header Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-6 bg-[#00796b] rounded-full" />
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        {categoryName}
                      </h2>
                    </div>

                    <Link
                      href={`/?category=${encodeURIComponent(categoryName)}`}
                      className="text-xs font-semibold text-[#00796b] hover:underline flex items-center gap-1"
                    >
                      See More in {categoryName} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Product Grid */}
                  <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {prods.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        canSeeWholesale={canSeeWholesale}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>

      {/* Floating WhatsApp Contact Button (Hotline 01410449778) */}
      <a
        href="https://wa.me/8801410449778?text=Hello%20MeeshoMart,%20I%20have%20an%20inquiry%20about%20dropshipping."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3 sm:p-3.5 rounded-full shadow-2xl flex items-center gap-2 transition hover:scale-105 group"
        title="Chat on WhatsApp: 01410449778"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
        <span className="hidden group-hover:inline text-xs font-bold pr-1">
          Chat 01410449778
        </span>
      </a>

      {/* Footer (Full English, 4 feature blocks & payment gateways) */}
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-slate-400">Loading MeeshoMart...</div>}>
      <HomeContent />
    </Suspense>
  );
}

// Reusable Product Card Component matching dropshipping.com.bd
// Note: Uses span/div instead of nested button inside Link to prevent click swallowing
function ProductCard({ product, canSeeWholesale }: { product: Product; canSeeWholesale: boolean }) {
  const img =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
  const dropshipperPrice = product.wholesalePrice;
  const retailPrice = product.retailPrice;
  const profit = dropshipperPrice !== undefined ? retailPrice - dropshipperPrice : 0;

  // Use SKU or MongoDB _id for URL
  const linkHref = `/product/${product.sku || product._id}`;

  return (
    <Link
      href={linkHref}
      className="card !p-0 overflow-hidden group hover:shadow-lg transition duration-200 flex flex-col justify-between bg-white border border-slate-200 hover:border-[#00796b]/40 rounded-xl"
    >
      <div>
        {/* Photo Container */}
        <div className="aspect-square bg-slate-100 overflow-hidden relative">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          {product.stock <= 0 && (
            <span className="absolute top-2 left-2 badge badge-danger text-[10px]">
              Stock Out
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Code: <b className="text-slate-800">{product.sku}</b></span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[90px]">{product.category}</span>
          </div>

          <h3
            className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#00796b] transition"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>
      </div>

      {/* Pricing Footer */}
      <div className="p-3 pt-0 border-t border-slate-100 mt-2 space-y-1">
        {canSeeWholesale && dropshipperPrice !== undefined ? (
          <>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Dropshipper:</span>
              <span className="font-bold text-slate-900">{tk(dropshipperPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Retail: {tk(retailPrice)}</span>
              <span className="font-bold text-emerald-700">Profit: {tk(profit)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Retail Price:</span>
              <span className="font-bold text-slate-900">{tk(retailPrice)}</span>
            </div>
            <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-center">
              Login to view wholesale & profit
            </div>
          </>
        )}

        {/* Non-button div element so click bubbles cleanly to the parent Link */}
        <div className="w-full py-1.5 text-xs font-bold mt-1 bg-[#00796b] group-hover:bg-[#00695c] text-white rounded-lg text-center transition shadow-2xs">
          Order Now
        </div>
      </div>
    </Link>
  );
}
