// Proxy /api to the Express API so auth cookies stay same-origin (no cross-site cookie issues).
export default { async rewrites(){ return [{ source:'/api/:path*', destination:(process.env.API_INTERNAL_URL||'http://localhost:4000')+'/api/:path*' }]; } };
