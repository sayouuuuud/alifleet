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

/** How long we keep the short-lived JWT access token in its cookie. */
export const AUTH_TOKEN_MAX_AGE = 60 * 60 // 1 hour

/** How long the refresh token stays valid — this is the real session length. */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
