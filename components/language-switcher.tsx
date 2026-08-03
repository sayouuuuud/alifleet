'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { locales, localeMeta } from '@/lib/i18n/config'
import { useLanguage } from '@/lib/i18n/language-context'

export function LanguageSwitcher({ variant = 'pill' }: { variant?: 'pill' | 'block' }) {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (variant === 'block') {
    return (
      <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
        {locales.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-current={code === locale ? 'true' : undefined}
            className={
              code === locale
                ? 'flex-1 rounded-full bg-foreground px-3 py-2 text-sm font-semibold text-background'
                : 'flex-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            {localeMeta[code].label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
        className="flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Globe className="size-4" aria-hidden="true" />
        <span>{localeMeta[locale].short}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.nav.language}
          className="absolute end-0 top-full z-50 mt-2 min-w-40 overflow-hidden rounded-2xl bg-card p-1.5 shadow-xl shadow-foreground/10 ring-1 ring-border"
        >
          {locales.map((code) => (
            <li key={code} role="none">
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                onClick={() => {
                  setLocale(code)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <span>{localeMeta[code].label}</span>
                {code === locale && (
                  <Check className="size-4 text-accent" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
