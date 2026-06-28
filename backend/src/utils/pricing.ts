export const DELIVERY_FEES = {
  INSTANT: 15000,
  NEXT_DAY: 8000,
  REGULAR: 5000,
};

export function getDeliveryFee(method: string): number {
  const normalized = method.toUpperCase();
  if (normalized === "INSTANT") return DELIVERY_FEES.INSTANT;
  if (normalized === "NEXT_DAY") return DELIVERY_FEES.NEXT_DAY;
  if (normalized === "REGULAR") return DELIVERY_FEES.REGULAR;
  return 0;
}

export interface PricingInput {
  subtotal: number;
  deliveryMethod: string;
  discountKind?: "PERCENT" | "FLAT" | null;
  discountValue?: number | null;
}

export interface PricingResult {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  ppn: number;
  total: number;
}

export function calculatePricing({
  subtotal,
  deliveryMethod,
  discountKind,
  discountValue,
}: PricingInput): PricingResult {
  // 1. Discount amount calculation
  let discountAmount = 0;
  if (discountKind && discountValue) {
    if (discountKind === "PERCENT") {
      discountAmount = Math.floor((subtotal * discountValue) / 100);
    } else if (discountKind === "FLAT") {
      discountAmount = discountValue;
    }
  }

  // Cap discount at subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  // 2. Delivery fee lookup
  const deliveryFee = getDeliveryFee(deliveryMethod);

  // 3. PPN 12% on post-discount subtotal
  const postDiscountSubtotal = subtotal - discountAmount;
  const ppn = Math.round(0.12 * postDiscountSubtotal);

  // 4. Total calculation
  const total = postDiscountSubtotal + deliveryFee + ppn;

  return {
    subtotal,
    discountAmount,
    deliveryFee,
    ppn,
    total,
  };
}
