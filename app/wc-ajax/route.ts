import { proxyWcAjaxRequest } from '@/lib/checkout/proxy'

/**
 * WooCommerce's own AJAX transport, proxied onto this origin.
 *
 * checkout.js posts every order to `/?wc-ajax=checkout` with the customer's
 * WooCommerce cookies. Served from the storefront that path resolves to the
 * Next.js home page, so the call silently fails and the checkout form falls
 * back to a plain cross-origin POST. The HTML rewriter points those endpoints
 * here instead.
 */
async function handler(request: Request) {
  return proxyWcAjaxRequest(request)
}

export const GET = handler
export const POST = handler
export const HEAD = handler
