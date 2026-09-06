export const locales = ['ar', 'en', 'he'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'he'

export const localeMeta: Record<
  Locale,
  { label: string; short: string; dir: 'rtl' | 'ltr'; htmlLang: string }
> = {
  ar: { label: 'العربية', short: 'ع', dir: 'rtl', htmlLang: 'ar' },
  en: { label: 'English', short: 'EN', dir: 'ltr', htmlLang: 'en' },
  he: { label: 'עברית', short: 'עב', dir: 'rtl', htmlLang: 'he' },
}

export const LOCALE_STORAGE_KEY = 'alifleet-locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export function getLocalizedPath(baseSlug: string, locale: string): string {
  // 1. Hebrew homepage -> /
  if (locale === 'he' && baseSlug === 'home') return '/'
  
  // 2. Hebrew other pages -> /{slug}/
  if (locale === 'he') return `/${baseSlug}/`
  
  // 3. English/Arabic pages -> /{locale}/{slug}-{locale}/
  return `/${locale}/${baseSlug}-${locale}/`
}
