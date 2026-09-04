// Codata OpenAPI compliant Product Catalog
export const products = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    name: "AuraWave Pro ANC Wireless Headphones",
    category: "headphones",
    brand: "SonicTech",
    price: 3499.00,
    currency: "INR",
    description: "Flagship hybrid active noise cancelling over-ear headphones with 40-hour battery life and spatial audio support.",
    features: [
      "Hybrid Active Noise Cancellation (up to 38dB)",
      "40-hour playtime with fast charging (10 min = 5 hours)",
      "High-Res Audio Certified with 40mm dynamic drivers",
      "Multipoint dual Bluetooth 5.3 connection"
    ],
    specifications: {
      driverSize: "40mm",
      bluetoothVersion: "5.3",
      codecSupport: ["AAC", "SBC", "LDAC"],
      weightGrams: 245,
      waterResistance: "IPX4"
    },
    stock: 18,
    rating: 4.8,
    deliveryDays: 2,
    returnPolicyDays: 14,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    name: "PulseTune Elite True Wireless Earbuds",
    category: "earbuds",
    brand: "SonicTech",
    price: 1999.00,
    currency: "INR",
    description: "Compact wireless earbuds with deep bass, quad-mic ENC for crystal-clear calls, and wireless charging case.",
    features: [
      "Quad-microphone Environmental Noise Cancellation",
      "Ultra-low latency gaming mode (45ms)",
      "32-hour total battery life with Qi wireless charging case",
      "Ergonomic feather-light fit"
    ],
    specifications: {
      driverSize: "11mm Titanium",
      bluetoothVersion: "5.3",
      codecSupport: ["AAC", "SBC"],
      weightGrams: 42,
      waterResistance: "IPX5"
    },
    stock: 25,
    rating: 4.6,
    deliveryDays: 3,
    returnPolicyDays: 7,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    name: "Chronos Apex Smartwatch Ultra",
    category: "smartwatches",
    brand: "Chronos",
    price: 4999.00,
    currency: "INR",
    description: "Rugged aerospace-grade aluminum smartwatch featuring 1.96-inch AMOLED display, dual-band GPS, and comprehensive wellness tracking.",
    features: [
      "1.96\" Super AMOLED Display with Always-On feature",
      "Built-in Dual-band GPS & Compass navigation",
      "Continuous SpO2, HRV, and 24/7 Heart Rate monitoring",
      "12-day battery life with rapid magnetic charger"
    ],
    specifications: {
      display: "1.96-inch AMOLED 410x502",
      batteryCapacityMah: 380,
      sensors: ["Accelerometer", "Optical Heart Rate", "SpO2", "Barometer"],
      waterResistance: "5ATM + IP68"
    },
    stock: 9,
    rating: 4.9,
    deliveryDays: 2,
    returnPolicyDays: 14,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    name: "AuraWave Hard-Shell Travel Protective Case",
    category: "phone-accessories",
    brand: "SonicTech",
    price: 499.00,
    currency: "INR",
    description: "Shock-absorbing, water-resistant EVA carrying case tailored for AuraWave & similar over-ear headphones with cable organizer pouch.",
    features: [
      "Military-grade EVA shockproof construction",
      "Soft velvet interior lining prevents scratches",
      "Mesh zipper pocket for audio & charging cables",
      "Reinforced carry handle and carabiner loop"
    ],
    specifications: {
      material: "High-density EVA & Oxford fabric",
      dimensionsCm: "22 x 18 x 10",
      weightGrams: 160
    },
    stock: 45,
    rating: 4.7,
    deliveryDays: 2,
    returnPolicyDays: 30,
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "a1b2c3d4-0005-4000-8000-000000000005",
    name: "BassBoom 360 Portable Rugged Speaker",
    category: "speakers",
    brand: "SonicTech",
    price: 2799.00,
    currency: "INR",
    description: "360-degree omnidirectional outdoor Bluetooth speaker with punchy bass radiators and waterproof IPX7 rating.",
    features: [
      "24W omnidirectional room-filling audio output",
      "IPX7 waterproof — can be submerged in water up to 1m",
      "PartySync mode: connect up to 50 speakers together",
      "18-hour continuous battery life with power bank output"
    ],
    specifications: {
      powerOutputWatts: 24,
      batteryCapacityMah: 4400,
      bluetoothVersion: "5.3",
      weightGrams: 580
    },
    stock: 14,
    rating: 4.5,
    deliveryDays: 3,
    returnPolicyDays: 14,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    // Out-of-Stock item specifically configured for graceful failure demonstration
    id: "a1b2c3d4-0006-4000-8000-000000000006",
    name: "StudioMaster Pro Audiophile Open-Back Headphones",
    category: "headphones",
    brand: "SonicTech",
    price: 8999.00,
    currency: "INR",
    description: "Reference grade 50mm planar magnetic headphones for critical studio monitoring. High demand item.",
    features: [
      "50mm Planar Magnetic planar transducers",
      "Open-back expansive acoustic soundstage",
      "Detachable silver-plated oxygen-free copper cable"
    ],
    specifications: {
      impedanceOhms: 32,
      frequencyResponse: "5Hz - 45kHz",
      weightGrams: 390
    },
    stock: 0, // SOLD OUT!
    rating: 4.9,
    deliveryDays: 5,
    returnPolicyDays: 7,
    imageUrl: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&auto=format&fit=crop&q=80",
    isActive: true
  }
];

// Upsell & Cross-Sell Mapping Engine to grow merchant revenue
export const upsellRules = {
  // When user is interested in AuraWave headphones:
  "a1b2c3d4-0001-4000-8000-000000000001": {
    recommendedProductId: "a1b2c3d4-0004-4000-8000-000000000004", // Travel case
    bundleDiscountPercent: 15,
    rationale: "Customers who bought AuraWave Pro headphones paired it with the Hard-Shell Travel Case for 15% bundle savings and complete transit protection."
  },
  // When user buys earbuds:
  "a1b2c3d4-0002-4000-8000-000000000002": {
    recommendedProductId: "a1b2c3d4-0005-4000-8000-000000000005", // BassBoom Speaker
    bundleDiscountPercent: 10,
    rationale: "Upgrade your audio setup: Add the BassBoom 360 Outdoor Speaker for home listening at a 10% bundle concession."
  }
};
