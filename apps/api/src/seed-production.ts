import mongoose from 'mongoose';
import argon2 from 'argon2';
import { config } from './config';
import { User, SellerProfile, Product, SubscriptionPlan, Banner, Category } from './models';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(config.mongo);
  console.log('Connected to MongoDB!');

  // 1. Seed Super Admin
  const adminEmail = 'admin@meeshomart.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      phone: '01410449778',
      passwordHash: await argon2.hash('admin123456'),
      role: 'super_admin',
      verified: true,
      active: true
    });
    console.log('Created Super Admin: admin@meeshomart.com (or 01410449778) / admin123456');
  } else {
    admin.phone = '01410449778';
    await admin.save();
    console.log('Super Admin updated with phone 01410449778');
  }

  // 2. Seed Manager
  const managerEmail = 'manager@meeshomart.com';
  let manager = await User.findOne({ email: managerEmail });
  if (!manager) {
    manager = await User.create({
      name: 'Head Operations Manager',
      email: managerEmail,
      phone: '01711000002',
      passwordHash: await argon2.hash('manager123456'),
      role: 'manager',
      verified: true,
      active: true
    });
    console.log('Created Manager: manager@meeshomart.com / manager123456');
  }

  // 3. Seed Reseller (Md Mohseen Molla: 01731517072)
  const resellerEmail = 'reseller@meeshomart.com';
  let resellerUser = await User.findOne({ $or: [{ phone: '01731517072' }, { email: resellerEmail }] });
  if (!resellerUser) {
    resellerUser = await User.create({
      name: 'Md Mohseen Molla',
      email: resellerEmail,
      phone: '01731517072',
      passwordHash: await argon2.hash('reseller123456'),
      role: 'seller',
      verified: true,
      active: true,
      failedLogins: 0
    });
    await SellerProfile.create({
      userId: resellerUser._id,
      shopName: 'Molla Fashion & Gadgets',
      phone: '01731517072',
      address: 'Dhanmondi, Dhaka',
      status: 'active',
      sellerCode: 'RSL-13051',
      referralCode: 'REF-MOLLA'
    });
    console.log('Created Reseller: 01731517072 / reseller123456');
  } else {
    resellerUser.passwordHash = await argon2.hash('reseller123456');
    resellerUser.active = true;
    resellerUser.failedLogins = 0;
    resellerUser.lockUntil = undefined;
    await resellerUser.save();
    console.log('Updated Reseller password and reset locks: 01731517072 / reseller123456');
  }

  // 4. Seed Subscription Plans
  const plansCount = await SubscriptionPlan.countDocuments();
  if (plansCount === 0) {
    await SubscriptionPlan.create([
      { name: 'Free Reseller Account', priceBDT: 0, durationDays: 365, lifetime: true, limits: { maxProducts: 100, maxOrdersPerMonth: 1000 }, active: true },
      { name: 'Pro Reseller VIP', priceBDT: 499, durationDays: 30, lifetime: false, limits: { maxProducts: 1000, maxOrdersPerMonth: 10000 }, active: true }
    ]);
  }

  // 5. Seed Real Online Dropshipping Products with Multiple Images
  const sampleProducts = [
    // Men's Fashion (Matching user screenshot)
    {
      name: 'Premium Casual Combo Set (Formal Shirt & Chino Pants)',
      sku: '13051',
      category: "Men's Fashion",
      description: 'Exclusive Premium Casual Combo Set for gentlemen. Includes one 100% fine cotton sky-blue slim fit shirt and charcoal grey tailored formal trousers. Breathable fabric, anti-wrinkle finishing, and perfect for office, party, or casual gatherings.',
      retailPrice: 1250,
      wholesalePrice: 890,
      stock: 120,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80', publicId: 'men-shirt-combo-1' },
        { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80', publicId: 'men-shirt-combo-2' },
        { url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80', publicId: 'men-shirt-combo-3' }
      ]
    },
    {
      name: 'Men Slim Fit Oxford Cotton Long Sleeve Shirt',
      sku: '13052',
      category: "Men's Fashion",
      description: 'Classic Oxford cotton casual shirt for men. Soft wash finish, tailored fit, double stitched cuffs and collar.',
      retailPrice: 950,
      wholesalePrice: 620,
      stock: 85,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', publicId: 'oxford-shirt-1' },
        { url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80', publicId: 'oxford-shirt-2' }
      ]
    },
    {
      name: 'Premium Vintage Denim Jacket for Men',
      sku: '13053',
      category: 'Winter Collection',
      description: 'Heavyweight washed denim jacket with metallic brass buttons and dual chest flap pockets. Perfect stylish layer for winter.',
      retailPrice: 1850,
      wholesalePrice: 1250,
      stock: 60,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80', publicId: 'denim-jacket-1' },
        { url: 'https://images.unsplash.com/photo-1529720317453-c8da503f2051?auto=format&fit=crop&w=800&q=80', publicId: 'denim-jacket-2' }
      ]
    },

    // Gadgets & Electronics
    {
      name: 'Ultra T800 Smart Watch With Bluetooth Calling & HD Display',
      sku: '14010',
      category: 'Gadgets & Electronics',
      description: 'Original T800 Ultra Smart Watch with 1.99 inch HD bezel-less screen. Supports Bluetooth phone calls, heart rate, blood oxygen monitor, sports tracking, and magnetic fast charging.',
      retailPrice: 1250,
      wholesalePrice: 650,
      stock: 200,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', publicId: 't800-watch-1' },
        { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80', publicId: 't800-watch-2' }
      ]
    },
    {
      name: 'M10 TWS Wireless Earbuds with Digital LED Display & Power Bank',
      sku: '14011',
      category: 'Gadgets & Electronics',
      description: 'Top trending M10 Bluetooth 5.3 Earbuds. Crystal clear stereo bass, 2000mAh power bank charging case, IPX7 waterproof, and touch controls.',
      retailPrice: 550,
      wholesalePrice: 280,
      stock: 350,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', publicId: 'm10-earbuds-1' },
        { url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80', publicId: 'm10-earbuds-2' }
      ]
    },
    {
      name: 'K9 Dual Wireless Lavalier Microphone for Type-C & iPhone',
      sku: '14012',
      category: 'Gadgets & Electronics',
      description: 'Professional wireless clip-on mic for YouTubers, Vloggers, and TikTokers. Plug & play, active noise cancellation, and 20 meters wireless transmission.',
      retailPrice: 950,
      wholesalePrice: 480,
      stock: 110,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80', publicId: 'k9-mic-1' }
      ]
    },
    {
      name: 'RGB Pulse Portable Wireless Bluetooth Speaker with Bass Booster',
      sku: '14013',
      category: 'Gadgets & Electronics',
      description: 'Super deep bass portable Bluetooth speaker with dynamic 360-degree RGB lighting effects. 8-hour playtime and FM radio mode.',
      retailPrice: 890,
      wholesalePrice: 450,
      stock: 140,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', publicId: 'rgb-speaker-1' }
      ]
    },

    // Home & Lifestyle
    {
      name: '10-inch Professional LED Ring Light with 7ft Metal Tripod Stand',
      sku: '15020',
      category: 'Home & Lifestyle',
      description: 'Studio grade 10 inch LED ring light with phone holder and 2.1 meter heavy duty extendable metal tripod stand. 3 color lighting modes with dimmer controller.',
      retailPrice: 850,
      wholesalePrice: 420,
      stock: 90,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80', publicId: 'ring-light-1' }
      ]
    },
    {
      name: 'Portable USB Rechargeable Mini Fruit Juicer & Smoothie Blender 380ml',
      sku: '15021',
      category: 'Home & Lifestyle',
      description: 'Compact 6-blade stainless steel portable blender. Rechargeable via USB power bank or laptop. Perfect for smoothies, baby food, and gym shakes.',
      retailPrice: 650,
      wholesalePrice: 340,
      stock: 220,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80', publicId: 'mini-blender-1' }
      ]
    },

    // Beauty & Personal Care
    {
      name: 'Vintage T9 Professional Metal Hair & Beard Trimmer',
      sku: '16030',
      category: 'Beauty & Personal Care',
      description: 'Original Vintage T9 Zero Gapped Cordless Hair Trimmer. Heavy duty carved metallic golden body, stainless steel T-blade, and rechargeable battery.',
      retailPrice: 750,
      wholesalePrice: 370,
      stock: 130,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80', publicId: 't9-trimmer-1' },
        { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80', publicId: 't9-trimmer-2' }
      ]
    },

    // Women's Fashion & Bags
    {
      name: 'Anti-Theft Multi-Compartment Water Resistant Laptop Backpack',
      sku: '17040',
      category: "Women's Fashion",
      description: 'Ergonomic water-resistant Oxford fabric travel & college backpack. Features hidden anti-theft zipper, external USB charging port, and 15.6 inch padded laptop compartment.',
      retailPrice: 1450,
      wholesalePrice: 780,
      stock: 75,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', publicId: 'backpack-1' },
        { url: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=800&q=80', publicId: 'backpack-2' }
      ]
    }
  ];

  for (const item of sampleProducts) {
    await Product.updateOne({ sku: item.sku }, { $set: item }, { upsert: true });
  }
  console.log(`Seeded ${sampleProducts.length} high-quality online dropshipping products!`);

  // 6. Seed Promotional Banners (pure image banners matching dropshipping.com.bd)
  const sampleBanners = [
    {
      title: 'One-Click Order Processing, We Handle the Rest!',
      subtitle: 'No more inventory or packaging headaches. Focus on making sales while we deliver parcels straight to your customer doorstep nationwide.',
      badge: "Bangladesh's #1 Dropshipping Hub",
      imageUrl: '/banners/hero-banner-1.svg',
      linkUrl: '/seller/catalog',
      buttonText: 'Start Dropshipping Now',
      active: true,
      order: 1
    },
    {
      title: 'Trending Winter & Fashion Collection 2025',
      subtitle: 'Premium combo suits, jackets, luxury watches & trending electronics at verified wholesale factory rates.',
      badge: 'New Arrivals Ready to Ship',
      imageUrl: '/banners/hero-banner-2.svg',
      linkUrl: '/?category=Winter%20Collection',
      buttonText: 'Explore Winter Deals',
      active: true,
      order: 2
    }
  ];

  for (const b of sampleBanners) {
    await Banner.updateOne({ title: b.title }, { $set: b }, { upsert: true });
  }
  console.log(`Seeded ${sampleBanners.length} promotional hero banners!`);

  // 7. Seed Categories with Images (matching dropshipping.com.bd)
  const sampleCategories = [
    {
      name: 'Winter Collection',
      label: 'Winter',
      imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=300&q=80',
      order: 1,
      active: true
    },
    {
      name: "Men's Fashion",
      label: "Men's Fashion",
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&q=80',
      order: 2,
      active: true
    },
    {
      name: "Women's Fashion",
      label: "Women's Fashion",
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80',
      order: 3,
      active: true
    },
    {
      name: 'Home & Lifestyle',
      label: 'Home & Lifestyle',
      imageUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=300&q=80',
      order: 4,
      active: true
    },
    {
      name: 'Gadgets & Electronics',
      label: 'Gadgets & Electronics',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
      order: 5,
      active: true
    },
    {
      name: 'Beauty & Personal Care',
      label: 'Beauty',
      imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=300&q=80',
      order: 6,
      active: true
    },
    {
      name: 'Kids Zone',
      label: 'Kids Zone',
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80',
      order: 7,
      active: true
    },
    {
      name: 'Foods',
      label: 'Foods',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
      order: 8,
      active: true
    },
    {
      name: 'Others',
      label: 'Other’s',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
      order: 9,
      active: true
    }
  ];

  for (const c of sampleCategories) {
    await Category.updateOne({ name: c.name }, { $set: c }, { upsert: true });
  }
  console.log(`Seeded ${sampleCategories.length} categories with images!`);

  console.log('\n=======================================');
  console.log('MeeshoMart Reseller Test Credentials');
  console.log('Hotline / WhatsApp Support: 01410449778');
  console.log('Super Admin : admin@meeshomart.com / admin123456');
  console.log('Manager     : manager@meeshomart.com / manager123456');
  console.log('Reseller    : 01731517072 (or reseller@meeshomart.com) / reseller123456');
  console.log('=======================================\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
