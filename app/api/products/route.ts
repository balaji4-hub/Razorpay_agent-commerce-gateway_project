import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, searchProducts, filterProducts } from "@/services/catalogService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const maxPriceParam = searchParams.get("maxPrice");
    const query = searchParams.get("query");

    let result = getAllProducts();

    // 1. Apply free-text search if present
    if (query) {
      result = searchProducts(query).products;
    }

    // 2. Apply category and maxPrice filters
    if (category || maxPriceParam) {
      const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
      result = filterProducts({
        category: category || undefined,
        maxPrice: !isNaN(maxPrice as number) ? maxPrice : undefined
      }).products;
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve products from catalog",
        details: error.message
      },
      { status: 500 }
    );
  }
}
