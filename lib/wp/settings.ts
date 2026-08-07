import 'server-only'

import {
  fallbackSettings,
  telHref,
  type StoreSettings,
} from '@/lib/site-config'
import { CATALOG_REVALIDATE, isWpConfigured, wpStoreOrigin } from './config'
import { wpFetch } from './client'

/**
 * Reads contact details and commerce settings from WordPress.
 *
 * The `storeSettings` field is registered by our own mu-plugin, so an older
 * copy of the plugin on the server means the query fails with
 * `Cannot query field "storeSettings"`. That must never blank out the footer,
 * so every failure falls back to `fallbackSettings`.
 */

const SETTINGS_QUERY = /* GraphQL */ `
  query AliFleetStoreSettings {
    generalSettings {
      title
    }
    storeSettings {
      phone
      whatsapp
      email
      addressLines
      hours
      instagram
      facebook
      linkedin
      currencyCode
      currencySymbol
      storeUrl
      cartPath
    }
  }
`

type WireSettings = {
  generalSettings: { title: string | null } | null
  storeSettings: {
    phone: string | null
    whatsapp: string | null
    email: string | null
    addressLines: (string | null)[] | null
    hours: string | null
    instagram: string | null
    facebook: string | null
    linkedin: string | null
    currencyCode: string | null
    currencySymbol: string | null
    storeUrl: string | null
    cartPath: string | null
  } | null
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!isWpConfigured()) return fallbackSettings

  let data: WireSettings
  try {
    data = await wpFetch<WireSettings>(
      SETTINGS_QUERY,
      {},
      { revalidate: CATALOG_REVALIDATE }
    )
  } catch (error) {
    console.log(
      '[v0] storeSettings unavailable — using fallback contact details:',
      error instanceof Error ? error.message : error
    )
    return fallbackSettings
  }

  const wire = data.storeSettings
  if (!wire) return fallbackSettings

  const phone = text(wire.phone)
  // The endpoint host is the safest default for the cart hand-off: it is the
  // WordPress that actually owns the WooCommerce session.
  const baseUrl = text(wire.storeUrl) || wpStoreOrigin()

  return {
    name: text(data.generalSettings?.title) || fallbackSettings.name,
    phone,
    phoneHref: telHref(phone),
    whatsapp: text(wire.whatsapp).replace(/\D+/g, ''),
    email: text(wire.email),
    addressLines: (wire.addressLines ?? [])
      .map((line) => text(line))
      .filter((line) => line.length > 0),
    hours: text(wire.hours),
    social: {
      instagram: text(wire.instagram),
      facebook: text(wire.facebook),
      linkedin: text(wire.linkedin),
    },
    currency: text(wire.currencySymbol) || fallbackSettings.currency,
    wordpress: {
      baseUrl: baseUrl.replace(/\/+$/, ''),
      cartPath: normalisePath(text(wire.cartPath)),
    },
  }
}

function text(value: string | null | undefined): string {
  return (value ?? '').trim()
}

/** Guarantees a leading and trailing slash so URL joining stays predictable. */
function normalisePath(value: string): string {
  if (!value) return fallbackSettings.wordpress.cartPath
  const withLeading = value.startsWith('/') ? value : `/${value}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}
