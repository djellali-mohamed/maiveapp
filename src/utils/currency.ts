// Currency utilities for MAIVÉ POS
// All monetary values are stored as integers in centimes (DZD × 100)

/**
 * Convert centimes to DZD display string
 * 450000 centimes → "4 500 DZD"
 */
export const formatDZD = (centimes: number): string => {
  const dzd = centimes / 100;
  return dzd.toLocaleString('fr-DZ') + ' DZD';
};

/**
 * Convert DZD to centimes
 * 4500 DZD → 450000 centimes
 */
export const toCentimes = (dzd: number): number => {
  return Math.round(dzd * 100);
};

/**
 * Convert centimes to DZD number
 * 450000 centimes → 4500
 */
export const fromCentimes = (centimes: number): number => {
  return centimes / 100;
};

/**
 * Format number as DZD input (for display in inputs)
 */
export const formatDZDInput = (dzd: number): string => {
  return dzd.toLocaleString('fr-DZ');
};

/**
 * Parse DZD string to number
 * "4 500" → 4500
 */
export const parseDZD = (value: string): number => {
  const cleaned = value.replace(/\s/g, '').replace(/DZD/gi, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (
  subtotal: number,
  discountValue: number,
  discountType: 'percentage' | 'fixed'
): number => {
  if (discountType === 'percentage') {
    return Math.round(subtotal * (discountValue / 100));
  }
  return toCentimes(discountValue);
};

/**
 * Calculate change
 */
export const calculateChange = (tendered: number, total: number): number => {
  return Math.max(0, tendered - total);
};
