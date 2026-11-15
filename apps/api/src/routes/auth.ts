import { Router, Request, Response } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import { config } from '../config';
import { User, SellerProfile, Session } from '../models';
import { requireAuth, AuthReq } from '../middleware/auth';
import { issueOtp, verifyOtp } from '../services/otp';
import { encrypt, decrypt, hmac } from '../services/crypto';

export const auth = Router();
const bad = (res: Response, s = 401, m = 'Invalid phone/email or password') =>
  res.status(s).json({ success: false, error: m });

// User-friendly Registration Schema
const regSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Must be a valid 11-digit phone number (e.g. 01410449778)'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  shopName: z.string().optional().default(''),
  address: z.string().optional().default('Dhaka, Bangladesh'),
  referralCode: z.string().optional(),
  terms: z.boolean().optional()
});

auth.post('/register', async (req, res) => {
  const d = regSchema.safeParse(req.body);
  if (!d.success) return res.status(400).json({ success: false, error: d.error.flatten() });
  const v = d.data;

  // Use provided email or generate a clean phone-based placeholder
  const cleanEmail = (v.email && v.email.trim()) ? v.email.trim().toLowerCase() : `${v.phone}@meeshomart.com`;
  const cleanShopName = (v.shopName && v.shopName.trim()) ? v.shopName.trim() : `${v.name}'s Shop`;

  // Check existing user
  const existing = await User.findOne({
    $or: [{ phone: v.phone }, { email: cleanEmail }]
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'This phone number or email is already registered. Please log in.'
    });
  }

  const u = await User.create({
    name: v.name,
    email: cleanEmail,
    phone: v.phone,
    passwordHash: await argon2.hash(v.password),
    role: 'seller',
    verified: true,
    active: true
  });

  const ref = v.referralCode ? await SellerProfile.findOne({ referralCode: String(v.referralCode).trim().toUpperCase() }) : null;
  const sellerProfile = await SellerProfile.create({
    userId: u._id,
    shopName: cleanShopName,
    address: v.address || 'Dhaka, Bangladesh',
    phone: v.phone,
    status: 'active',
    sellerCode: 'RSL-' + Math.floor(100000 + Math.random() * 900000),
    referralCode: 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    referredBy: ref?._id
  });

  // Create session and set cookie immediately so registration signs in user seamlessly
  const s = await Session.create({
    userId: u._id,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    ip: req.ip,
    lastSeenAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 864e5)
  });

  res.cookie('token', jwt.sign({ sub: u.id, sid: s.id }, config.jwt, { expiresIn: '7d' }), {
    httpOnly: true,
    secure: config.prod,
    sameSite: 'lax',
    maxAge: 7 * 864e5
  });

  res.status(201).json({
    success: true,
    data: {
      id: u._id,
      name: u.name,
      role: u.role,
      phone: u.phone,
      email: u.email,
      shopName: sellerProfile.shopName
    }
  });
});

// Robust Login supporting Phone Number OR Email
auth.post('/login', async (req, res) => {
  const { identifier, email, phone, password, totp } = req.body;
  const inputId = String(identifier || phone || email || '').trim();
  const inputPw = String(password || '');

  if (!inputId || !inputPw) {
    return bad(res, 400, 'Please enter your phone number or email and password');
  }

  const isEmail = inputId.includes('@');
  const u = isEmail
    ? await User.findOne({ email: inputId.toLowerCase() })
    : await User.findOne({ $or: [{ phone: inputId }, { email: inputId.toLowerCase() }] });

  if (!u) return bad(res, 401, 'No account found with this phone number or email');
  if (!u.active) return bad(res, 403, 'Your account has been temporarily disabled. Please contact support at 01410449778');
  if (u.lockUntil && u.lockUntil > new Date()) {
    return bad(res, 423, 'Account locked due to too many failed attempts. Try again in 15 minutes.');
  }

  if (!await argon2.verify(u.passwordHash, inputPw)) {
    u.failedLogins++;
    if (u.failedLogins >= 5) {
      u.lockUntil = new Date(Date.now() + 15 * 60e3);
      u.failedLogins = 0;
    }
    await u.save();
    return bad(res, 401, 'Incorrect password');
  }

  // 2FA check if enabled
  if (u.totpEnabled) {
    if (!totp) return res.json({ success: true, data: { twoFactorRequired: true } });
    if (!await checkSecondFactor(u, totp)) {
      return bad(res, 401, 'Invalid two-factor authentication code');
    }
  }

  if (u.failedLogins) {
    u.failedLogins = 0;
    await u.save();
  }

  const s = await Session.create({
    userId: u._id,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    ip: req.ip,
    lastSeenAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 864e5)
  });

  res.cookie('token', jwt.sign({ sub: u.id, sid: s.id }, config.jwt, { expiresIn: '7d' }), {
    httpOnly: true,
    secure: config.prod,
    sameSite: 'lax',
    maxAge: 7 * 864e5
  });

  res.json({
    success: true,
    data: {
      role: u.role,
      name: u.name,
      phone: u.phone,
      email: u.email
    }
  });
});

auth.post('/logout', async (req: Request, res) => {
  try {
    const p: any = jwt.verify(req.cookies?.token || '', config.jwt);
    if (p?.sid) await Session.updateOne({ _id: p.sid, userId: p.sub }, { revokedAt: new Date() });
  } catch {}
  res.clearCookie('token');
  res.json({ success: true });
});

