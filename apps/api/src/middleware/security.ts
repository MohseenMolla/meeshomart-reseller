import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const originOf = (u: string) => {
  try {
    return new URL(u).origin;
  } catch {
    return '';
  }
};

/**
 * Universal origin validator that accommodates:
 * 1. localhost & 127.0.0.1 on any port
 * 2. Local network IP ranges for mobile device testing (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
 * 3. Vercel & Render cloud deployment domains
 * 4. Configured origins in CLIENT_ORIGIN (single or comma-separated) and API_PUBLIC_URL
 */
export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;

    // Loopback / localhost
    if (host === 'localhost' || host === '127.0.0.1') return true;

    // Local area network private IPs for mobile testing
    if (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
    ) {
      return true;
    }

    // Official deployment platforms
    if (host.endsWith('.vercel.app') || host.endsWith('.onrender.com')) return true;

    // Configured origins
    const configured = (process.env.CLIENT_ORIGIN || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const c of configured) {
      try {
        if (new URL(c).origin === url.origin) return true;
      } catch {
        if (c === origin) return true;
      }
    }

    if (config.origin) {
      try {
        if (new URL(config.origin).origin === url.origin) return true;
      } catch {}
    }

    if (config.apiUrl) {
      try {
        if (new URL(config.apiUrl).origin === url.origin) return true;
      } catch {}
    }
  } catch {}

  return false;
}

/** CSRF defence for cookie auth: state-changing requests that carry the session cookie must come from an authorized origin. */
export function csrfOriginGuard(req: Request, res: Response, next: NextFunction) {
  // Safe HTTP methods don't need CSRF check
  if (!UNSAFE.has(req.method)) return next();

  // Requests without auth cookies aren't vulnerable to cookie-based CSRF
  if (!req.cookies?.token) return next();

  // Logout is always permitted
  if (req.originalUrl?.includes('/auth/logout') || req.path?.includes('/logout')) return next();

  // Modern browser metadata header check
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
    return next();
  }

  const o = req.headers.origin ? String(req.headers.origin) : originOf(String(req.headers.referer || ''));

  // If origin/referer is missing (e.g. mobile privacy mode or direct server-to-server rewrite)
  if (!o) {
    if (process.env.NODE_ENV !== 'production' || secFetchSite !== 'cross-site') {
      return next();
    }
  }

  if (o && isAllowedOrigin(o)) return next();

  // Check if origin matches Host header
  const reqHost = req.headers.host;
  if (reqHost && o) {
    try {
      if (new URL(o).host === reqHost) return next();
    } catch {}
  }

  res.status(403).json({ success: false, error: 'Cross-site request blocked' });
}

/** Rejects Mongo operator injection ($where, {"$ne":..}) and dotted keys in body/query/params. */
const bad = (v: any, d = 0): boolean =>
  d > 8 ||
  (v &&
    typeof v === 'object' &&
    Object.entries(v).some(([k, x]) => k.startsWith('$') || k.includes('.') || bad(x, d + 1)));

export function noSqlGuard(req: Request, res: Response, next: NextFunction) {
  if (bad(req.body) || bad(req.query) || bad(req.params)) {
    return res.status(400).json({ success: false, error: 'Invalid input' });
  }
  next();
}

/** One JSON line per request: no bodies, no cookies, no query strings (avoids logging secrets/PII). */
export function requestLog(req: Request, res: Response, next: NextFunction) {
  const t = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        JSON.stringify({
          t: new Date().toISOString(),
          m: req.method,
          p: req.path,
          s: res.statusCode,
          ms: Date.now() - t
        })
      );
    }
  });
  next();
}
