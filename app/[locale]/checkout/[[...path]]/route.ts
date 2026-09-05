import { cookies } from 'next/headers'
import { proxyWooRequest } from '@/lib/checkout/proxy'
import {
  CART_QUANTITY_COOKIE,
  HANDOFF_QUANTITY_COOKIE,
  isHandoffFresh,
  isOrderReceivedPath,
  isWooStateCookie,
} from '@/lib/checkout/gate'

type Context = { params: Promise<{ path?: string[] }> }

async function handler(request: Request, context: Context) {
  const { path = [] } = await context.params
  const segments = ['checkout', ...path]

  // Submissions and the post-purchase confirmation must pass straight through:
  // WooCommerce empties the basket while placing the order, so the freshness
  // check below can no longer hold by the time order-received is rendered.
  const method = request.method.toUpperCase()
  const bypass =
    method === 'POST' || method === 'OPTIONS' || isOrderReceivedPath(segments)

  if (!bypass) {
    const cookieStore = await cookies()
    const fresh = isHandoffFresh(
      cookieStore.get(CART_QUANTITY_COOKIE)?.value,
      cookieStore.get(HANDOFF_QUANTITY_COOKIE)?.value
    )

    if (!fresh) {
      // The WooCommerce session no longer matches the storefront basket —
      // typically the cart was emptied or edited after the handoff. Serving it
      // would show a product the customer had already removed (QA-10), so drop
      // the stale session and send them back to the cart.
      for (const { name } of cookieStore.getAll()) {
        if (isWooStateCookie(name)) cookieStore.delete(name)
      }
      cookieStore.delete(HANDOFF_QUANTITY_COOKIE)

      return new Response(null, {
        status: 303,
        headers: { location: '/cart?checkout=expired' },
      })
    }
  }

  return proxyWooRequest(request, segments)
}

export const GET = handler
export const POST = handler
export const HEAD = handler
export const OPTIONS = handler
