export const locales = ['ar', 'en', 'he'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

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
