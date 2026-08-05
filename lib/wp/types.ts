import type { AuthErrorCode } from './errors'

/** The signed-in WordPress user, as exposed to client components. */
export type Viewer = {
  databaseId: number
  username: string
  email: string
  firstName: string
  lastName: string
  name: string
  registeredDate: string | null
}

export type WpAddress = {
  firstName: string
  lastName: string
  company: string
  address1: string
  address2: string
  city: string
  state: string
  postcode: string
  country: string
  phone: string
  email?: string
}

export type OrderLine = {
  name: string
  slug: string | null
  quantity: number
  total: string
}

/** WooCommerce order statuses, lowercased for dictionary lookups. */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'onhold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'checkoutdraft'

export type CustomerOrder = {
  databaseId: number
  orderNumber: string
  date: string | null
  status: OrderStatus
  total: string
  subtotal: string
  totalTax: string
  shippingTotal: string
  paymentMethodTitle: string
  lines: OrderLine[]
}

export type Customer = {
  databaseId: number
  email: string
  firstName: string
  lastName: string
  displayName: string
  date: string | null
  billing: WpAddress
  shipping: WpAddress
  orders: CustomerOrder[]
}

/**
 * What every account page receives. Because the WordPress backend is not wired
 * up yet, a page can legitimately have no data and still need to render — so
 * the payload is explicit about *why* it is empty.
 */
export type AccountData =
  | { state: 'ready'; customer: Customer; viewer: Viewer }
  | { state: 'error'; code: AuthErrorCode }

/** Uniform return shape for every auth server action, consumed by useActionState. */
export type AuthActionState = {
  status: 'idle' | 'success' | 'error'
  /** Translatable error code — the client renders t.account.errors[code]. */
  code?: AuthErrorCode
  /** Per-field translatable codes for inline validation messages. */
  fieldErrors?: Partial<Record<string, AuthErrorCode>>
}

export const idleActionState: AuthActionState = { status: 'idle' }

const EMPTY_ADDRESS: WpAddress = {
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postcode: '',
  country: '',
  phone: '',
}

export function emptyAddress(): WpAddress {
  return { ...EMPTY_ADDRESS }
}

/** Normalises a possibly-null WPGraphQL address object into a full record. */
export function normalizeAddress(input: unknown): WpAddress {
  const source = (input ?? {}) as Record<string, unknown>
  const str = (key: string) =>
    typeof source[key] === 'string' ? (source[key] as string) : ''
  return {
    firstName: str('firstName'),
    lastName: str('lastName'),
    company: str('company'),
    address1: str('address1'),
    address2: str('address2'),
    city: str('city'),
    state: str('state'),
    postcode: str('postcode'),
    country: str('country'),
    phone: str('phone'),
    email: str('email') || undefined,
  }
}

/** WooCommerce sends statuses in mixed case (e.g. `ON_HOLD`, `CHECKOUT_DRAFT`). */
export function normalizeStatus(input: unknown): OrderStatus {
  const value = String(input ?? '')
    .toLowerCase()
    .replace(/[_\s-]/g, '')
  const known: OrderStatus[] = [
    'pending',
    'processing',
    'onhold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
    'checkoutdraft',
  ]
  return (known as string[]).includes(value) ? (value as OrderStatus) : 'pending'
}
