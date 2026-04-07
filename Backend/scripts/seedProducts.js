import 'dotenv/config';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { Product } from '../src/models/product.model.js';
import { User } from '../src/models/user.model.js';
import { clearCommerceCache } from '../src/utils/cache.js';

const scriptPath = fileURLToPath(import.meta.url);

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseArgs = (argv = []) => {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const normalized = token.slice(2);
    const separatorIndex = normalized.indexOf('=');

    if (separatorIndex >= 0) {
      const key = normalized.slice(0, separatorIndex);
      const value = normalized.slice(separatorIndex + 1);
      parsed[key] = value || 'true';
      continue;
    }

    const nextToken = argv[index + 1];
    if (nextToken && !nextToken.startsWith('--')) {
      parsed[normalized] = nextToken;
      index += 1;
      continue;
    }

    parsed[normalized] = 'true';
  }

  return parsed;
};

const toPositiveInteger = (value, fallback) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return fallback;
  }

  return normalized;
};

const escapeSvgText = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createSvgDataUri = ({
  title,
  subtitle,
  accent = '#1d4ed8',
  secondary = '#0f172a',
}) => {
  const safeTitle = escapeSvgText(title);
  const safeSubtitle = escapeSvgText(subtitle);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" rx="56" fill="url(#bg)" />
      <circle cx="950" cy="230" r="190" fill="${accent}" fill-opacity="0.14" />
      <circle cx="250" cy="940" r="170" fill="${secondary}" fill-opacity="0.12" />
      <rect x="110" y="150" width="980" height="900" rx="48" fill="#ffffff" stroke="#cbd5e1" stroke-width="6" />
      <rect x="180" y="230" width="840" height="420" rx="36" fill="url(#accent)" />
      <text x="180" y="760" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="700" fill="#0f172a">${safeTitle}</text>
      <text x="180" y="835" font-family="Arial, Helvetica, sans-serif" font-size="38" fill="#475569">${safeSubtitle}</text>
      <text x="180" y="940" font-family="Arial, Helvetica, sans-serif" font-size="28" letter-spacing="8" fill="#64748b">MARKETPLACE SEED</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
};

const createImage = ({ slug, suffix, title, subtitle, accent, secondary }) => ({
  public_id: `seed/products/${slug}-${suffix}`,
  url: createSvgDataUri({ title, subtitle, accent, secondary }),
});

const palette = [
  { accent: '#2563eb', secondary: '#0f172a' },
  { accent: '#dc2626', secondary: '#111827' },
  { accent: '#059669', secondary: '#1f2937' },
  { accent: '#d97706', secondary: '#111827' },
  { accent: '#7c3aed', secondary: '#1e1b4b' },
  { accent: '#0f766e', secondary: '#134e4a' },
];

const productBlueprints = [
  {
    name: 'Orbit Pro 14 Laptop',
    category: 'Computers',
    subcategory: 'Laptops',
    brand: 'NexaTech',
    price: 899,
    description:
      'A slim everyday laptop with a vivid display, all-day battery life, and enough power for remote work, streaming, and multitasking.',
    tags: ['laptop', 'portable', 'productivity'],
    variants: [
      { color: 'silver', size: '256GB', stock: 8, priceDelta: 0, attributes: { memory: '8GB RAM' } },
      { color: 'graphite', size: '512GB', stock: 6, priceDelta: 120, attributes: { memory: '16GB RAM' } },
    ],
  },
  {
    name: 'Orbit Studio 16 Laptop',
    category: 'Computers',
    subcategory: 'Workstations',
    brand: 'NexaTech',
    price: 1399,
    description:
      'A creator-focused laptop tuned for editing, design workflows, and heavier browser-based workloads without sacrificing portability.',
    tags: ['workstation', 'creator', 'performance'],
    variants: [
      { color: 'midnight', size: '512GB', stock: 5, priceDelta: 0, attributes: { memory: '16GB RAM' } },
      { color: 'midnight', size: '1TB', stock: 4, priceDelta: 180, attributes: { memory: '32GB RAM' } },
    ],
  },
  {
    name: 'Pulse X5 Smartphone',
    category: 'Mobiles',
    subcategory: 'Smartphones',
    brand: 'Pulse',
    price: 649,
    description:
      'A fast 5G smartphone with a bright AMOLED display, smooth camera system, and battery life designed for busy days.',
    tags: ['smartphone', '5g', 'mobile'],
    variants: [
      { color: 'obsidian', size: '128GB', stock: 10, priceDelta: 0, attributes: { memory: '8GB RAM' } },
      { color: 'glacier', size: '256GB', stock: 8, priceDelta: 90, attributes: { memory: '12GB RAM' } },
    ],
  },
  {
    name: 'Pulse Mini Smartphone',
    category: 'Mobiles',
    subcategory: 'Smartphones',
    brand: 'Pulse',
    price: 489,
    description:
      'A compact smartphone that stays comfortable in hand while still delivering sharp photos, reliable battery life, and quick charging.',
    tags: ['compact-phone', 'mobile', 'daily-use'],
    variants: [
      { color: 'lavender', size: '128GB', stock: 7, priceDelta: 0, attributes: { memory: '8GB RAM' } },
      { color: 'charcoal', size: '256GB', stock: 7, priceDelta: 70, attributes: { memory: '8GB RAM' } },
    ],
  },
  {
    name: 'Echo Buds Wireless Earbuds',
    category: 'Accessories',
    subcategory: 'Audio',
    brand: 'Echo',
    price: 89,
    description:
      'Pocket-friendly wireless earbuds with punchy sound, dual-mic calling, and a charging case built for commuting.',
    tags: ['earbuds', 'audio', 'wireless'],
    variants: [
      { color: 'white', size: 'STANDARD', stock: 18, priceDelta: 0, attributes: { battery: '24 hours' } },
      { color: 'navy', size: 'STANDARD', stock: 14, priceDelta: 0, attributes: { battery: '24 hours' } },
    ],
  },
  {
    name: 'Vertex Noise-Canceling Headphones',
    category: 'Accessories',
    subcategory: 'Audio',
    brand: 'Vertex',
    price: 229,
    description:
      'Over-ear headphones with active noise cancelation, plush cushions, and a warm sound profile for long listening sessions.',
    tags: ['headphones', 'audio', 'travel'],
    variants: [
      { color: 'black', size: 'STANDARD', stock: 9, priceDelta: 0, attributes: { battery: '38 hours' } },
      { color: 'sand', size: 'STANDARD', stock: 6, priceDelta: 20, attributes: { battery: '38 hours' } },
    ],
  },
  {
    name: 'Terra Trek Backpack',
    category: 'Accessories',
    subcategory: 'Bags',
    brand: 'Terra',
    price: 74,
    description:
      'A clean, weather-resistant backpack with padded laptop storage and smart internal pockets for travel and campus use.',
    tags: ['backpack', 'travel', 'bag'],
    variants: [
      { color: 'olive', size: '20L', stock: 11, priceDelta: 0, attributes: { material: 'recycled nylon' } },
      { color: 'black', size: '24L', stock: 8, priceDelta: 14, attributes: { material: 'recycled nylon' } },
    ],
  },
  {
    name: 'Loom Essential Hoodie',
    category: 'Clothes',
    subcategory: 'Hoodies',
    brand: 'Loom',
    price: 54,
    description:
      'A heavyweight pullover hoodie with brushed fleece inside, dropped shoulders, and a relaxed everyday fit.',
    tags: ['hoodie', 'apparel', 'casual'],
    variants: [
      { color: 'ash', size: 'M', stock: 12, priceDelta: 0, attributes: { material: 'cotton blend' } },
      { color: 'ash', size: 'L', stock: 10, priceDelta: 0, attributes: { material: 'cotton blend' } },
      { color: 'forest', size: 'XL', stock: 8, priceDelta: 4, attributes: { material: 'cotton blend' } },
    ],
  },
  {
    name: 'Loom Relaxed Tee',
    category: 'Clothes',
    subcategory: 'T-Shirts',
    brand: 'Loom',
    price: 28,
    description:
      'A soft relaxed-fit tee cut from breathable cotton jersey for hot afternoons and easy layering.',
    tags: ['t-shirt', 'apparel', 'cotton'],
    variants: [
      { color: 'white', size: 'M', stock: 16, priceDelta: 0, attributes: { material: '100% cotton' } },
      { color: 'black', size: 'L', stock: 12, priceDelta: 0, attributes: { material: '100% cotton' } },
      { color: 'stone', size: 'XL', stock: 9, priceDelta: 2, attributes: { material: '100% cotton' } },
    ],
  },
  {
    name: 'Stride Runner 2',
    category: 'Shoes',
    subcategory: 'Sneakers',
    brand: 'Stride',
    price: 119,
    description:
      'A lightweight road sneaker with a cushioned midsole, breathable mesh upper, and reliable all-day comfort.',
    tags: ['sneakers', 'running', 'footwear'],
    variants: [
      { color: 'white', size: '42', stock: 8, priceDelta: 0, attributes: { upper: 'engineered mesh' } },
      { color: 'blue', size: '43', stock: 7, priceDelta: 0, attributes: { upper: 'engineered mesh' } },
      { color: 'black', size: '44', stock: 6, priceDelta: 6, attributes: { upper: 'engineered mesh' } },
    ],
  },
  {
    name: 'Stride Court Classic',
    category: 'Shoes',
    subcategory: 'Casual',
    brand: 'Stride',
    price: 96,
    description:
      'A minimal low-top sneaker with a clean profile, soft lining, and a versatile everyday look.',
    tags: ['casual-shoes', 'court', 'footwear'],
    variants: [
      { color: 'white', size: '41', stock: 7, priceDelta: 0, attributes: { upper: 'vegan leather' } },
      { color: 'tan', size: '42', stock: 7, priceDelta: 4, attributes: { upper: 'vegan leather' } },
      { color: 'black', size: '43', stock: 5, priceDelta: 4, attributes: { upper: 'vegan leather' } },
    ],
  },
  {
    name: 'Vision 55 4K Smart TV',
    category: 'TVs',
    subcategory: 'Smart TVs',
    brand: 'Vision',
    price: 579,
    description:
      'A 55-inch 4K smart TV with streaming apps, rich contrast, and a slim modern frame for living rooms and lounges.',
    tags: ['tv', '4k', 'entertainment'],
    variants: [
      { color: 'black', size: '55IN', stock: 6, priceDelta: 0, attributes: { panel: 'LED' } },
      { color: 'black', size: '65IN', stock: 4, priceDelta: 180, attributes: { panel: 'LED' } },
    ],
  },
  {
    name: 'Vision 65 QLED TV',
    category: 'TVs',
    subcategory: 'Smart TVs',
    brand: 'Vision',
    price: 899,
    description:
      'A brighter QLED smart TV tuned for movie nights, sports, and console gaming with crisp motion handling.',
    tags: ['tv', 'qled', 'gaming'],
    variants: [
      { color: 'black', size: '65IN', stock: 5, priceDelta: 0, attributes: { panel: 'QLED' } },
      { color: 'black', size: '75IN', stock: 3, priceDelta: 320, attributes: { panel: 'QLED' } },
    ],
  },
  {
    name: 'Capture Pro Mirrorless Camera',
    category: 'Cameras',
    subcategory: 'Mirrorless',
    brand: 'Capture',
    price: 1249,
    description:
      'A fast mirrorless camera with sharp autofocus, strong low-light performance, and dependable video capture.',
    tags: ['camera', 'mirrorless', 'creator'],
    variants: [
      { color: 'black', size: 'BODY', stock: 4, priceDelta: 0, attributes: { sensor: 'APS-C' } },
      { color: 'black', size: 'KIT', stock: 4, priceDelta: 210, attributes: { sensor: 'APS-C' } },
    ],
  },
  {
    name: 'Capture Pocket Creator Cam',
    category: 'Cameras',
    subcategory: 'Compact',
    brand: 'Capture',
    price: 699,
    description:
      'A compact creator camera with a flip screen, clean audio support, and one-handed usability for quick shoots.',
    tags: ['camera', 'compact', 'vlogging'],
    variants: [
      { color: 'black', size: 'STANDARD', stock: 6, priceDelta: 0, attributes: { stabilisation: 'digital' } },
      { color: 'silver', size: 'STANDARD', stock: 5, priceDelta: 20, attributes: { stabilisation: 'digital' } },
    ],
  },
  {
    name: 'Atlas Wireless Mouse',
    category: 'Accessories',
    subcategory: 'Computer Peripherals',
    brand: 'Atlas',
    price: 39,
    description:
      'A quiet wireless mouse with ergonomic contours, dependable tracking, and multi-device switching.',
    tags: ['mouse', 'peripheral', 'workspace'],
    variants: [
      { color: 'black', size: 'STANDARD', stock: 20, priceDelta: 0, attributes: { connectivity: 'bluetooth' } },
      { color: 'pearl', size: 'STANDARD', stock: 15, priceDelta: 0, attributes: { connectivity: 'bluetooth' } },
    ],
  },
  {
    name: 'Atlas Mechanical Keyboard',
    category: 'Accessories',
    subcategory: 'Computer Peripherals',
    brand: 'Atlas',
    price: 109,
    description:
      'A tactile mechanical keyboard with hot-swap switches, compact spacing, and a sturdy aluminum top plate.',
    tags: ['keyboard', 'mechanical', 'workspace'],
    variants: [
      { color: 'black', size: '75%', stock: 9, priceDelta: 0, attributes: { switch: 'tactile' } },
      { color: 'white', size: '75%', stock: 8, priceDelta: 10, attributes: { switch: 'linear' } },
    ],
  },
  {
    name: 'Halo Fit Smartwatch',
    category: 'Accessories',
    subcategory: 'Wearables',
    brand: 'Halo',
    price: 149,
    description:
      'A fitness-focused smartwatch with heart-rate tracking, workout modes, and weeklong battery life.',
    tags: ['smartwatch', 'wearable', 'fitness'],
    variants: [
      { color: 'black', size: '41MM', stock: 10, priceDelta: 0, attributes: { battery: '7 days' } },
      { color: 'rose', size: '45MM', stock: 8, priceDelta: 20, attributes: { battery: '7 days' } },
    ],
  },
  {
    name: 'HomeHub Streaming Box',
    category: 'TVs',
    subcategory: 'Streaming Devices',
    brand: 'HomeHub',
    price: 79,
    description:
      'A compact streaming box with voice remote support, 4K playback, and smooth app switching for modern TVs.',
    tags: ['streaming', 'tv-box', 'entertainment'],
    variants: [
      { color: 'black', size: 'STANDARD', stock: 13, priceDelta: 0, attributes: { storage: '32GB' } },
      { color: 'black', size: 'PLUS', stock: 9, priceDelta: 18, attributes: { storage: '64GB' } },
    ],
  },
  {
    name: 'Aero Charge 65W Charger',
    category: 'Accessories',
    subcategory: 'Chargers',
    brand: 'Aero',
    price: 35,
    description:
      'A compact fast charger with dual USB-C ports for phones, tablets, and lightweight laptops on the go.',
    tags: ['charger', 'usb-c', 'travel'],
    variants: [
      { color: 'white', size: '65W', stock: 22, priceDelta: 0, attributes: { ports: '2x USB-C' } },
      { color: 'black', size: '100W', stock: 12, priceDelta: 18, attributes: { ports: '2x USB-C' } },
    ],
  },
];

export const buildSeedProducts = ({ ownerId, count = 20, now = new Date() } = {}) => {
  const normalizedCount = Math.min(
    toPositiveInteger(count, 20),
    productBlueprints.length
  );

  return productBlueprints.slice(0, normalizedCount).map((product, index) => {
    const slug = `seed-${slugify(product.name)}`;
    const colors = palette[index % palette.length];
    const createdAt = new Date(now.getTime() - (normalizedCount - index) * 6 * 60 * 60 * 1000);

    return {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      brand: product.brand,
      subcategory: product.subcategory,
      slug,
      tags: [...new Set([...product.tags, 'seeded', 'production-catalog'])],
      image: [
        createImage({
          slug,
          suffix: 'cover',
          title: product.name,
          subtitle: `${product.brand} • ${product.category}`,
          accent: colors.accent,
          secondary: colors.secondary,
        }),
        createImage({
          slug,
          suffix: 'detail',
          title: product.subcategory,
          subtitle: `${product.price} USD`,
          accent: colors.secondary,
          secondary: colors.accent,
        }),
      ],
      variants: product.variants.map((variant, variantIndex) => ({
        color: variant.color,
        size: variant.size,
        stock: variant.stock,
        priceDelta: variant.priceDelta,
        sku: `${slug.toUpperCase()}-${variant.color.toUpperCase()}-${variant.size.toUpperCase()}`.replace(
          /[^A-Z0-9-]/g,
          ''
        ),
        attributes: variant.attributes,
        image: createImage({
          slug,
          suffix: `variant-${variantIndex + 1}`,
          title: product.name,
          subtitle: `${variant.color} • ${variant.size}`,
          accent: colors.accent,
          secondary: colors.secondary,
        }),
      })),
      viewCount: 48 + index * 19,
      user: ownerId,
      createdAt,
    };
  });
};

const resolveOwner = async ({ ownerId, ownerEmail }) => {
  if (!ownerId && !ownerEmail) {
    throw new Error(
      'Provide SEED_PRODUCT_OWNER_EMAIL or SEED_PRODUCT_OWNER_ID, or pass --owner-email/--owner-id.'
    );
  }

  const normalizedEmail = String(ownerEmail || '')
    .trim()
    .toLowerCase();

  const owner = ownerId
    ? await User.findById(ownerId).select('_id email name role')
    : await User.findOne({ email: normalizedEmail }).select('_id email name role');

  if (!owner) {
    throw new Error('No user was found for the supplied seed owner.');
  }

  if (owner.role !== 'admin') {
    console.warn(
      `[seed-products] warning: owner ${owner.email} is role=${owner.role}. Products will still be attached to this user.`
    );
  }

  return owner;
};

const seedProducts = async ({ owner, count }) => {
  const products = buildSeedProducts({
    ownerId: owner._id,
    count,
  });

  let created = 0;
  let updated = 0;

  for (const payload of products) {
    const existingProduct = await Product.findOne({ slug: payload.slug });

    if (existingProduct) {
      existingProduct.set(payload);
      await existingProduct.save();
      updated += 1;
      continue;
    }

    const product = new Product(payload);
    await product.save();
    created += 1;
  }

  clearCommerceCache(String(owner._id));

  return {
    created,
    updated,
    total: products.length,
    slugs: products.map((product) => product.slug),
  };
};

export const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const ownerId = args['owner-id'] || process.env.SEED_PRODUCT_OWNER_ID || '';
  const ownerEmail = args['owner-email'] || process.env.SEED_PRODUCT_OWNER_EMAIL || '';
  const count = toPositiveInteger(
    args.count || process.env.SEED_PRODUCT_COUNT,
    20
  );

  await connectDb();

  try {
    const owner = await resolveOwner({ ownerId, ownerEmail });
    const summary = await seedProducts({ owner, count });

    console.log(
      `[seed-products] seeded ${summary.total} products for ${owner.email} (${owner._id}).`
    );
    console.log(
      `[seed-products] created=${summary.created} updated=${summary.updated}`
    );
  } finally {
    await disconnectDb();
  }
};

if (process.argv[1] === scriptPath) {
  main().catch((error) => {
    console.error(`[seed-products] ${error.message}`);
    process.exitCode = 1;
  });
}
