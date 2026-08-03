import { siteConfig } from './site-config'

/**
 * Prices are always shown with Latin digits so part numbers and totals stay
 * scannable across all three locales.
 */
export function formatPrice(value: number) {
  return `${siteConfig.currency}${value.toLocaleString('en-US')}`
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}
