import offersData from "@/data/offers.json";

export interface Voucher {
  code: string;
  label: string;
  discountPercent: number;
  discountType: "percent" | "flat";
  flatAmount?: number;
  minAmount: number;
  maxDiscount: number;
  validUntil: string;
  active: boolean;
  description: string;
}

export interface DayDeal {
  productId: string;
  dealPrice: number;
  originalPrice: number;
  label: string;
  badge: string;
  savingsPercent: number;
  expiresAt: string;
  active: boolean;
  highlight: string;
}

export interface VoucherValidationResult {
  valid: boolean;
  voucher?: Voucher;
  discountAmount?: number;
  finalAmount?: number;
  error?: string;
}

export function getActiveVouchers(): Voucher[] {
  const now = new Date();
  return (offersData.vouchers as unknown as Voucher[]).filter(
    (v) => v.active && new Date(v.validUntil) > now
  );
}

export function getActiveDayDeals(): DayDeal[] {
  const now = new Date();
  return (offersData.dayDeals as unknown as DayDeal[]).filter(
    (d) => d.active && new Date(d.expiresAt) > now
  );
}

export function getDayDealForProduct(productId: string): DayDeal | null {
  const deals = getActiveDayDeals();
  return deals.find((d) => d.productId === productId) || null;
}

export function validateVoucher(code: string, amount: number): VoucherValidationResult {
  const vouchers = getActiveVouchers();
  const voucher = vouchers.find(
    (v) => v.code.toUpperCase() === code.toUpperCase()
  );

  if (!voucher) {
    return { valid: false, error: "Voucher code not found or expired" };
  }

  if (amount < voucher.minAmount) {
    return {
      valid: false,
      error: `This voucher requires a minimum order of RS.${voucher.minAmount.toLocaleString("en-IN")}`,
    };
  }

  let discountAmount = 0;
  if (voucher.discountType === "flat" && voucher.flatAmount) {
    discountAmount = Math.min(voucher.flatAmount, voucher.maxDiscount);
  } else {
    discountAmount = Math.min(
      Math.round((amount * voucher.discountPercent) / 100),
      voucher.maxDiscount
    );
  }

  const finalAmount = Math.max(0, amount - discountAmount);

  return {
    valid: true,
    voucher,
    discountAmount,
    finalAmount,
  };
}

export function getCrossSellForProduct(productId: string) {
  const rules = (offersData.crossSellRules as any[]);
  return rules.find((r) => r.productId === productId) || null;
}
