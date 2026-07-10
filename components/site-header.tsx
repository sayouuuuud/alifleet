'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Home', href: '#', active: true },
  { label: 'Fleet', href: '#fleet', active: false },
  { label: 'Importing', href: '#importing', active: false },
  { label: 'Services', href: '#parts', active: false },
]

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)

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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Pill navigation — matches reference: white pill, black active chip */}
        <nav
          data-nav-pill
          aria-label="Main navigation"
          className="hidden items-center rounded-full bg-card p-1.5 shadow-lg shadow-foreground/5 md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              data-nav-item
              aria-current={link.active ? 'page' : undefined}
              className={
                link.active
                  ? 'rounded-full bg-foreground px-7 py-2.5 text-sm font-semibold text-background'
                  : 'rounded-full px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile: brand chip + hamburger */}
        <div data-nav-pill className="flex items-center rounded-full bg-card p-1.5 shadow-lg shadow-foreground/5 md:hidden">
          <span className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background">
            ALI FLEET
          </span>
        </div>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-lg shadow-foreground/5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="mx-4 mt-3 flex flex-col gap-1 rounded-3xl bg-card p-3 shadow-xl md:hidden"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className={
                link.active
                  ? 'rounded-full bg-foreground px-5 py-3 text-center text-base font-semibold text-background'
                  : 'rounded-full px-5 py-3 text-center text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
              }
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
