import { NextResponse } from "next/server";
import { getActiveVouchers, getActiveDayDeals } from "@/services/offersService";

export async function GET() {
  try {
    const vouchers = getActiveVouchers();
    const dayDeals = getActiveDayDeals();

    return NextResponse.json({
      success: true,
      data: {
        vouchers,
        dayDeals,
        meta: {
          totalVouchers: vouchers.length,
          totalDeals: dayDeals.length,
          generatedAt: new Date().toISOString()
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, amount } = body;

    if (!code || !amount) {
      return NextResponse.json({ success: false, error: "code and amount are required" }, { status: 400 });
    }

    const { validateVoucher } = await import("@/services/offersService");
    const result = validateVoucher(code, Number(amount));

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
