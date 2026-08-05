'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/auth/auth-context'
import { logoutAction } from '@/lib/auth/actions'

/**
 * Header entry point for the account area.
 *
 * Signed out (or no backend yet) it is a plain "Sign in" link, so the control
 * never dead-ends. Signed in it opens a small menu with the account sections.
 */
export function AccountMenu() {
  const { t } = useLanguage()
  const { signedIn, displayName } = useAuth()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close on route change so the menu never lingers over the new page.
  useEffect(() => setOpen(false), [pathname])

  // Dismiss on outside click and on Escape.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
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

  if (!signedIn) {
    return (
      <Link
        href="/account/login"
        className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <User className="size-4" aria-hidden="true" />
        <span>{t.account.signIn}</span>
      </Link>
    )
  }

  const items = [
    { href: '/account', label: t.account.nav.dashboard },
    { href: '/account/orders', label: t.account.nav.orders },
    { href: '/account/profile', label: t.account.nav.profile },
    { href: '/account/addresses', label: t.account.nav.addresses },
  ]

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <User className="size-4" aria-hidden="true" />
        <span className="max-w-28 truncate">
          {displayName || t.account.myAccount}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t.account.myAccount}
          className="absolute end-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}

          <form action={logoutAction} className="mt-1 border-t border-border pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t.account.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
