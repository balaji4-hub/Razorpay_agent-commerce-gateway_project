import { getAllProducts, getProductById, filterProducts, searchProducts as catalogSearch, Product } from "./catalogService";
import { auditService } from "./auditService";

export interface SearchProductsToolInput {
  query?: string;
  category?: string;
  maxPrice?: number;
  requiredFeatures?: string[];
}

export interface CheckStockToolOutput {
  productId: string;
  productName: string;
  inStock: boolean;
  stockQuantity: number;
}

export interface CompareProductsToolOutput {
  products: Array<{
    id: string;
    name: string;
    brand: string;
    price: number;
    rating: number;
    stock: number;
    battery: string;
    noise_cancellation: boolean | string;
    connectivity: string;
    delivery_days: number;
  }>;
}

export class ControlledAgentTools {
  private sessionId: string;

  constructor(sessionId: string = "default_session") {
    this.sessionId = sessionId;
  }

  /**
   * Tool 1: searchProducts
   */
  searchProducts(input: SearchProductsToolInput): Product[] {
    auditService.logEvent({
      sessionId: this.sessionId,
      actor: "AI_AGENT",
      action: "CATALOG_SEARCH",
      reason: `Searching catalog with parameters: ${JSON.stringify(input)}`,
      metadata: { input },
      status: "SUCCESS"
    });

    let results = getAllProducts();

    if (input.category) {
      const cat = input.category.toLowerCase();
      results = results.filter(p => p.category.toLowerCase() === cat);
    }

    if (input.maxPrice !== undefined && input.maxPrice > 0) {
      results = results.filter(p => p.price <= input.maxPrice!);
    }

    if (input.query) {
      const q = input.query.toLowerCase().trim();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q))
      );
    }

    if (input.requiredFeatures && input.requiredFeatures.length > 0) {
      results = results.filter(p => {
        const prodFeatures = p.features.map(f => f.toLowerCase());
        const specs = JSON.stringify(p.specifications).toLowerCase();
        return input.requiredFeatures!.some(rf => 
          prodFeatures.some(pf => pf.includes(rf.toLowerCase())) || specs.includes(rf.toLowerCase())
        );
      });
    }

    return results;
  }

  /**
   * Tool 2: getProductDetails
   */
  getProductDetails(productId: string): Product | null {
    const product = getProductById(productId);
    if (!product) {
      auditService.logEvent({
        sessionId: this.sessionId,
        actor: "AI_AGENT",
        action: "CATALOG_SEARCH",
        reason: `Product with ID ${productId} not found`,
        metadata: { productId },
        status: "FAILED"
      });
      return null;
    }

    auditService.logEvent({
      sessionId: this.sessionId,
      actor: "AI_AGENT",
      action: "PRODUCT_SELECTED",
      reason: `Retrieved complete product specs for ${product.name}`,
      metadata: { productId, name: product.name, price: product.price },
      status: "SUCCESS"
    });

    return product;
  }

  /**
   * Tool 3: checkStock
   */
  checkStock(productId: string): CheckStockToolOutput {
    const product = getProductById(productId);
    if (!product) {
      return {
        productId,
        productName: "Unknown",
        inStock: false,
        stockQuantity: 0
      };
    }

    const output = {
      productId: product.id,
      productName: product.name,
      inStock: product.stock > 0,
      stockQuantity: product.stock
    };

    auditService.logEvent({
      sessionId: this.sessionId,
      actor: "AI_AGENT",
      action: "STOCK_CHECKED",
      reason: `Verified stock for ${product.name}: ${product.stock} units available`,
      metadata: output,
      status: product.stock > 0 ? "SUCCESS" : "FAILED"
    });

    return output;
  }

  /**
   * Tool 4: compareProducts
   */
  compareProducts(productIds: string[]): CompareProductsToolOutput {
    const products = productIds
      .map(id => getProductById(id))
      .filter((p): p is Product => p !== undefined);

    const comparison = products.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      rating: p.rating,
      stock: p.stock,
      battery: p.specifications.battery || "N/A",
      noise_cancellation: p.specifications.noise_cancellation ? "Yes (ANC)" : "Passive",
      connectivity: p.specifications.connectivity || "Bluetooth",
      delivery_days: p.delivery_days
    }));

    auditService.logEvent({
      sessionId: this.sessionId,
      actor: "AI_AGENT",
      action: "CATALOG_SEARCH",
      reason: `Generated side-by-side comparison for ${products.length} products`,
      metadata: { comparedIds: productIds },
      status: "SUCCESS"
    });

    return { products: comparison };
  }
}
