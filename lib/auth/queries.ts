import 'server-only'

import { wpFetch } from '@/lib/wp/client'
import { CUSTOMER_WITH_ORDERS, VIEWER } from '@/lib/wp/operations'
import { WpError } from '@/lib/wp/errors'
import { isWpConfigured } from '@/lib/wp/config'
import {
  normalizeAddress,
  normalizeStatus,
  type AccountData,
  type Customer,
  type Viewer,
} from '@/lib/wp/types'
import { getAuthToken } from './session'

/**
 * Loads everything the account area needs. Returns a tagged result instead of
 * throwing so each page can render a translated explanation — the backend is
 * not connected yet, and that must not look like a crash.
 */
export async function loadAccount(orderLimit = 20): Promise<AccountData> {
  if (!isWpConfigured()) return { state: 'error', code: 'not_configured' }

  try {
    const authToken = await getAuthToken()
    if (!authToken) return { state: 'error', code: 'not_logged_in' }

    const [viewerData, customerData] = await Promise.all([
      wpFetch<{ viewer: Record<string, unknown> | null }>(VIEWER, {}, { authToken }),
      wpFetch<{ customer: Record<string, unknown> | null }>(
        CUSTOMER_WITH_ORDERS,
        { first: orderLimit },
        { authToken }
      ),
    ])

    const rawViewer = viewerData.viewer
    if (!rawViewer) return { state: 'error', code: 'not_logged_in' }

    const viewer: Viewer = {
      databaseId: Number(rawViewer.databaseId ?? 0),
      username: String(rawViewer.username ?? ''),
      email: String(rawViewer.email ?? ''),
      firstName: String(rawViewer.firstName ?? ''),
      lastName: String(rawViewer.lastName ?? ''),
      name: String(rawViewer.name ?? ''),
      registeredDate: rawViewer.registeredDate
        ? String(rawViewer.registeredDate)
        : null,
    }

    const customer = mapCustomer(customerData.customer, viewer)
    return { state: 'ready', customer, viewer }
  } catch (error) {
    const code = error instanceof WpError ? error.code : 'unknown'
    if (!(error instanceof WpError)) {
      console.log('[v0] Unexpected error loading account:', error)
    }
    return { state: 'error', code }
  }
}

/**
 * Cheap session probe for the shared layout: resolves just enough to render the
 * header's signed-in state, without touching WooCommerce or order history.
 * Returns null whenever nobody is signed in or the backend is unavailable.
 */
export async function loadViewer(): Promise<Viewer | null> {
  if (!isWpConfigured()) return null

  try {
    const authToken = await getAuthToken()
    if (!authToken) return null

    const { viewer } = await wpFetch<{ viewer: Record<string, unknown> | null }>(
      VIEWER,
      {},
      { authToken }
    )
    if (!viewer) return null

    return {
      databaseId: Number(viewer.databaseId ?? 0),
      username: String(viewer.username ?? ''),
      email: String(viewer.email ?? ''),
      firstName: String(viewer.firstName ?? ''),
      lastName: String(viewer.lastName ?? ''),
      name: String(viewer.name ?? ''),
      registeredDate: viewer.registeredDate
        ? String(viewer.registeredDate)
        : null,
    }
  } catch {
    // A dead or half-configured backend must never break page rendering.
    return null
  }
}

/**
 * Falls back to the WordPress user when WooCommerce has no customer record yet
 * (a brand-new account that has never checked out).
 */
function mapCustomer(
  raw: Record<string, unknown> | null,
  viewer: Viewer
): Customer {
  const source = raw ?? {}
  const orderNodes =
    ((source.orders as { nodes?: unknown[] } | undefined)?.nodes ?? []) as Record<
      string,
      unknown
    >[]

  return {
    databaseId: Number(source.databaseId ?? viewer.databaseId),
    email: String(source.email ?? viewer.email),
    firstName: String(source.firstName ?? viewer.firstName),
    lastName: String(source.lastName ?? viewer.lastName),
    displayName: String(source.displayName ?? viewer.name),
    date: source.date ? String(source.date) : viewer.registeredDate,
    billing: normalizeAddress(source.billing),
    shipping: normalizeAddress(source.shipping),
    orders: orderNodes.map((node) => {
      const lineNodes =
        ((node.lineItems as { nodes?: unknown[] } | undefined)?.nodes ??
          []) as Record<string, unknown>[]
      return {
        databaseId: Number(node.databaseId ?? 0),
        orderNumber: String(node.orderNumber ?? node.databaseId ?? ''),
        date: node.date ? String(node.date) : null,
        status: normalizeStatus(node.status),
        total: String(node.total ?? ''),
        subtotal: String(node.subtotal ?? ''),
        totalTax: String(node.totalTax ?? ''),
        shippingTotal: String(node.shippingTotal ?? ''),
        paymentMethodTitle: String(node.paymentMethodTitle ?? ''),
        lines: lineNodes.map((line) => {
          const product = (line.product as { node?: Record<string, unknown> })
            ?.node
          return {
            name: String(product?.name ?? ''),
            slug: product?.slug ? String(product.slug) : null,
            quantity: Number(line.quantity ?? 0),
            total: String(line.total ?? ''),
          }
        }),
      }
    }),
  }
}
