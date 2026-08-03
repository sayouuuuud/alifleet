/**
 * Single source of truth for contact details, external links and commerce
 * settings. Swap these placeholders for the real values (and the real
 * WordPress/WooCommerce store URL) when the backend is wired up.
 */
export const siteConfig = {
  name: 'ALI FLEET',
  phone: '+972 50 000 0000',
  phoneHref: 'tel:+972500000000',
  whatsapp: '972500000000',
  email: 'info@alifleet.com',
  addressLines: ['Industrial Zone, Building 12', 'Haifa, Israel'],
  hours: 'Sun – Thu: 08:00 – 18:00',
  social: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    linkedin: 'https://linkedin.com',
  },
  currency: '₪',
  /**
   * WooCommerce/WordPress storefront. Cart contents are handed off to this
   * endpoint so checkout, payment and orders stay inside WordPress.
   * WooCommerce accepts `?add-to-cart=<id>` or the bulk `/cart/?add-to-cart=1:2,5:1` form.
   */
  wordpress: {
    baseUrl: 'https://store.alifleet.com',
    cartPath: '/cart/',
  },
} as const

/** Builds a prefilled WhatsApp deep link. */
export function whatsappLink(message: string) {
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`
}

/**
 * Hands the cart off to WooCommerce using its bulk add-to-cart query syntax.
 * Each entry is `productId:quantity`.
 */
export function wordpressCheckoutUrl(
  items: { wooId: number; quantity: number }[]
) {
  const { baseUrl, cartPath } = siteConfig.wordpress
  const list = items.map((i) => `${i.wooId}:${i.quantity}`).join(',')
  return `${baseUrl}${cartPath}?add-to-cart=${list}`
}
