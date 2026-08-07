'use client'

import { createContext, useContext } from 'react'
import { fallbackSettings, type StoreSettings } from '@/lib/site-config'

/**
 * Makes the WordPress store settings — phone, address, currency, cart URL —
 * available to client components.
 *
 * They are fetched once per request in the root layout on the server and passed
 * down, so no component fetches them itself and the first paint already has the
 * real contact details.
 */

const StoreContext = createContext<StoreSettings>(fallbackSettings)

export function StoreProvider({
  settings,
  children,
}: {
  settings: StoreSettings
  children: React.ReactNode
}) {
  return (
    <StoreContext.Provider value={settings}>{children}</StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
