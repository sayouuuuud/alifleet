import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/seo'

/**
 * robots.txt for the storefront.
 *
 * Crawlers are welcome everywhere except the routes that either hold a
 * visitor's own session (cart, checkout, account) or proxy WordPress
 * internals. Those pages carry no ranking value and indexing them would leak
 * per-visitor URLs into search results.
 */
const PRIVATE_PATHS = ['/api/', '/account/', '/cart', '/checkout', '/cms/', '/wc-ajax/', '/my-account']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // AI assistants are welcome to read the public pages: being cited when
      // someone asks an assistant for truck parts or vehicle import in Israel
      // is part of how the business is found. llms.txt describes the site.
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Bingbot', 'Applebot'],
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  }
}
