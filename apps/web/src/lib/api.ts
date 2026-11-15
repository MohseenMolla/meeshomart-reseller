export class ApiError extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
  }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch('/api/v1' + path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) {
    const e = j.error;
    throw new ApiError(r.status, typeof e === 'string' ? e : e?.fieldErrors ? Object.values(e.fieldErrors).flat().join(', ') : 'Request failed');
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

import { useEffect, useState, useCallback } from 'react';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);

  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    api<T>(path)
      .then(d => {
        setData(d);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(load, [load]);
  return { data, error, loading, reload: load };
}
