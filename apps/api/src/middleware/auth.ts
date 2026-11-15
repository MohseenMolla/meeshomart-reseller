import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, SellerProfile, Session } from '../models';

export interface AuthReq extends Request {
  auth?: { userId: string; role: string; sellerId?: string; sid: string };
}

export const requireAuth = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const t = req.cookies?.token;
    if (!t) return res.status(401).json({ success: false, error: 'Unauthenticated' });
    const p: any = jwt.verify(t, config.jwt);
    if (!p.sid) return res.status(401).json({ success: false, error: 'Unauthenticated' });
    const sess = await Session.findOne({ _id: p.sid, userId: p.sub, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).lean();
    if (!sess) return res.status(401).json({ success: false, error: 'Session expired' });
    if (!sess.lastSeenAt || Date.now() - sess.lastSeenAt.getTime() > 5 * 60e3) {
      Session.updateOne({ _id: sess._id }, { lastSeenAt: new Date() }).catch(() => {});
    }
    const u = await User.findById(p.sub).lean();
    if (!u || !u.active) return res.status(401).json({ success: false, error: 'Unauthenticated or account deactivated' });
    let sellerId: string | undefined;
    if (['seller', 'reseller'].includes(u.role)) {
      const s = await SellerProfile.findOne({ userId: u._id }).lean();
      sellerId = s?._id.toString();
    }
    req.auth = { userId: u._id.toString(), role: u.role, sellerId, sid: String(sess._id) };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthenticated' });
  }
};

export const requireRole = (...roles: string[]) => (req: AuthReq, res: Response, next: NextFunction) => {
  const currentRole = req.auth?.role;
  if (!currentRole) return res.status(401).json({ success: false, error: 'Unauthenticated' });
  // Map aliases: manager/staff, seller/reseller
  const normalized = currentRole === 'staff' ? 'manager' : currentRole === 'reseller' ? 'seller' : currentRole;
  const match = roles.some(r => {
    const nr = r === 'staff' ? 'manager' : r === 'reseller' ? 'seller' : r;
    return nr === normalized || r === currentRole;
  });
  return match ? next() : res.status(403).json({ success: false, error: 'Forbidden' });
};

export const requireActiveSeller = async (req: AuthReq, res: Response, next: NextFunction) => {
  if (!req.auth) return res.status(401).json({ success: false, error: 'Unauthenticated' });
  if (!req.auth.sellerId) {
    const s = await SellerProfile.findOne({ userId: req.auth.userId });
    if (s) req.auth.sellerId = s._id.toString();
    else return res.status(403).json({ success: false, error: 'Reseller profile not found' });
  }
  const s = await SellerProfile.findById(req.auth.sellerId).lean();
  if (!s || s.status === 'suspended') {
    return res.status(403).json({ success: false, error: 'Reseller account is suspended' });
  }
  next();
};
