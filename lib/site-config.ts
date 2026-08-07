/**
 * Contact details, external links and commerce settings.
 *
 * The live values come from WordPress via the `storeSettings` GraphQL field
 * (see `lib/wp/settings.ts` and section 6 of `wordpress/mu-plugin/alifleet-cms.php`),
 * so the shop owner maintains them in WooCommerce → Settings rather than here.
 *
 * What stays in this file is the fallback used before the backend is connected
 * and whenever it cannot be reached — the site must still render a footer.
 */

export type StoreSettings = {
  name: string
  phone: string
  phoneHref: string
  /** Digits only, ready for a wa.me link. */
  whatsapp: string
  email: string
  addressLines: string[]
  hours: string
  social: { instagram: string; facebook: string; linkedin: string }
  currency: string
  wordpress: { baseUrl: string; cartPath: string }
}

/**
 * Deliberately empty contact fields rather than invented ones: a fake phone
 * number that looks real is worse than no phone number, because it ships to
 * production without anyone noticing.
 */
export const fallbackSettings: StoreSettings = {
  name: 'ALI FLEET',
  phone: '',
  phoneHref: '',
  whatsapp: '',
  email: '',
  addressLines: [],
  hours: '',
  social: { instagram: '', facebook: '', linkedin: '' },
  currency: '₪',
  wordpress: { baseUrl: '', cartPath: '/cart/' },
}

/**
 * @deprecated Reads the fallback only. Client components should take settings
 * from `useStore()` so they get the live WordPress values; this export exists
 * for modules that run before any request context is available.
 */
export const siteConfig = fallbackSettings

/** Builds a phone `tel:` href from a display number. */
export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

/**
 * Builds a prefilled WhatsApp deep link, or an empty string when no number is
 * configured — callers hide the button in that case rather than linking to a
 * broken wa.me URL.
 */
export function whatsappLink(message: string, whatsapp: string) {
  if (!whatsapp) return ''
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
}

/**
 * Hands the cart off to WooCommerce using its bulk add-to-cart query syntax,
 * where each entry is `productId:quantity`.
 *
 * `channel=online_store` keeps a store that still has coming-soon mode enabled
 * from bouncing the customer to a password screen.
 */
export function wordpressCheckoutUrl(
  items: { wooId: number; quantity: number }[],
  store: Pick<StoreSettings, 'wordpress'>
) {
  const { baseUrl, cartPath } = store.wordpress
  if (!baseUrl || items.length === 0) return ''

  const list = items
    .filter((item) => item.wooId > 0 && item.quantity > 0)
    .map((item) => `${item.wooId}:${item.quantity}`)
    .join(',')

  if (!list) return ''
  return `${baseUrl}${cartPath}?add-to-cart=${list}&channel=online_store`
}
