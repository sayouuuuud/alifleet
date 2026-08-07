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
  return `${currency}${value.toLocaleString('en-US')}`
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}
