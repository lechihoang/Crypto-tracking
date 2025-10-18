/**
 * Format price by removing trailing zeros and unnecessary decimals
 * Examples:
 * 1.00000000 -> $1
 * 1.50000000 -> $1.5
 * 0.00012300 -> $0.000123
 * 12345.6789 -> $12,345.68
 */
export function formatPrice(price: number): string {
  if (price === 0) return '$0';

  // For very small numbers (< 0.01), show up to 8 significant decimals
  if (price < 0.01) {
    const formatted = price.toFixed(8);
    // Remove trailing zeros
    const withoutTrailingZeros = formatted.replace(/\.?0+$/, '');
    return `$${withoutTrailingZeros}`;
  }

  // For small numbers (< 1), show up to 4 decimals
  if (price < 1) {
    const formatted = price.toFixed(4);
    const withoutTrailingZeros = formatted.replace(/\.?0+$/, '');
    return `$${withoutTrailingZeros}`;
  }

  // For normal numbers, show up to 2 decimals with thousand separators
  const formatted = price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `$${formatted}`;
}

/**
 * Format market cap or volume (B, M, K abbreviations)
 */
export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    const formatted = (value / 1e12).toFixed(2).replace(/\.?0+$/, '');
    return `$${formatted}T`;
  }
  if (value >= 1e9) {
    const formatted = (value / 1e9).toFixed(2).replace(/\.?0+$/, '');
    return `$${formatted}B`;
  }
  if (value >= 1e6) {
    const formatted = (value / 1e6).toFixed(2).replace(/\.?0+$/, '');
    return `$${formatted}M`;
  }
  if (value >= 1e3) {
    const formatted = (value / 1e3).toFixed(2).replace(/\.?0+$/, '');
    return `$${formatted}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Format volume similar to market cap
 */
export function formatVolume(volume: number): string {
  return formatMarketCap(volume);
}

/**
 * Format percentage change
 */
export function formatPercentage(change: number): string {
  const formatted = Math.abs(change).toFixed(2).replace(/\.?0+$/, '');
  return `${change >= 0 ? '+' : '-'}${formatted}%`;
}

/**
 * Format number without currency symbol (for target prices in alerts)
 */
export function formatNumber(num: number): string {
  if (num === 0) return '0';

  if (num < 0.01) {
    return num.toFixed(8).replace(/\.?0+$/, '');
  }

  if (num < 1) {
    return num.toFixed(4).replace(/\.?0+$/, '');
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
