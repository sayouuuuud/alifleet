'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  LOCALE_STORAGE_KEY,
  defaultLocale,
  isLocale,
  localeMeta,
  type Locale,
} from './config'
import { en, type Dictionary } from './dictionaries/en'
import { ar } from './dictionaries/ar'
import { he } from './dictionaries/he'

const dictionaries: Record<Locale, Dictionary> = { ar, en, he }

type LanguageContextValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: Dictionary
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLocale = defaultLocale,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  // Reconcile with the visitor's stored preference (covers cases where the
  // cookie was never written, e.g. first visit through a cached page).
  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored) && stored !== locale) setLocaleState(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep <html lang/dir> in sync so native text direction, fonts and
  // logical CSS properties all resolve correctly.
  useEffect(() => {
    const meta = localeMeta[locale]
    document.documentElement.lang = meta.htmlLang
    document.documentElement.dir = meta.dir
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: localeMeta[locale].dir,
      t: dictionaries[locale],
      setLocale,
    }),
    [locale, setLocale]
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside a LanguageProvider')
  return ctx
}

export { dictionaries }
