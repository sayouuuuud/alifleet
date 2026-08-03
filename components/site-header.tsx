'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Menu, ShoppingCart, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { useCart } from '@/lib/cart-context'
import { LanguageSwitcher } from '@/components/language-switcher'

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useLanguage()
  const { count, ready } = useCart()

  const navLinks = [
    { label: t.nav.home, href: '/' },
    { label: t.nav.products, href: '/products' },
    { label: t.nav.import, href: '/import' },
    { label: t.nav.blog, href: '/blog' },
    { label: t.nav.contact, href: '/contact' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  useGSAP(
    () => {
      gsap.from('[data-nav-pill]', {
        y: -40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.2,
      })
      gsap.from('[data-nav-item]', {
        y: -12,
        opacity: 0,
        stagger: 0.07,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.5,
      })
    },
    { scope: headerRef }
  )

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-4 z-50 md:top-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        {/* Pill navigation — white pill, black active chip */}
        <nav
          data-nav-pill
          aria-label="Main navigation"
          className="hidden items-center rounded-full bg-card p-1.5 shadow-lg shadow-foreground/5 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-nav-item
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={
                isActive(link.href)
                  ? 'rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background'
                  : 'rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop utility pill: language + cart */}
        <div
          data-nav-pill
          className="hidden items-center rounded-full bg-card p-1.5 shadow-lg shadow-foreground/5 md:flex"
        >
          <LanguageSwitcher />
          <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
          <Link
            href="/cart"
            aria-label={t.nav.cart}
            className="relative flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            <span>{t.nav.cart}</span>
            {ready && count > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: brand chip */}
        <Link
          href="/"
          data-nav-pill
          className="flex items-center rounded-full bg-card p-1.5 shadow-lg shadow-foreground/5 md:hidden"
        >
          <span className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background">
            {t.nav.brand}
          </span>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            aria-label={t.nav.cart}
            className="relative flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-lg shadow-foreground/5"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {ready && count > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-lg shadow-foreground/5"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="mx-4 mt-3 flex flex-col gap-1 rounded-3xl bg-card p-3 shadow-xl md:hidden"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={
                isActive(link.href)
                  ? 'rounded-full bg-foreground px-5 py-3 text-center text-base font-semibold text-background'
                  : 'rounded-full px-5 py-3 text-center text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
              }
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-border pt-3">
            <LanguageSwitcher variant="block" />
          </div>
        </nav>
      )}
    </header>
  )
}
