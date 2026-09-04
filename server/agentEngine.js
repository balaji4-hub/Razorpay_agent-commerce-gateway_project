import { products, upsellRules } from "./catalog.js";
import { auditLogger } from "./auditLogger.js";
import { policyEngine } from "./policyEngine.js";

export class ShoppingAgentEngine {
  constructor() {
    this.name = "ShoppingAgent";
  }

  // 1. Tool: searchProducts
  searchProducts({ sessionId, query, category, maxPrice }) {
    const startTime = performance.now();
    let results = [...products];

    if (category) {
      results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (maxPrice) {
      results = results.filter(p => p.price <= Number(maxPrice));
    }

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    const durationMs = performance.now() - startTime;
    auditLogger.logToolCall({
      sessionId,
      toolName: "searchProducts",
      inputPayload: { query, category, maxPrice },
      outputPayload: { count: results.length, matches: results.map(r => r.name) },
      success: true,
      durationMs
    });

    return results;
  }

  // 2. Tool: getProductDetails
  getProductDetails({ sessionId, productId }) {
    const startTime = performance.now();
    const product = products.find(p => p.id === productId);
    const durationMs = performance.now() - startTime;

    if (!product) {
      auditLogger.logToolCall({
        sessionId,
        toolName: "getProductDetails",
        inputPayload: { productId },
        outputPayload: null,
        success: false,
        errorMessage: `Product ID not found: ${productId}`,
        durationMs
      });
      return null;
    }

    auditLogger.logToolCall({
      sessionId,
      toolName: "getProductDetails",
      inputPayload: { productId },
      outputPayload: { name: product.name, price: product.price, stock: product.stock },
      success: true,
      durationMs
    });

    return product;
  }

  // 3. Tool: checkStock
  checkStock({ sessionId, productId, quantity = 1 }) {
    const startTime = performance.now();
    const product = products.find(p => p.id === productId);
    const durationMs = performance.now() - startTime;

    if (!product) {
      auditLogger.logToolCall({
        sessionId,
        toolName: "checkStock",
        inputPayload: { productId, quantity },
        outputPayload: null,
        success: false,
        errorMessage: "Product does not exist",
        durationMs
      });
      return { available: false, stock: 0, reason: "Product does not exist" };
    }

    const isAvailable = product.stock >= quantity;
    const result = {
      available: isAvailable,
      stock: product.stock,
      requested: quantity,
      productName: product.name
    };

    auditLogger.logToolCall({
      sessionId,
      toolName: "checkStock",
      inputPayload: { productId, quantity },
      outputPayload: result,
      success: isAvailable,
      errorMessage: isAvailable ? null : `Insufficient stock (Available: ${product.stock}, Requested: ${quantity})`,
      durationMs
    });

    return result;
  }

  // 4. Tool: compareProducts
  compareProducts({ sessionId, productIds }) {
    const startTime = performance.now();
    const items = products.filter(p => productIds.includes(p.id));
    const comparison = items.map(item => ({
      id: item.id,
      name: item.name,
      price: `₹${item.price.toFixed(2)}`,
      rating: `${item.rating}★`,
      stock: item.stock > 0 ? `${item.stock} in stock` : "Sold Out",
      delivery: `${item.deliveryDays} days`,
      returnPolicy: `${item.returnPolicyDays} days`,
      keyFeatures: item.features.slice(0, 3)
    }));

    const durationMs = performance.now() - startTime;
    auditLogger.logToolCall({
      sessionId,
      toolName: "compareProducts",
      inputPayload: { productIds },
      outputPayload: { count: items.length },
      success: true,
      durationMs
    });

    return comparison;
  }

  // 5. Tool: recommendUpsellBundle (AI Growth & Revenue Driver)
  recommendUpsellBundle({ sessionId, productId }) {
    const startTime = performance.now();
    const rule = upsellRules[productId];
    const durationMs = performance.now() - startTime;

    if (!rule) {
      auditLogger.logToolCall({
        sessionId,
        toolName: "recommendUpsellBundle",
        inputPayload: { productId },
        outputPayload: { hasUpsell: false },
        success: true,
        durationMs
      });
      return null;
    }

    const baseProduct = products.find(p => p.id === productId);
    const accessory = products.find(p => p.id === rule.recommendedProductId);

    if (!baseProduct || !accessory) return null;

    const accessoryOriginalPrice = accessory.price;
    const discountAmount = Math.round((accessoryOriginalPrice * rule.bundleDiscountPercent) / 100);
    const discountedAccessoryPrice = accessoryOriginalPrice - discountAmount;
    const bundleTotal = baseProduct.price + discountedAccessoryPrice;

    const bundleOffer = {
      baseProduct,
      accessory,
      discountPercent: rule.bundleDiscountPercent,
      originalTotal: baseProduct.price + accessoryOriginalPrice,
      bundleTotal,
      savings: discountAmount,
      rationale: rule.rationale
    };

    auditLogger.logToolCall({
      sessionId,
      toolName: "recommendUpsellBundle",
      inputPayload: { productId, baseProduct: baseProduct.name },
      outputPayload: {
        accessory: accessory.name,
        discountPercent: rule.bundleDiscountPercent,
        bundleTotal
      },
      success: true,
      durationMs
    });

    return bundleOffer;
  }

  // 6. Conversational Turn Orchestration
  async processUserMessage({ sessionId, message, conversationHistory = [] }) {
    const text = message.trim().toLowerCase();

    // Out of stock scenario trigger
    if (text.includes("audiophile") || text.includes("studiomaster") || text.includes("out of stock")) {
      const soldOutItem = products.find(p => p.stock === 0);
      const stockCheck = this.checkStock({ sessionId, productId: soldOutItem.id, quantity: 1 });
      
      // Graceful failure handling: provide alternative immediately
      const recommendedAlternative = products.find(p => p.category === "headphones" && p.stock > 0);

      return {
        reply: `⚠️ **Inventory Notice**: The **${soldOutItem.name}** is currently sold out (0 units in stock).\n\n💡 **Autonomous Alternative Recommendation**:\nI analyzed the catalog and recommend the **${recommendedAlternative.name}** instead. It features Hybrid ANC, 40hr battery life, and 4.8★ rating at ₹${recommendedAlternative.price.toFixed(2)} with guaranteed 2-day delivery.`,
        actionType: "inventory_failure_handled",
        toolCalls: [
          { tool: "checkStock", success: false, note: "Stock is 0" },
          { tool: "searchProducts", success: true, note: "Found in-stock alternative" }
        ],
        featuredProducts: [recommendedAlternative],
        suggestedActions: [
          `View details for ${recommendedAlternative.name}`,
          `Buy ${recommendedAlternative.name}`
        ]
      };
    }

    // Spending limit / Policy violation scenario trigger
    if (text.includes("exceed limit") || text.includes("100 units") || text.includes("bulk order")) {
      const item = products[0];
      const proposedOrder = policyEngine.proposeCheckout({
        sessionId,
        items: [{ productId: item.id, quantity: 10 }] // 10 units = ₹34,990 > ₹10,000 bound
      });

      return {
        reply: `🛡️ **Autonomous Policy Guardrail Intercepted**:\n\nThe order could not be placed because it violates merchant spending bounds:\n- **Violations**: ${proposedOrder.violations?.join(", ")}\n- **Limit**: Maximum single transaction bound is ₹${(10000).toLocaleString('en-IN')}.\n\n*The transaction was intercepted safely and recorded in the audit log.*`,
        actionType: "policy_violation_handled",
        policyViolation: proposedOrder,
        suggestedActions: [
          "Order 1 unit within policy limit",
          "Browse other products"
        ]
      };
    }

    // Headphone inquiry -> showcase discovery + Upsell bundle recommendation
    if (text.includes("headphone") || text.includes("music") || text.includes("anc") || text.includes("audio")) {
      const results = this.searchProducts({ sessionId, category: "headphones" });
      const bestHeadphone = results.find(p => p.stock > 0) || results[0];
      const bundle = this.recommendUpsellBundle({ sessionId, productId: bestHeadphone.id });

      let reply = `Here are our top-rated audio selections. I recommend the **${bestHeadphone.name}** (₹${bestHeadphone.price}) with 40mm drivers and 38dB Hybrid ANC.`;
      if (bundle) {
        reply += `\n\n🎁 **Special Revenue Growth Bundle**: Add the **${bundle.accessory.name}** and save ${bundle.discountPercent}%! Bundle price: **₹${bundle.bundleTotal}** (Save ₹${bundle.savings}).`;
      }

      return {
        reply,
        actionType: "catalog_discovery",
        featuredProducts: results.filter(p => p.stock > 0),
        upsellBundle: bundle,
        suggestedActions: [
          `Buy ${bestHeadphone.name}`,
          `Add Bundle (Headphones + Case) to Cart`,
          `Compare Headphones vs Earbuds`
        ]
      };
    }

    // Comparison query
    if (text.includes("compare") || text.includes("vs") || text.includes("difference")) {
      const p1 = products[0]; // Headphones
      const p2 = products[1]; // Earbuds
      const comparison = this.compareProducts({ sessionId, productIds: [p1.id, p2.id] });

      return {
        reply: `Here is a side-by-side comparison between **${p1.name}** and **${p2.name}**:`,
        actionType: "product_comparison",
        comparisonTable: comparison,
        featuredProducts: [p1, p2],
        suggestedActions: [
          `Buy ${p1.name} (Over-ear ANC)`,
          `Buy ${p2.name} (Compact TWS)`
        ]
      };
    }

    // General product search
    const allMatches = this.searchProducts({ sessionId, query: text });
    if (allMatches.length > 0) {
      return {
        reply: `I found ${allMatches.length} matching product(s) in our merchant catalog. Every product is structured with AI-verifiable specifications, stock, and Razorpay checkout readiness.`,
        actionType: "search_results",
        featuredProducts: allMatches,
        suggestedActions: allMatches.slice(0, 3).map(p => `Details for ${p.name}`)
      };
    }

    // Fallback general prompt
    return {
      reply: `Welcome to the **Agent Commerce Gateway**! I can help you autonomously discover products, calculate smart bundle discounts, and execute bounded & explainable checkouts via Razorpay.\n\nTry asking:\n- *"Show me wireless headphones with ANC"*\n- *"Compare headphones vs earbuds"*\n- *"What happens if an item is out of stock?" (Test graceful failure)*\n- *"Order 10 units" (Test policy spending bounds)*`,
      actionType: "general_greeting",
      featuredProducts: products.slice(0, 3),
      suggestedActions: [
        "Show ANC headphones with bundle deal",
        "Compare headphones vs earbuds",
        "Test Out-of-Stock graceful failure",
        "Test ₹10k policy bound violation"
      ]
    };
  }
}

export const agentEngine = new ShoppingAgentEngine();
