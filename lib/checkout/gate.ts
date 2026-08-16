/**
 * Keeps the proxied WooCommerce basket honest about what the storefront is
 * actually showing.
 *
 * The Next.js cart lives in localStorage and is the source of truth, but the
 * WooCommerce basket only ever gets *written* during the checkout handoff. That
 * asymmetry meant a WooCommerce session outlived the local cart: emptying the
 * cart cleared the storefront while WordPress still held the previous item, so
 * opening /checkout directly rendered a stale product and total that the
 * customer had already removed (QA-10).
 *
 * A server component cannot read localStorage, so the client mirrors its total
 * quantity into a readable cookie and the handoff records the quantity it
 * actually pushed. /checkout is only served when the two agree and describe a
 * non-empty basket; anything else means the WooCommerce session is stale.
 */

/** localStorage key holding the storefront cart. */
export const CART_STORAGE_KEY = 'alifleet-cart'

/** Total quantity currently held by the client cart. Written in the browser. */
export const CART_QUANTITY_COOKIE = 'alifleet-cart-quantity'

/** Total quantity the last handoff pushed into WooCommerce. httpOnly. */
export const HANDOFF_QUANTITY_COOKIE = 'alifleet-checkout-quantity'

/** WooCommerce session and basket cookies proxied on the storefront origin. */
export function isWooStateCookie(name: string) {
  return (
    name === 'woocommerce_cart_hash' ||
    name === 'woocommerce_items_in_cart' ||
    name.startsWith('wp_woocommerce_session_') ||
    name.startsWith('woocommerce_')
  )
}

function readQuantity(value: string | undefined) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

/**
 * Decides whether the proxied WooCommerce basket may be shown. `null` inputs
 * mean the cookie was absent, which is treated as "cannot prove it is fresh".
 */
export function isHandoffFresh(cartCookie?: string, handoffCookie?: string) {
  const cart = readQuantity(cartCookie)
  const handoff = readQuantity(handoffCookie)
  if (cart === null || handoff === null) return false
  // An empty storefront cart can never justify a populated checkout, and a
  // quantity change since the handoff means WooCommerce is out of date.
  return cart > 0 && cart === handoff
}

/**
 * `order-received` is reached *after* WooCommerce has emptied the basket, so it
 * must stay viewable even though the freshness check can no longer pass.
 */
export function isOrderReceivedPath(segments: string[]) {
  return segments.includes('order-received')
}
