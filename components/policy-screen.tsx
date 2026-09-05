'use client'

import { useState, useEffect, useRef } from 'react'
import { Link } from '@/lib/i18n/link'
import { ShieldCheck, FileText, RefreshCcw, ArrowLeft, ArrowRight, Calendar, Printer } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { isLocale, localeMeta, type Locale } from '@/lib/i18n/config'
import type { MultilingualPolicy, PolicyPageData } from '@/lib/wp/policies'

type PolicyType = 'privacy' | 'terms' | 'return'

interface PolicyScreenProps {
  policyType: PolicyType
  policy: MultilingualPolicy
  initialLocale?: Locale
}

const uiCopy = {
  ar: {
    breadcrumbHome: 'الرئيسية',
    breadcrumbLegal: 'الوثائق القانونية',
    lastUpdated: 'آخر تحديث:',
    print: 'طباعة الوثيقة',
    needHelp: 'هل لديك استفسار حول هذه الوثيقة؟',
    contactSupport: 'تواصل مع فريق الدعم القانوني وخدمة العملاء في علي فليت.',
    contactBtn: 'تواصل معنا',
    languagesLabel: 'اللغة المعروضة:',
    contentUnavailable: 'المحتوى غير متوفر حالياً. يرجى المحاولة لاحقاً.',
    badges: {
      privacy: 'الخصوصية وحماية البيانات',
      terms: 'الشروط والأحكام العامة',
      return: 'سياسة الإرجاع والاستبدال',
    },
    defaultTitles: {
      privacy: 'سياسة الخصوصية',
      terms: 'الشروط والأحكام',
      return: 'سياسة الاسترجاع والاستبدال',
    },
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbLegal: 'Legal Documents',
    lastUpdated: 'Last updated:',
    print: 'Print Document',
    needHelp: 'Have questions regarding this document?',
    contactSupport: 'Reach out to the ALI FLEET customer care and legal support team.',
    contactBtn: 'Contact Us',
    languagesLabel: 'Document language:',
    contentUnavailable: 'Content is currently unavailable. Please try again later.',
    badges: {
      privacy: 'Privacy & Data Protection',
      terms: 'Terms & Conditions',
      return: 'Return & Exchange Policy',
    },
    defaultTitles: {
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      return: 'Return & Exchange Policy',
    },
  },
  he: {
    breadcrumbHome: 'דף הבית',
    breadcrumbLegal: 'מסמכים משפטיים',
    lastUpdated: 'עדכון אחרון:',
    print: 'הדפסת המסמך',
    needHelp: 'יש לכם שאלות בנוגע למסמך זה?',
    contactSupport: 'צרו קשר עם צוות התמיכה והשירות של עלי פליט.',
    contactBtn: 'יצירת קשר',
    languagesLabel: 'שפת המסמך:',
    contentUnavailable: 'התוכן אינו זמין כעת. אנא נסו שוב מאוחר יותר.',
    badges: {
      privacy: 'פרטיות והגנת מידע',
      terms: 'תנאים והגבלות',
      return: 'מדיניות החזרה והחלפה',
    },
    defaultTitles: {
      privacy: 'מדיניות הפרטיות',
      terms: 'תנאים והגבלות',
      return: 'מדיניות החזרה והחלפה',
    },
  },
} as const

const langTabs: { code: Locale; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
]

