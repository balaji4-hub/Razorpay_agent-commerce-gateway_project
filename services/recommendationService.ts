import { Product, getAllProducts } from "./catalogService";

export interface UserRequirements {
  category?: string;
  budget?: number;
  desiredFeatures: string[];
  useCase?: string; // e.g. "travel", "gaming", "fitness", "office", "general"
  preferredBrand?: string;
}

export interface ProductScore {
  productId: string;
  budgetMatch: number;      // 0 - 25
  featureMatch: number;     // 0 - 25
  availabilityScore: number;// 0 - 15
  ratingScore: number;      // 0 - 15
  useCaseScore: number;     // 0 - 10
  valueScore: number;       // 0 - 10 (price-to-feature value)
  overallScore: number;     // 0 - 100
  matchReasons: string[];
}

export interface RankedRecommendation {
  bestMatch: Product;
  bestMatchScore: ProductScore;
  alternatives: Array<{
    product: Product;
    score: ProductScore;
  }>;
  explanation: {
    title: string;
    reasons: string[];
    useCaseDetected?: string;
    budgetContext?: string;
  };
}

/**
 * Natural language rule-based intent and requirement analyzer
 */
export function analyzeUserRequirements(message: string): UserRequirements {
  const text = message.toLowerCase();
  const req: UserRequirements = {
    desiredFeatures: []
  };

  // 1. Detect Category
  if (text.includes("headphone") || text.includes("over-ear") || text.includes("on-ear")) {
    req.category = "headphones";
  } else if (text.includes("earbud") || text.includes("tws") || text.includes("airpod") || text.includes("buds")) {
    req.category = "earbuds";
  } else if (text.includes("watch") || text.includes("smartwatch") || text.includes("fitness tracker")) {
    req.category = "smartwatches";
  } else if (text.includes("speaker") || text.includes("soundbar") || text.includes("boombox")) {
    req.category = "speakers";
  } else if (text.includes("charger") || text.includes("case") || text.includes("accessory") || text.includes("accessories")) {
    req.category = "phone accessories";
  }

  // 2. Detect Budget (e.g. "under 5000", "under ₹5000", "below 4500", "less than 8000")
  const budgetMatch = text.match(/(?:under|below|less than|within|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i);
  if (budgetMatch && budgetMatch[1]) {
    const rawVal = budgetMatch[1].replace(/,/g, "");
    req.budget = parseInt(rawVal, 10);
  }

  // 3. Detect Use Case
  if (text.includes("travel") || text.includes("flight") || text.includes("commute") || text.includes("airplane")) {
    req.useCase = "travel";
    req.desiredFeatures.push("active noise cancellation", "battery");
  } else if (text.includes("gym") || text.includes("workout") || text.includes("running") || text.includes("sport")) {
    req.useCase = "fitness";
    req.desiredFeatures.push("water resistance", "battery");
  } else if (text.includes("game") || text.includes("gaming") || text.includes("low latency")) {
    req.useCase = "gaming";
    req.desiredFeatures.push("ultra-low latency", "dual dynamic drivers");
  } else if (text.includes("work") || text.includes("call") || text.includes("meeting") || text.includes("office")) {
    req.useCase = "office";
    req.desiredFeatures.push("calls", "noise cancellation", "multipoint");
  }

  // 4. Detect Specific Desired Features
  if (text.includes("anc") || text.includes("noise cancel") || text.includes("noise-cancel")) {
    if (!req.desiredFeatures.includes("active noise cancellation")) {
      req.desiredFeatures.push("active noise cancellation");
    }
  }
  if (text.includes("wireless") || text.includes("bluetooth")) {
    req.desiredFeatures.push("wireless");
  }
  if (text.includes("battery") || text.includes("long battery")) {
    req.desiredFeatures.push("battery");
  }
  if (text.includes("bass") || text.includes("extra bass")) {
    req.desiredFeatures.push("bass");
  }
  if (text.includes("waterproof") || text.includes("water resistant") || text.includes("ipx")) {
    req.desiredFeatures.push("water resistance");
  }

  // 5. Detect Brands
  const brands = ["jbl", "sony", "boat", "sennheiser", "oneplus", "realme", "noise", "amazfit", "fire-boltt", "spigen", "anker"];
  for (const b of brands) {
    if (text.includes(b)) {
      req.preferredBrand = b;
      break;
    }
  }

  return req;
}

/**
 * Multi-Factor Scoring Engine for a Product
 */
export function scoreProduct(product: Product, requirements: UserRequirements): ProductScore {
  let budgetMatch = 25;
  let featureMatch = 15;
  let availabilityScore = product.stock > 0 ? 15 : 0;
  let ratingScore = Math.min(15, Math.round((product.rating / 5.0) * 15));
  let useCaseScore = 5;
  let valueScore = 7;
  const matchReasons: string[] = [];

  // 1. Budget Scoring (0 - 25)
  if (requirements.budget) {
    if (product.price <= requirements.budget) {
      budgetMatch = 25;
      const savings = requirements.budget - product.price;
      if (savings > 0) {
        matchReasons.push(`Within budget: ₹${product.price.toLocaleString('en-IN')} (saves ₹${savings.toLocaleString('en-IN')})`);
      } else {
        matchReasons.push(`Exact budget match: ₹${product.price.toLocaleString('en-IN')}`);
      }
    } else {
      // Over budget: penalty proportional to excess
      const diffPercent = (product.price - requirements.budget) / requirements.budget;
      budgetMatch = Math.max(0, Math.round(25 - (diffPercent * 35)));
    }
  } else {
    // No explicit budget: standard reward for reasonable price tier
    budgetMatch = 20;
  }

  // 2. Feature Matching (0 - 25)
  if (requirements.desiredFeatures.length > 0) {
    let matchedCount = 0;
    const allProdFeatures = [
      ...product.features,
      product.description,
      JSON.stringify(product.specifications)
    ].join(" ").toLowerCase();

    for (const feat of requirements.desiredFeatures) {
      if (allProdFeatures.includes(feat.toLowerCase())) {
        matchedCount++;
        matchReasons.push(`Feature verified: ${feat}`);
      }
    }

    featureMatch = Math.min(25, Math.round((matchedCount / requirements.desiredFeatures.length) * 25));
  } else {
    featureMatch = 20;
  }

  // 3. Availability Scoring (0 - 15)
  if (product.stock > 0) {
    matchReasons.push(`Guaranteed stock: ${product.stock} units ready for immediate fulfillment`);
  } else {
    matchReasons.push(`Currently Out of Stock`);
  }

  // 4. Rating Scoring (0 - 15)
  if (product.rating >= 4.5) {
    matchReasons.push(`High customer rating: ${product.rating}★ (${product.brand} verified)`);
  } else if (product.rating >= 4.0) {
    matchReasons.push(`Solid rating: ${product.rating}★`);
  }

  // 5. Use Case Scoring (0 - 10)
  if (requirements.useCase) {
    const isAnc = Boolean(product.specifications.noise_cancellation);
    if (requirements.useCase === "travel" && isAnc) {
      useCaseScore = 10;
      matchReasons.push(`Optimized for travel: Active Noise Cancellation filters ambient transit noise`);
    } else if (requirements.useCase === "fitness" && (product.category === "earbuds" || product.specifications.water_resistance)) {
      useCaseScore = 10;
      matchReasons.push(`Sweat/water defense for fitness activity`);
    } else {
      useCaseScore = 6;
    }
  }

  // 6. Value Score (0 - 10)
  if (product.features.length >= 4 && product.price < 5000) {
    valueScore = 10;
    matchReasons.push(`Exceptional price-to-feature value`);
  }

  const overallScore = Math.min(
    100,
    budgetMatch + featureMatch + availabilityScore + ratingScore + useCaseScore + valueScore
  );

  return {
    productId: product.id,
    budgetMatch,
    featureMatch,
    availabilityScore,
    ratingScore,
    useCaseScore,
    valueScore,
    overallScore,
    matchReasons
  };
}

/**
 * Rank products by overall score
 */
export function rankProducts(
  products: Product[],
  requirements: UserRequirements
): Array<{ product: Product; score: ProductScore }> {
  const scored = products.map(product => ({
    product,
    score: scoreProduct(product, requirements)
  }));

  // Sort descending by overallScore, prioritize in-stock items
  return scored.sort((a, b) => {
    if (a.product.stock > 0 && b.product.stock === 0) return -1;
    if (a.product.stock === 0 && b.product.stock > 0) return 1;
    return b.score.overallScore - a.score.overallScore;
  });
}

/**
 * Generate full recommendation object with Best Match and alternatives
 */
export function generateRecommendationExplanation(
  rankedList: Array<{ product: Product; score: ProductScore }>,
  requirements: UserRequirements
): RankedRecommendation | null {
  if (!rankedList || rankedList.length === 0) return null;

  const top = rankedList[0];
  const alternatives = rankedList.slice(1, 3);

  const reasons = top.score.matchReasons.slice(0, 4);

  return {
    bestMatch: top.product,
    bestMatchScore: top.score,
    alternatives,
    explanation: {
      title: `Recommended: ${top.product.name}`,
      reasons,
      useCaseDetected: requirements.useCase,
      budgetContext: requirements.budget ? `₹${requirements.budget.toLocaleString('en-IN')}` : undefined
    }
  };
}
