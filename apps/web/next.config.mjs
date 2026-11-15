/** @type {import('next').NextConfig} */

const RENDER_BACKEND = 'https://meeshomart-reseller.onrender.com';
const LOCAL_BACKEND = 'http://localhost:4000';

/**
 * Determine the backend destination for API proxying:
 * 1. Direct environment overrides: API_INTERNAL_URL, NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_API_URL
 * 2. Mode switch: BACKEND_ENV or NEXT_PUBLIC_BACKEND_ENV = 'online' | 'local'
 * 3. Default for Production / Cloud deployment (Vercel, Render, Netlify, etc.): RENDER_BACKEND
 * 4. Default for Local development: LOCAL_BACKEND
 */
function resolveBackendUrl() {
  const custom =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (custom && custom.trim()) {
    const trimmed = custom.trim().replace(/\/+$/, '');
    if (trimmed.toLowerCase() === 'online' || trimmed.toLowerCase() === 'render') {
      return RENDER_BACKEND;
    }
    if (trimmed.toLowerCase() === 'local' || trimmed.toLowerCase() === 'dev') {
      return LOCAL_BACKEND;
    }
    return trimmed;
  }

  const mode = (
    process.env.BACKEND_ENV ||
    process.env.NEXT_PUBLIC_BACKEND_ENV ||
    ''
  ).toLowerCase().trim();

  if (mode === 'online' || mode === 'render') {
    return RENDER_BACKEND;
  }
  if (mode === 'local' || mode === 'dev') {
    return LOCAL_BACKEND;
  }

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.NETLIFY);

  return isProduction ? RENDER_BACKEND : LOCAL_BACKEND;
}

const activeBackend = resolveBackendUrl();
console.log(`[MeeshoMart Frontend] API Proxy Target -> ${activeBackend}`);

const nextConfig = {
  experimental: {
    cpus: 1
  },
  env: {
    NEXT_PUBLIC_ONLINE_BACKEND: RENDER_BACKEND,
    NEXT_PUBLIC_LOCAL_BACKEND: LOCAL_BACKEND,
    NEXT_PUBLIC_ACTIVE_BACKEND: activeBackend
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${activeBackend}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
