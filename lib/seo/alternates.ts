import type { Metadata } from 'next'

import { defaultLocale, locales, type Locale } from '@/lib/i18n/config'
import { toPublicPathname } from '@/lib/i18n/routing'

/**
 * hreflang map for one internal route. Each language points at its own public
 * URL (`/products/` for Hebrew, `/ar/products-ar/`, `/en/products-en/`), and
 * `x-default` follows the default locale so search engines pick Hebrew when no
 * language matches. Paths are relative; `metadataBase` in app/layout.tsx makes
 * them absolute.
 */
export function languageAlternates(internalPathname: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of locales) {
    languages[locale] = toPublicPathname(internalPathname, locale)
  }
  languages['x-default'] = toPublicPathname(internalPathname, defaultLocale)
  return languages
}

/**
 * `alternates` block for generateMetadata: canonical = this language's own
 * public URL, plus the hreflang set above.
 */
export function pageAlternates(
  internalPathname: string,
  locale: Locale
): NonNullable<Metadata['alternates']> & { canonical: string } {
  return {
    canonical: toPublicPathname(internalPathname, locale),
    languages: languageAlternates(internalPathname),
  }
}
