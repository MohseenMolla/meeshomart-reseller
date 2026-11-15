import { useEffect, useState, useCallback } from 'react';

export const RENDER_BACKEND_URL = 'https://meeshomart-reseller.onrender.com';
export const LOCAL_BACKEND_URL = 'http://localhost:4000';

/**
 * Resolves the active API base URL.
 * In browser: uses '/api/v1' so Next.js server proxies it to either local or Render backend.
 * On server (SSR/SSG): uses absolute URL to reach the backend directly.
 */
export function getApiBaseUrl(): string {
  // If running in browser:
  if (typeof window !== 'undefined') {
    // Check localStorage developer override (useful for testing on the fly)
    const localOverride = window.localStorage.getItem('MEESHOMART_BACKEND_URL');
    if (localOverride && localOverride.trim()) {
      return localOverride.trim().replace(/\/+$/, '') + '/api/v1';
    }

    // Direct API override if specified
    const directApi = process.env.NEXT_PUBLIC_DIRECT_API_URL;
    if (directApi && directApi.trim()) {
      return directApi.trim().replace(/\/+$/, '') + '/api/v1';
    }

    // Default: relative proxy route handled by Next.js rewrites
    return '/api/v1';
  }

  // If running on server side (SSR / Node.js):
  const serverTarget =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_ACTIVE_BACKEND ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.RENDER
      ? RENDER_BACKEND_URL
      : LOCAL_BACKEND_URL);

  return serverTarget.replace(/\/+$/, '') + '/api/v1';
}

export function getActiveBackendInfo() {
  const isOnline =
    typeof window !== 'undefined'
      ? window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      : process.env.NODE_ENV === 'production';

  return {
    isOnline,
    onlineUrl: RENDER_BACKEND_URL,
    localUrl: LOCAL_BACKEND_URL,
    activeUrl:
      process.env.NEXT_PUBLIC_ACTIVE_BACKEND ||
      (isOnline ? RENDER_BACKEND_URL : LOCAL_BACKEND_URL)
  };
}

export class ApiError extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
  }
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const r = await fetch(url, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) {
    const e = j.error;
    throw new ApiError(
      r.status,
      typeof e === 'string'
        ? e
        : e?.fieldErrors
        ? Object.values(e.fieldErrors).flat().join(', ')
        : 'Request failed'
    );
  }
  if (j.data !== undefined) {
    if (j.meta && typeof j.data === 'object' && !Array.isArray(j.data)) {
      return { ...j.data, meta: j.meta } as T;
    }
    return j.data as T;
  }
  return j as T;
}

export const bdt = (n: number) => (n ? `${n.toLocaleString('en-US')} TK` : '0 TK');
export const tk = (n: number) => (n ? `${n.toLocaleString('en-US')} TK` : '0 TK');

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);

  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    api<T>(path)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(load, [load]);
  return { data, error, loading, reload: load };
}
