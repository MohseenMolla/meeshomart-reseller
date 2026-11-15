import { Schema, model } from 'mongoose';
const T = { timestamps: true };

// User Model: supports super_admin (1-3 max), manager (up to 50 max), staff, seller (reseller unlimited), customer
export const User = model('User', new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true, required: true },
  phone: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'manager', 'staff', 'seller', 'reseller', 'customer'], default: 'seller' },
  active: { type: Boolean, default: true },
  failedLogins: { type: Number, default: 0 },
  lockUntil: Date,
  verified: { type: Boolean, default: true },
  totpEnabled: { type: Boolean, default: false },
  totpSecretEnc: String,
  pendingTotpEnc: String,
  totpLastStep: Number,
  recoveryCodes: [String]
}, T));

// SellerProfile (Reseller profile)
export const SellerProfile = model('SellerProfile', new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  shopName: { type: String, default: 'My Reseller Shop' },
  address: String,
  phone: String,
  sellerCode: { type: String, unique: true, sparse: true },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'SellerProfile' },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'expired'], default: 'active' },
  planId: Schema.Types.ObjectId,
  subscriptionEndsAt: Date,
  storeSlug: { type: String, unique: true, sparse: true }
}, T));

export const SubscriptionPlan = model('SubscriptionPlan', new Schema({
  name: String,
  priceBDT: Number,
  durationDays: Number,
  lifetime: { type: Boolean, default: false },
  limits: { maxProducts: Number, maxOrdersPerMonth: Number },
  active: { type: Boolean, default: true }
}, T));

export const Payment = model('Payment', new Schema({
  userId: { type: Schema.Types.ObjectId, index: true },
  planId: Schema.Types.ObjectId,
  tranId: { type: String, unique: true },
  amount: Number,
  currency: { type: String, default: 'BDT' },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled', 'needs_reconcile'], default: 'pending', index: true },
  gatewayValId: { type: String, unique: true, sparse: true },
  raw: Schema.Types.Mixed,
  activatedAt: Date
}, T));

export const Wallet = model('Wallet', new Schema({
  sellerId: { type: Schema.Types.ObjectId, unique: true }
}, T));

const lt = new Schema({
  sellerId: { type: Schema.Types.ObjectId, index: true },
  type: { type: String, enum: ['order_profit', 'referral_commission', 'withdrawal', 'refund_deduction', 'adjustment'] },
  amount: Number,
  status: { type: String, enum: ['pending', 'available'], default: 'pending' },
  ref: { type: String },
  note: String
}, { timestamps: { createdAt: true, updatedAt: false } });

lt.index({ sellerId: 1, type: 1, ref: 1 }, { unique: true });

// Immutable: edits/deletes are blocked. Only insert-only upserts ($setOnInsert) pass
for (const h of ['updateOne', 'updateMany', 'findOneAndUpdate'] as const) {
  lt.pre(h as any, function (this: any) {
    const u = this.getUpdate() || {};
    const insertOnly = this.getOptions().upsert === true && Object.keys(u).length > 0 && Object.keys(u).every(k => k === '$setOnInsert');
    if (!insertOnly) throw new Error('WalletTransaction is immutable');
  });
}
for (const h of ['deleteOne', 'deleteMany', 'findOneAndDelete'] as const) {
  lt.pre(h as any, function () { throw new Error('WalletTransaction is immutable'); });
}
export const WalletTransaction = model('WalletTransaction', lt);

// Product Model with categories and Cloudinary multi-images
export const Product = model('Product', new Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true, required: true },
  description: String,
  category: { type: String, default: 'General', index: true },
  images: [{ _id: false, url: String, publicId: String }],
  retailPrice: { type: Number, required: true },
  wholesalePrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }
}, T).index({ name: 'text', description: 'text', sku: 'text' }));

// Order Model: Reseller Dropship Order
export const Order = model('Order', new Schema({
  orderNo: { type: String, unique: true },
  sellerId: { type: Schema.Types.ObjectId, index: true, ref: 'SellerProfile' },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    qty: { type: Number, default: 1 },
    unitPrice: Number, // Selling price to customer
    wholesale: Number  // Platform wholesale price
  }],
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, default: 'Dhaka' }
  },
  deliveryCharge: { type: Number, default: 70 },
  customerPayable: { type: Number, default: 0 },
  courier: {
    name: { type: String, default: '' },
    trackingCode: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  notes: String,
  total: Number, // Subtotal of customer items
  profit: Number, // Reseller net profit
  status: { type: String, default: 'pending', index: true }, // pending, confirmed, packaging, shipped, delivered, cancelled, returned
  history: [{ status: String, at: Date, by: Schema.Types.ObjectId, note: String }],
  idemKey: { type: String, index: true, sparse: true },
  source: { type: String, default: 'reseller_panel' }
}, T).index({ sellerId: 1, createdAt: -1 }));

export const AuditLog = model('AuditLog', new Schema({
  actor: Schema.Types.ObjectId,
  action: String,
  target: String,
  meta: Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } }));

// Reseller Profit Withdrawal
export const Withdrawal = model('Withdrawal', new Schema({
  sellerId: { type: Schema.Types.ObjectId, index: true, ref: 'SellerProfile' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bkash', 'nagad', 'rocket', 'bank'], required: true },
  account: { type: String, required: true },
  accountType: { type: String, default: 'personal' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reference: String,
  reviewedBy: Schema.Types.ObjectId,
  note: String
}, { timestamps: true }));

export const Store = model('Store', new Schema({
  sellerId: { type: Schema.Types.ObjectId, unique: true },
  slug: { type: String, unique: true, lowercase: true },
  name: String,
  description: String,
  logo: String,
  banner: String,
  phone: String,
  social: { facebook: String, instagram: String, whatsapp: String },
  seo: { title: String, description: String },
  active: { type: Boolean, default: true }
}, { timestamps: true }));

export const StoreProduct = model('StoreProduct', new Schema({
  sellerId: { type: Schema.Types.ObjectId, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  price: Number,
  visible: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true }).index({ sellerId: 1, productId: 1 }, { unique: true }));

export const Notification = model('Notification', new Schema({
  sellerId: { type: Schema.Types.ObjectId, index: true },
  type: String,
  title: String,
  body: String,
  readAt: Date,
  key: String
}, { timestamps: true }).index({ sellerId: 1, key: 1 }, { unique: true, sparse: true }).index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }));

export const OtpCode = model('OtpCode', new Schema({
  userId: { type: Schema.Types.ObjectId, index: true },
  purpose: { type: String, enum: ['verify_email', 'reset_password'] },
  codeHash: String,
  attempts: { type: Number, default: 0 },
  expiresAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } }).index({ expiresAt: 1 }, { expireAfterSeconds: 0 }));

export const Session = model('Session', new Schema({
  userId: { type: Schema.Types.ObjectId, index: true },
  userAgent: String,
  ip: String,
  lastSeenAt: Date,
  revokedAt: Date,
  expiresAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } }).index({ expiresAt: 1 }, { expireAfterSeconds: 0 }));

export const Banner = model('Banner', new Schema({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  badge: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String, default: '/' },
  buttonText: { type: String, default: 'Shop Now' },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true }));

// Category Model with image uploads for homepage & catalog
export const Category = model('Category', new Schema({
  name: { type: String, required: true, unique: true },
  label: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true }));
