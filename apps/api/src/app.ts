import 'express-async-errors'; // Express 4 does not forward async errors to the error handler by default
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import mongoose from 'mongoose';
import { csrfOriginGuard,noSqlGuard,requestLog } from './middleware/security';
import { auth } from './routes/auth';
import { payments } from './routes/payments';
import { plans,products,orders,wallet,banners,categories } from './routes/core';
import { admin } from './routes/admin';
import { uploads } from './routes/uploads';
import { notifications } from './routes/notifications';
import { sellerMe } from './routes/sellerMe';
import { myStore,publicStore } from './routes/storefront';
import { withdrawals } from './routes/seller';
export const app=express();
if(process.env.TRUST_PROXY)app.set('trust proxy',+process.env.TRUST_PROXY||1); // correct client IPs for rate limiting behind a proxy
app.disable('x-powered-by');app.use(requestLog);app.use(helmet());app.use(cors({origin:config.origin,credentials:true}));
app.use(express.json({limit:'100kb'}));app.use(express.urlencoded({extended:false}));app.use(cookieParser());app.use(noSqlGuard);app.use('/api',csrfOriginGuard);

// Prevent browsers and proxies from caching API responses (critical for auth state, logout, and live balance)
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
const isDev = process.env.NODE_ENV !== 'production';

// General API rate limit: disabled in development, generous in prod
app.use(
  '/api',
  rateLimit({
    skip: () => isDev,
    windowMs: 60e3,
    limit: 600,
    message: { success: false, error: 'Too many requests. Please wait a moment.' }
  })
);

// Sensitive Auth Rate Limit: applies only to login/register/otp in production (NEVER blocks /me or /logout)
const authLimiter = rateLimit({
  skip: () => isDev,
  windowMs: 15 * 60e3,
  limit: 100,
  message: { success: false, error: 'Too many login attempts. Please wait 15 minutes.' }
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/(verify-email|resend-otp|forgot|reset)', authLimiter);
app.use('/api/v1/auth', auth);
app.use('/api/v1/payments',payments);app.use('/api/v1/subscriptions/plans',plans);
app.use('/api/v1/banners',banners);
app.use('/api/v1/categories',categories);
app.use('/api/v1/products',products);app.use('/api/v1/orders',orders);app.use('/api/v1/wallet',wallet);
app.use('/api/v1/admin',admin);app.use('/api/v1/withdrawals',withdrawals);
app.use('/api/v1/stores/me',myStore);app.use('/api/v1/stores',publicStore);
app.use('/api/v1/sellers/me',sellerMe);
app.use('/api/v1/notifications',notifications);
app.use('/api/v1/uploads',uploads);
app.get('/health',(_q,r)=>mongoose.connection.readyState===1?r.json({ok:true}):r.status(503).json({ok:false}));
app.use((e:any,_q:any,r:any,_n:any)=>{if(e.name==='MulterError'||e.message?.startsWith('Only JPG'))return r.status(e.code==='LIMIT_FILE_SIZE'?413:400).json({success:false,error:e.code==='LIMIT_FILE_SIZE'?'Image is larger than 5 MB':e.message});if(e.name!=='ZodError')console.error(e);r.status(e.name==='ZodError'?400:500).json({success:false,error:e.name==='ZodError'?e.flatten():'Server error'});});
