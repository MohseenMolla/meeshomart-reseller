import { NextRequest, NextResponse } from 'next/server';

const RENDER_BACKEND = 'https://meeshomart-reseller.onrender.com';
const LOCAL_BACKEND = 'http://localhost:4000';

function getBackendTarget() {
  const custom =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (custom && custom.trim()) {
    const trimmed = custom.trim().replace(/\/+$/, '');
    if (trimmed.toLowerCase() === 'online' || trimmed.toLowerCase() === 'render') return RENDER_BACKEND;
    if (trimmed.toLowerCase() === 'local' || trimmed.toLowerCase() === 'dev') return LOCAL_BACKEND;
    return trimmed;
  }

  const mode = (
    process.env.BACKEND_ENV ||
    process.env.NEXT_PUBLIC_BACKEND_ENV ||
    ''
  ).toLowerCase().trim();

  if (mode === 'online' || mode === 'render') return RENDER_BACKEND;
  if (mode === 'local' || mode === 'dev') return LOCAL_BACKEND;

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.NETLIFY);

  return isProduction ? RENDER_BACKEND : LOCAL_BACKEND;
}

export async function POST(req: NextRequest) {
  const backend = getBackendTarget();
  const cookieHeader = req.headers.get('cookie') || '';
  const isHttps = req.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';

  // 1. Notify the backend to revoke the session in database (with strict 1500ms timeout)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    await fetch(`${backend}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader
      },
      body: JSON.stringify({}),
      signal: controller.signal
    }).catch(() => {});
    clearTimeout(timeout);
  } catch {}

  // 2. Return clean response with Clear-Site-Data and no-cache headers
  const res = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    {
      headers: {
        'Clear-Site-Data': '"cookies", "cache"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    }
  );

  // 3. Clear cookie on frontend domain with all attribute combinations
  res.cookies.delete('token');
  res.cookies.set('token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps
  });

  return res;
}

export async function GET(req: NextRequest) {
  return POST(req);
}
