import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/seo'
import { locales } from '@/lib/i18n/config'
import { toPublicPathname } from '@/lib/i18n/routing'
import { getCatalog } from '@/lib/wp/catalog'
import { getPosts } from '@/lib/wp/posts'
import { getSaleCars } from '@/lib/wp/sale-cars'
import { getVehicles } from '@/lib/wp/vehicles'

/**
 * Public URLs keep the trailing slash that toPublicPathname makes canonical
 * (`/products/`, `/ar/products-ar/`). absoluteUrl() strips it, and a slash-less
 * URL is exactly what the locale proxy redirects, so the sitemap must not
 * hand search engines the redirected form.
 */
function canonicalUrl(publicPathname: string): string {
  return `${siteUrl()}${publicPathname}`
}

/**
 * Sitemap for the storefront.
 *
 * The static routes are listed by hand; everything else is read live from
 * WordPress, so a product or article published in the CMS enters the sitemap
 * on the next revalidation without a code change.
 *
 * Each WordPress read is guarded: a CMS outage must degrade the sitemap to its
 * static routes rather than fail the whole response, because a 500 here tells
 * search engines the site is broken.
 */
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Entry['changeFrequency'] }[] =
  [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/cars', priority: 0.9, changeFrequency: 'daily' },
    { path: '/products', priority: 0.9, changeFrequency: 'daily' },
    { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  ]

async function safe<T>(load: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await load()
  } catch (error) {
    console.error(`[alifleet] sitemap: ${label} unavailable`, error)
    return fallback
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const [catalog, posts, vehicles, saleCars] = await Promise.all([
    safe(getCatalog, { parts: [], status: 'not_configured' as const, hasUntranslated: false }, 'catalog'),
    safe(getPosts, { posts: [], featured: null, status: 'not_configured' as const }, 'posts'),
    safe(getVehicles, { cars: [], status: 'not_configured' as const }, 'vehicles'),
    safe(getSaleCars, { cars: [], status: 'not_configured' as const }, 'sale cars'),
  ])

  const entries: Entry[] = []
  const addLocalized = (path: string, details: Omit<Entry, 'url'>) => {
    for (const locale of locales) {
      entries.push({
        url: canonicalUrl(toPublicPathname(path, locale)),
        ...details,
      })
    }
  }

  for (const route of STATIC_ROUTES) {
    addLocalized(route.path, {
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })
  }

  for (const part of catalog.parts) {
    if (!part.slug) continue
    addLocalized(`/products/${part.slug}`, {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const car of vehicles.cars) {
    if (!car.slug) continue
    addLocalized(`/cars/import/${car.slug}`, {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const car of saleCars.cars) {
    if (!car.slug) continue
    addLocalized(`/cars/sale/${car.slug}`, {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const post of posts.posts) {
    if (!post.slug) continue
    addLocalized(`/blog/${post.slug}`, {
      // Articles carry a real publication date; using it lets crawlers tell a
      // fresh post from an old one instead of seeing every URL as "just now".
      lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return entries
}
