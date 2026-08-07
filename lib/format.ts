import { fallbackSettings } from './site-config'

/**
 * Prices are always shown with Latin digits so part numbers and totals stay
 * scannable across all three locales.
 *
 * The currency symbol comes from WooCommerce at runtime, so it is passed in
 * rather than imported — components read it from `useStore()`. It falls back to
 * the shekel when the backend has not answered yet.
 */
export function formatPrice(
  value: number,
  currency: string = fallbackSettings.currency
) {
  // WooCommerce prices carry agorot/cents, so a part at 640.50 must not render
  // as "640.5". Whole amounts stay clean (3,180 rather than 3,180.00) because
  // most of the catalog is priced in round shekels.
  const hasFraction = Math.round(value * 100) % 100 !== 0
  return `${currency}${value.toLocaleString('en-US', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}
