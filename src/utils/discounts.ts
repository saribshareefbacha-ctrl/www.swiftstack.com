import { AppliedDiscount, DiscountCode } from '../types/cms';

export interface DiscountValidationResult {
  valid: boolean;
  message: string;
  discount?: DiscountCode;
  applied?: AppliedDiscount;
}

export function normalizeDiscountCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function validateDiscountCode(
  input: string,
  subtotalUsd: number,
  codes: DiscountCode[],
  now = new Date(),
  customerRedemptions = 0
): DiscountValidationResult {
  const normalized = normalizeDiscountCode(input);
  if (!normalized) return { valid: false, message: 'Enter a coupon code.' };
  const discount = codes.find((item) => normalizeDiscountCode(item.code) === normalized);
  if (!discount) return { valid: false, message: 'This coupon code is not valid.' };
  if (!discount.active) return { valid: false, message: 'This coupon is currently disabled.' };

  const nowMs = now.getTime();
  if (discount.startsAt && new Date(discount.startsAt).getTime() > nowMs) {
    return { valid: false, message: 'This coupon is not active yet.' };
  }
  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < nowMs) {
    return { valid: false, message: 'This coupon has expired.' };
  }
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    return { valid: false, message: 'This coupon has reached its usage limit.' };
  }
  if (discount.perCustomerLimit && customerRedemptions >= discount.perCustomerLimit) {
    return { valid: false, message: 'You have already used this coupon the maximum number of times.' };
  }
  if (subtotalUsd < Math.max(0, discount.minimumOrderUsd || 0)) {
    return {
      valid: false,
      message: `Minimum order for this coupon is $${discount.minimumOrderUsd.toLocaleString()} USD.`,
    };
  }

  let discountUsd =
    discount.type === 'percentage'
      ? subtotalUsd * (Math.min(100, Math.max(0, discount.value)) / 100)
      : Math.max(0, discount.value);
  if (discount.maximumDiscountUsd && discount.maximumDiscountUsd > 0) {
    discountUsd = Math.min(discountUsd, discount.maximumDiscountUsd);
  }
  discountUsd = Math.min(subtotalUsd, Math.round(discountUsd * 100) / 100);
  const totalUsd = Math.max(0, Math.round((subtotalUsd - discountUsd) * 100) / 100);

  return {
    valid: true,
    message: `${normalized} applied — you saved $${discountUsd.toLocaleString()} USD.`,
    discount,
    applied: { code: normalized, discountUsd, subtotalUsd, totalUsd },
  };
}
