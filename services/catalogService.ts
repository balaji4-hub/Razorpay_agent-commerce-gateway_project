import fs from "fs";
import path from "path";

export interface ProductSpecifications {
  battery?: string;
  connectivity?: string;
  noise_cancellation?: boolean;
  driver_size?: string;
  weight?: string;
  display?: string;
  water_resistance?: string;
  sensors?: string;
  power_output?: string;
  frequency_response?: string;
  material?: string;
  drop_standard?: string;
  finish?: string;
  thickness?: string;
  total_wattage?: string;
  ports?: string;
  dimensions?: string;
  input?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  category: "headphones" | "earbuds" | "smartwatches" | "phone accessories" | "speakers" | string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  specifications: ProductSpecifications;
  stock: number;
  rating: number;
  delivery_days: number;
  return_policy_days: number;
  imageUrl?: string;
}

export interface ProductFilters {
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  brand?: string;
  inStockOnly?: boolean;
  minRating?: number;
}

export interface ProductSearchResult {
  total: number;
  products: Product[];
  query?: string;
  filtersApplied?: ProductFilters;
}

// In-memory cache for fast, reliable reads
let cachedProducts: Product[] | null = null;

function loadProductsFromFile(): Product[] {
  if (cachedProducts) {
    return cachedProducts;
  }
  try {
    const filePath = path.join(process.cwd(), "data", "products.json");
    if (!fs.existsSync(filePath)) {
      console.warn(`[catalogService] File not found at ${filePath}, using fallback empty array.`);
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    cachedProducts = JSON.parse(data);
    return cachedProducts || [];
  } catch (error) {
    console.error("[catalogService] Error reading products.json:", error);
    return [];
  }
}

/**
 * Returns all products from the catalog.
 */
export function getAllProducts(): Product[] {
  return loadProductsFromFile();
}

/**
 * Returns full details of a single product by ID or undefined.
 */
export function getProductById(id: string): Product | undefined {
  if (!id || typeof id !== "string") return undefined;
  const products = loadProductsFromFile();
  return products.find(p => p.id.toLowerCase() === id.trim().toLowerCase());
}

/**
 * Searches product names, descriptions, brands, and features.
 */
export function searchProducts(query: string): ProductSearchResult {
  const products = loadProductsFromFile();
  if (!query || typeof query !== "string" || !query.trim()) {
    return { total: products.length, products, query: "" };
  }

  const cleanQuery = query.trim().toLowerCase();
  const matched = products.filter(p => {
    const inName = p.name.toLowerCase().includes(cleanQuery);
    const inDesc = p.description.toLowerCase().includes(cleanQuery);
    const inBrand = p.brand.toLowerCase().includes(cleanQuery);
    const inCategory = p.category.toLowerCase().includes(cleanQuery);
    const inFeatures = p.features.some(f => f.toLowerCase().includes(cleanQuery));
    const inSpecs = Object.values(p.specifications).some(val => 
      String(val).toLowerCase().includes(cleanQuery)
    );
    return inName || inDesc || inBrand || inCategory || inFeatures || inSpecs;
  });

  return {
    total: matched.length,
    products: matched,
    query
  };
}

/**
 * Filters catalog products based on category, price, stock, and rating.
 */
export function filterProducts(filters: ProductFilters): ProductSearchResult {
  let products = loadProductsFromFile();

  if (filters.category) {
    const cat = filters.category.trim().toLowerCase();
    products = products.filter(p => p.category.toLowerCase() === cat);
  }

  if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
    products = products.filter(p => p.price <= filters.maxPrice!);
  }

  if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
    products = products.filter(p => p.price >= filters.minPrice!);
  }

  if (filters.brand) {
    const brand = filters.brand.trim().toLowerCase();
    products = products.filter(p => p.brand.toLowerCase() === brand);
  }

  if (filters.inStockOnly) {
    products = products.filter(p => p.stock > 0);
  }

  if (filters.minRating !== undefined && !isNaN(filters.minRating)) {
    products = products.filter(p => p.rating >= filters.minRating!);
  }

  return {
    total: products.length,
    products,
    filtersApplied: filters
  };
}
