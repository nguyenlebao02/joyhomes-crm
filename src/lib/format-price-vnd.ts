/**
 * Format price in Vietnamese currency notation.
 * - ≥1B → "X.X tỷ"
 * - ≥1M → "XXX triệu"
 * - <1M → "XXX,000 đ"
 * Handles Prisma Decimal (comes as string in JSON).
 */
export function formatPriceVnd(price: number | string): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return "0 đ";

  if (num >= 1_000_000_000) {
    const ty = num / 1_000_000_000;
    return ty % 1 === 0 ? `${ty} tỷ` : `${ty.toFixed(1)} tỷ`;
  }

  if (num >= 1_000_000) {
    const trieu = num / 1_000_000;
    return trieu % 1 === 0 ? `${trieu} triệu` : `${trieu.toFixed(1)} triệu`;
  }

  return `${num.toLocaleString("vi-VN")} đ`;
}
