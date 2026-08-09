/**
 * WordPress / WooCommerce backend wiring.
 *
 * Everything account-related talks to WordPress through a single WPGraphQL
 * endpoint. That endpoint does not exist yet, so instead of hard-coding a
 * hostname and failing with opaque network errors, the whole account system
 * reads its address from an environment variable and reports a clean
 * "backend not connected" state until it is set.
 *
 * To go live, set `WORDPRESS_GRAPHQL_ENDPOINT` to the full GraphQL URL, e.g.
 *   WORDPRESS_GRAPHQL_ENDPOINT=https://store.alifleet.com/graphql
 *
 * Required WordPress plugins:
 *   - WPGraphQL
 *   - WPGraphQL JWT Authentication  (login / refreshJwtAuthToken)
 *   - WooGraphQL (WPGraphQL for WooCommerce)  (customer / orders)
 *
 * WPGraphQL JWT Authentication also needs a signing secret in wp-config.php:
 *   define( 'GRAPHQL_JWT_AUTH_SECRET_KEY', '<a long random string>' );
 */

const RAW_ENDPOINT = (process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? '').trim()

/** The configured GraphQL endpoint, or an empty string when unset. */
export const wpEndpoint = RAW_ENDPOINT

/**
 * Whether the WordPress backend is reachable in principle. Every entry point
 * checks this first so the UI can explain itself rather than throw.
 */
export function isWpConfigured(): boolean {
  return RAW_ENDPOINT.length > 0
}

/**
 * The storefront origin, derived from the GraphQL endpoint so there is only one
 * hostname to configure. `https://cms.alifleet.com/graphql` yields
 * `https://cms.alifleet.com`. Override with `WORDPRESS_STORE_URL` when the shop
 * front lives on a different host than the API.
 */
export function wpStoreOrigin(): string {
  const override = (process.env.WORDPRESS_STORE_URL ?? '').trim()
  if (override) return override.replace(/\/+$/, '')
  if (!RAW_ENDPOINT) return ''
  try {
    return new URL(RAW_ENDPOINT).origin
  } catch {
    return ''
  }
}

/** How long cached catalog reads stay fresh, in seconds. */
export const CATALOG_REVALIDATE = 600

/**
 * Cache tag carried by every cached WordPress read.
 *
 * `CATALOG_REVALIDATE` alone means an editor waits up to ten minutes to see a
 * change, with no way to hurry it along. Tagging the reads gives WordPress a
 * way to purge them the moment content is saved (see `app/api/revalidate`),
 * which turns the ten minutes into a ceiling for when nothing pings us rather
 * than the normal wait.
 *
 * It is deliberately a single shared tag instead of one per content type: the
 * ping arrives from a `save_post` hook that knows the post type but not which
 * of our queries happened to embed it — a sale car shows up in the cars list,
 * the sitemap and the home page. One tag cannot drift out of sync with the
 * queries the way a hand-maintained mapping would.
 */
export const WP_CACHE_TAG = 'wp-content'

/**
 * Shared secret the revalidate webhook requires. Unset means the webhook is
 * disabled and refuses every call, which is the correct default: an open purge
 * endpoint lets anyone dump our cache and hammer the WordPress box.
 */
export function wpRevalidateSecret(): string {
  return (process.env.WORDPRESS_REVALIDATE_SECRET ?? '').trim()
}

/** How long we keep the short-lived JWT access token in its cookie. */
export const AUTH_TOKEN_MAX_AGE = 60 * 60 // 1 hour

/** How long the refresh token stays valid — this is the real session length. */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
