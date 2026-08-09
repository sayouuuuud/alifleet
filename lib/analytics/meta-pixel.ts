/**
 * Meta (Facebook) Pixel helpers.
 *
 * The pixel id lives in an env var so it can be swapped per environment, with
 * the production id as a fallback so the tag keeps working without extra setup.
 */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1422327476388484'

type FbqArgs = [string, ...unknown[]]

declare global {
  interface Window {
    fbq?: ((...args: FbqArgs) => void) & {
      callMethod?: (...args: FbqArgs) => void
      queue?: FbqArgs[]
      loaded?: boolean
      version?: string
    }
    _fbq?: Window['fbq']
  }
}

/** Standard Meta events we use across the store. */
export type MetaStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'Contact'
  | 'CompleteRegistration'
  | 'Search'

/**
 * Track a standard Meta event. Safe to call anywhere on the client — it no-ops
 * on the server or before the pixel script has loaded.
 */
export function trackMetaEvent(
  event: MetaStandardEvent,
  params?: Record<string, unknown>
) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', event, params)
}

/** Track a custom (non-standard) Meta event. */
export function trackMetaCustomEvent(
  event: string,
  params?: Record<string, unknown>
) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('trackCustom', event, params)
}
