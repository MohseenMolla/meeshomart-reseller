# MeeshoMart Reseller - Production Dropshipping Platform 🇧🇩

A full production-grade Dropshipping and Reselling Platform inspired by **dropshipping.com.bd** and **iuddokta.com**, tailored for the Bangladesh market.

---

## 🌟 Key Features & Updates

### 1. English UI & Hotline Integration
- **Full English Interface**: All Bangla strings have been translated into professional, clear e-commerce English.
- **Dedicated Hotline & WhatsApp**: **`01410449778`** with click-to-call and 1-click WhatsApp inquiry across the header, product page, and footer.
- **3-Tier Delivery Structure**:
  - **Inside Dhaka**: 1-2 days • **60 TK**
  - **Dhaka Sub Area**: 1-2 days • **100 TK**
  - **Outside Dhaka**: 2-4 days • **120 TK**

### 2. Homepage & Category-Wise Product Grids
- Categorized product shelves matching `dropshipping.com.bd`:
  - **Winter Collection**
  - **Men's Fashion**
  - **Women's Fashion**
  - **Home & Lifestyle**
  - **Gadgets & Electronics**
  - **Kids Zone**, **Foods**, and **Others**
- **Wholesale Price Gating**: Wholesale price and profit margin are strictly hidden from guest visitors and unlocked immediately upon logging in as a Reseller or Manager/Admin.

### 3. Product Details Page (`/product/[id]`)
- Interactive multi-image gallery with thumbnail switcher.
- Suggested retail price (MRP), dropshipper wholesale price, and live calculated reseller profit.
- Sizing selector (M, L, XL, XXL) and quantity stepper.
- Instant dropship order placement modal with real-time profit and COD calculation.
- Related products grid for cross-selling.

### 4. Frictionless Phone & Email Authentication
- **Phone or Email Login**: Full support for Bangladeshi 11-digit phone numbers (e.g., `01731517072`, `01410449778`) or email addresses.
- Auto-provisioning for phone-only registrations with secure session cookie.

### 5. Multi-Tier Role Hierarchy
- **👑 Super Admin (1-3 users)**:
  - System oversight & platform-wide analytics (sales, orders, reseller profits).
  - **Manager Management**: Add up to **50 managers** max quota, activate/deactivate, or delete managers.
  - **Profit & Withdrawal Approvals**: Review payout requests (bKash / Nagad / Rocket / Bank Transfer), approve with TrxID or reject with automatic wallet refund.
  - Reseller directory & suspension controls.
- **👔 Manager (Up to 50 users)**:
  - Product catalog management with multiple image uploads (Cloudinary and web URLs).
  - Order fulfillment, status advancement (`pending` -> `confirmed` -> `packaging` -> `shipped` -> `delivered` -> `cancelled`), and courier tracking assignment (Steadfast, Pathao, RedX, Paperfly).
  - Reseller profit list and customer COD tracking.
- **🛍️ Reseller (Unlimited)**:
  - Reseller Admin Panel (`/seller`).
  - Wholesale Catalog (`/seller/catalog`) with profit calculator.
  - Direct Dropship Order placement with customer delivery information.
  - Profit Wallet & Withdrawals (`/seller/wallet`) to bKash, Nagad, Rocket, or Bank Account.

---


---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript (Strict), Tailwind CSS, Lucide Icons.
- **Backend**: Express.js, TypeScript, Mongoose (MongoDB Atlas Replica Set with ACID Transactions).
- **Authentication**: Argon2 Password Hashing, HTTP-only JWT Sessions, TOTP 2FA.
- **Media Storage**: Cloudinary multi-image upload & web URLs.
- **Security**: CSRF Origin Guard, NoSQL Injection Guard, Rate Limiting, Helmet.

---

## 🏃 Getting Started

### 1. Run Development Servers
- **Backend API (Port 4000)**:
  ```bash
  npm run dev:api
  ```
- **Frontend Web (Port 3000)**:
  ```bash
  npm run dev:web
  ```
- Open [http://localhost:3000](http://localhost:3000) in your browser.
