import 'server-only'

import { proxied } from '@/lib/img-proxy'
import { isWpConfigured } from './config'
import { wpFetch } from './client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageImages = {
  // Home – hero carousel
  heroAvatarImage: string
  heroSlide1: string
  heroSlide2: string
  heroSlide3: string
  heroSlide4: string
  heroSlide5: string
  // Home – fleet showcase panels
  fleetVehicle1: string
  fleetVehicle2: string
  fleetVehicle3: string
  fleetVehicle4: string
  // Home – services scenes
  serviceScene1: string
  serviceScene2: string
  serviceScene3: string
  // Inner-page hero backgrounds
  importHero: string
  productsHero: string
  blogHero: string
}

// ---------------------------------------------------------------------------
// Local fallbacks (used when WP is unconfigured or the field is still empty)
// ---------------------------------------------------------------------------

export const FALLBACK_PAGE_IMAGES: PageImages = {
  heroAvatarImage: '/images/hero-avatars.png',
  heroSlide1: '/images/hero-showroom.png',
  heroSlide2: '/images/truck-light.png',
  heroSlide3: '/images/van-light.png',
  heroSlide4: '/images/suv-light.png',
  heroSlide5: '/images/hero-truck.png',
  fleetVehicle1: '/images/fleet-van.png',
  fleetVehicle2: '/images/fleet-suv.png',
  fleetVehicle3: '/images/fleet-truck.png',
  fleetVehicle4: '/images/port-light.png',
  serviceScene1: '/images/scene-personal-import.png',
  serviceScene2: '/images/scene-direct-import.png',
  serviceScene3: '/images/scene-spare-parts.png',
  importHero: '/images/port-light.png',
  productsHero: '/images/hero-truck.png',
  blogHero: '/images/fleet-truck.png',
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const PAGE_IMAGES_QUERY = /* GraphQL */ `
  query AliFleetPageImages {
    pageImages {
      heroAvatarImage
      heroSlide1
      heroSlide2
      heroSlide3
      heroSlide4
      heroSlide5
      fleetVehicle1
      fleetVehicle2
      fleetVehicle3
      fleetVehicle4
      serviceScene1
      serviceScene2
      serviceScene3
      importHero
      productsHero
      blogHero
    }
  }
`

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

/**
 * Fetches editable page images from the WordPress CMS.
 *
 * Every field that comes back empty or on a fetch failure gracefully falls
 * back to the corresponding local `/images/*` static file so the UI is never
 * broken when the CMS is not yet configured or a field hasn't been filled in.
 *
 * Images from an http:// WordPress install are automatically routed through
 * the `/api/img` proxy so the browser never fires a mixed-content request.
 *
 * Cached for 10 minutes (CATALOG_REVALIDATE); a CMS change is reflected on
 * the next revalidation without a redeploy.
 */
export async function fetchPageImages(): Promise<PageImages> {
  if (!isWpConfigured()) {
    return FALLBACK_PAGE_IMAGES
  }

  try {
    const data = await wpFetch<{ pageImages: Partial<PageImages> }>(
      PAGE_IMAGES_QUERY,
      {},
      { revalidate: 600 },
    )

    const wp = data.pageImages ?? {}

    // For each key: use the WP value when non-empty (routing http:// through
    // the proxy), otherwise fall back to the local static image.
    return Object.fromEntries(
      (Object.keys(FALLBACK_PAGE_IMAGES) as (keyof PageImages)[]).map((key) => {
        const wpVal = wp[key]
        const resolved = wpVal ? proxied(wpVal) : FALLBACK_PAGE_IMAGES[key]
        return [key, resolved]
      }),
    ) as PageImages
  } catch {
    return FALLBACK_PAGE_IMAGES
  }
}
