import 'server-only'

import { isWpConfigured, wpEndpoint } from './config'
import { WpError, classifyWpErrors } from './errors'

type GraphQLResponse<T> = {
  data?: T | null
  errors?: {
    message: string
    extensions?: { category?: string; code?: string }
  }[]
}

/**
 * Single low-level entry point for every WordPress call.
 *
 * Runs server-side only: the JWT never reaches the browser, so it is read from
 * an httpOnly cookie by the caller and injected here as an Authorization
 * header. Never import this from a client component.
 */
export async function wpFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: { authToken?: string | null; revalidate?: number } = {}
): Promise<T> {
  if (!isWpConfigured()) {
    throw new WpError('not_configured', ['WORDPRESS_GRAPHQL_ENDPOINT is not set'])
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`
  }

  // Account data is per-user and must never be shared between visitors, so it
  // stays uncached. Public catalog data opts in to the Next.js data cache by
  // passing `revalidate`, which keeps a 165-product storefront off the
  // WordPress box on every single request.
  const caching: Pick<RequestInit, 'cache'> & { next?: { revalidate: number } } =
    typeof options.revalidate === 'number'
      ? { next: { revalidate: options.revalidate } }
      : { cache: 'no-store' }

  let response: Response
  try {
    response = await fetch(wpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      ...caching,
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    console.log('[v0] WordPress request failed to reach the endpoint:', error)
    throw new WpError('network', [
      error instanceof Error ? error.message : 'fetch failed',
    ])
  }

  // A WordPress that is up but misconfigured often replies with an HTML error
  // page, which would blow up `response.json()` with a confusing parse error.
  const raw = await response.text()
  let payload: GraphQLResponse<T>
  try {
    payload = JSON.parse(raw) as GraphQLResponse<T>
  } catch {
    console.log(
      '[v0] WordPress returned a non-JSON response:',
      response.status,
      raw.slice(0, 200)
    )
    throw new WpError('network', [
      `HTTP ${response.status} returned a non-JSON body`,
    ])
  }

  if (payload.errors?.length) {
    const messages = payload.errors.map((e) => e.message)
    const codes = payload.errors
      .map((e) => e.extensions?.code ?? '')
      .filter(Boolean)
    console.log('[v0] WordPress GraphQL errors:', messages)
    throw new WpError(classifyWpErrors([...messages, ...codes]), messages)
  }

  if (!response.ok) {
    throw new WpError('network', [`HTTP ${response.status}`])
  }

  if (!payload.data) {
    throw new WpError('unknown', ['GraphQL response contained no data'])
  }

  return payload.data
}
