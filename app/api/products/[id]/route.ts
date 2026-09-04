import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/services/catalogService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const product = getProductById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: `Product with ID '${id}' was not found in the catalog.`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product details",
        details: error.message
      },
      { status: 500 }
    );
  }
}