export function PolicyScreen({
  policyType,
  policy,
  initialLocale,
}: PolicyScreenProps) {
  const { locale, setLocale, dir } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const syncedInitialLocaleRef = useRef<string | undefined>(undefined)
  const hasLocaleParamRef = useRef<boolean>(false)
  const prevLocaleRef = useRef<Locale | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      hasLocaleParamRef.current = new URL(window.location.href).searchParams.has('locale')
    }
  }, [])

  useEffect(() => {
    if (
      initialLocale &&
      isLocale(initialLocale) &&
      syncedInitialLocaleRef.current !== initialLocale
    ) {
      syncedInitialLocaleRef.current = initialLocale
      if (locale !== initialLocale) {
        setLocale(initialLocale)
      }
    }
  }, [initialLocale, locale, setLocale])

  // Keep URL query param in sync when client switches language on policy page
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const isInitial = prevLocaleRef.current === undefined
      const localeChanged = !isInitial && prevLocaleRef.current !== locale
      prevLocaleRef.current = locale

      const url = new URL(window.location.href)

      if (hasLocaleParamRef.current || localeChanged) {
        hasLocaleParamRef.current = true
        if (url.searchParams.get('locale') !== locale) {
          url.searchParams.set('locale', locale)
          window.history.replaceState({}, '', url.toString())
        }
      }
    }
  }, [locale, mounted])

  // Support browser back/forward history navigation for policy locale
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search)
      const raw = currentParams.get('locale')
      const currentLocale = typeof raw === 'string' ? raw.trim().toLowerCase() : null
      if (isLocale(currentLocale) && currentLocale !== locale) {
        setLocale(currentLocale)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [locale, setLocale])

  const activeLocale: Locale =
    !mounted && initialLocale && isLocale(initialLocale)
      ? initialLocale
      : locale

  const copy = uiCopy[activeLocale] ?? uiCopy[locale]
  const currentDir = localeMeta[activeLocale]?.dir ?? dir
  const BackIcon = currentDir === 'rtl' ? ArrowRight : ArrowLeft

  // Resolve document based on active language, falling back to any available variant
  const activeDoc: PolicyPageData | null =
    policy[activeLocale] ?? policy[locale] ?? policy.en ?? policy.ar ?? policy.he

  const title = activeDoc?.title || copy.defaultTitles[policyType]
  const badge = copy.badges[policyType]

  const dateValue = activeDoc?.modified || activeDoc?.date
  let formattedDate: string | null = null
  if (dateValue) {
    try {
      formattedDate = new Intl.DateTimeFormat(
        activeLocale === 'ar' ? 'ar-EG' : activeLocale === 'he' ? 'he-IL' : 'en-GB',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      ).format(new Date(dateValue))
    } catch {
      formattedDate = null
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const IconComponent =
    policyType === 'privacy'
      ? ShieldCheck
      : policyType === 'terms'
        ? FileText
        : RefreshCcw

  return (
    <div className="min-h-screen bg-background pt-28 pb-20 md:pt-36" dir={currentDir}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <BackIcon className="size-3.5" aria-hidden="true" />
              {copy.breadcrumbHome}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{copy.breadcrumbLegal}</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-foreground">{title}</span>
          </nav>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs transition-colors hover:bg-secondary hover:text-foreground print:hidden"
          >
            <Printer className="size-3.5" aria-hidden="true" />
            <span>{copy.print}</span>
          </button>
        </div>

        {/* Page Header */}
        <header className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <IconComponent className="size-4" aria-hidden="true" />
                <span>{badge}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {title}
              </h1>
              {formattedDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  <span>
                    {copy.lastUpdated} {formattedDate}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Language Selector */}
            <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-secondary/50 p-3 sm:items-end print:hidden">
              <span className="text-[11px] font-medium text-muted-foreground">
                {copy.languagesLabel}
              </span>
              <div className="flex items-center gap-1.5" role="group" aria-label={copy.languagesLabel}>
                {langTabs.map((tab) => {
                  const isActive = activeLocale === tab.code
                  const hasContent = Boolean(policy[tab.code])
                  return (
                    <button
                      key={tab.code}
                      type="button"
                      disabled={!hasContent}
                      onClick={() => {
                        setLocale(tab.code)
                        if (typeof window !== 'undefined') {
                          const url = new URL(window.location.href)
                          url.searchParams.set('locale', tab.code)
                          window.history.replaceState({}, '', url.toString())
                        }
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-foreground text-background shadow-xs'
                          : hasContent
                            ? 'bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground'
                            : 'cursor-not-allowed opacity-40 text-muted-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Policy Content Card */}
        <article className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-10" dir={currentDir}>
          {activeDoc?.content ? (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed text-foreground/90
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mb-6
                [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:border-b [&_h2]:border-border/60 [&_h2]:pb-2
                [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground
                [&_p]:text-muted-foreground [&_p]:leading-loose [&_p]:mb-5
                [&_ol]:my-6 [&_ol]:ps-6 [&_ol]:space-y-3 [&_ol]:list-decimal [&_ol]:text-muted-foreground
                [&_ul]:my-6 [&_ul]:ps-6 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:text-muted-foreground
                [&_li]:leading-relaxed [&_li_strong]:text-foreground
                [&_strong]:text-foreground [&_strong]:font-semibold
                [&_a]:text-accent [&_a]:underline [&_a]:hover:text-accent/80"
              // Content is server-fetched from our authenticated WordPress CMS
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: activeDoc.content }}
            />
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>{copy.contentUnavailable}</p>
            </div>
          )}
        </article>

        {/* Need Help / Contact Banner */}
        <aside className="mt-10 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8 print:hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">
                {copy.needHelp}
              </h2>
              <p className="text-sm text-primary-foreground/75">
                {copy.contactSupport}
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              {copy.contactBtn}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