auth.get('/me', requireAuth, async (req: AuthReq, res) => {
  const u = await User.findById(req.auth!.userId).select('name email phone role verified totpEnabled').lean();
  let shopName = '';
  if (['seller', 'reseller'].includes(req.auth!.role)) {
    const sp = await SellerProfile.findOne({ userId: req.auth!.userId }).select('shopName status sellerCode').lean();
    shopName = sp?.shopName || '';
  }
  res.json({
    success: true,
    data: {
      ...req.auth,
      name: u?.name,
      email: u?.email,
      phone: u?.phone,
      shopName,
      verified: !!u?.verified,
      twoFactor: !!u?.totpEnabled
    }
  });
});

// ---- 2FA helpers ----
const rc = () => `${crypto.randomBytes(3).toString('hex')}-${crypto.randomBytes(3).toString('hex')}`;
async function checkSecondFactor(u: any, token: string) {
  const t = token.replace(/\s/g, '');
  if (/^\d{6}$/.test(t)) {
    const secret = decrypt(u.totpSecretEnc);
    if (!authenticator.check(t, secret)) return false;
    const step = Math.floor(Date.now() / 30000);
    return (await User.updateOne({ _id: u._id, $or: [{ totpLastStep: { $lt: step } }, { totpLastStep: { $exists: false } }] }, { totpLastStep: step })).modifiedCount === 1;
  }
  return (await User.updateOne({ _id: u._id, recoveryCodes: hmac('rc:' + t.toLowerCase()) }, { $pull: { recoveryCodes: hmac('rc:' + t.toLowerCase()) } })).modifiedCount === 1;
}

const revokeAll = (userId: any, exceptSid?: string) =>
  Session.updateMany({ userId, revokedAt: { $exists: false }, ...(exceptSid ? { _id: { $ne: exceptSid } } : {}) }, { revokedAt: new Date() });

auth.post('/change-password', requireAuth, async (req: AuthReq, res) => {
  const { current, password } = z.object({ current: z.string(), password: z.string().min(6) }).parse(req.body);
  const u = await User.findById(req.auth!.userId);
  if (!u || !await argon2.verify(u.passwordHash, current)) return bad(res, 400, 'Current password is incorrect');
  u.passwordHash = await argon2.hash(password);
  await u.save();
  await revokeAll(u._id, req.auth!.sid);
  res.json({ success: true });
});

auth.get('/sessions', requireAuth, async (req: AuthReq, res) => {
  const rows = await Session.find({ userId: req.auth!.userId, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    data: rows.map(r => ({
      id: String(r._id),
      current: String(r._id) === req.auth!.sid,
      userAgent: r.userAgent,
      ip: r.ip,
      createdAt: (r as any).createdAt,
      lastSeenAt: r.lastSeenAt
    }))
  });
});

auth.post('/sessions/revoke-others', requireAuth, async (req: AuthReq, res) => {
  await revokeAll(req.auth!.userId, req.auth!.sid);
  res.json({ success: true });
});

auth.delete('/sessions/:id', requireAuth, async (req: AuthReq, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) return bad(res, 404, 'Not found');
  const r = await Session.updateOne({ _id: req.params.id, userId: req.auth!.userId, revokedAt: { $exists: false } }, { revokedAt: new Date() });
  r.modifiedCount ? res.json({ success: true }) : bad(res, 404, 'Not found');
});

auth.post('/2fa/setup', requireAuth, async (req: AuthReq, res) => {
  const u = await User.findById(req.auth!.userId);
  if (!u) return bad(res);
  if (u.totpEnabled) return bad(res, 409, 'Two-factor is already enabled');
  const secret = authenticator.generateSecret();
  u.pendingTotpEnc = encrypt(secret);
  await u.save();
  const otpauth = authenticator.keyuri(u.email, 'MeeshoMart Reseller', secret);
  res.json({ success: true, data: { secret, otpauth, qr: await QRCode.toDataURL(otpauth) } });
});

auth.post('/2fa/enable', requireAuth, async (req: AuthReq, res) => {
  const { code } = z.object({ code: z.string() }).parse(req.body);
  const u = await User.findById(req.auth!.userId);
  if (!u?.pendingTotpEnc || !authenticator.check(code.replace(/\s/g, ''), decrypt(u.pendingTotpEnc))) return bad(res, 400, 'Invalid code');
  const codes = Array.from({ length: 8 }, rc);
  u.totpSecretEnc = u.pendingTotpEnc;
  u.pendingTotpEnc = undefined;
  u.totpEnabled = true;
  u.totpLastStep = Math.floor(Date.now() / 30000);
  u.recoveryCodes = codes.map(c => hmac('rc:' + c)) as any;
  await u.save();
  res.json({ success: true, data: { recoveryCodes: codes } });
});

auth.post('/2fa/disable', requireAuth, async (req: AuthReq, res) => {
  const { password, code } = z.object({ password: z.string(), code: z.string() }).parse(req.body);
  const u = await User.findById(req.auth!.userId);
  if (!u?.totpEnabled) return bad(res, 409, 'Two-factor is not enabled');
  if (!await argon2.verify(u.passwordHash, password) || !await checkSecondFactor(u, code)) return bad(res, 400, 'Password or code is incorrect');
  await User.updateOne({ _id: u._id }, { totpEnabled: false, $unset: { totpSecretEnc: 1, pendingTotpEnc: 1, totpLastStep: 1 }, recoveryCodes: [] });
  res.json({ success: true });
});
