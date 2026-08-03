'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLanguage } from '@/lib/i18n/language-context'

export function MarqueeStrip() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  const items = [
    t.home.fleet.truckTitle,
    t.footer.servicesLinks.import,
    t.products.trustGenuine,
    t.home.fleet.luxuryTitle,
    t.footer.servicesLinks.parts,
  ]

  useGSAP(
    () => {
      gsap.to('[data-marquee-track]', {
        xPercent: -50,
        repeat: -1,
        duration: 30,
        ease: 'none',
      })
    },
    { scope: wrapRef }
  )

  return (
    <div
      ref={wrapRef}
      className="overflow-hidden border-y border-border bg-background py-5"
      aria-hidden="true"
    >
      <div data-marquee-track className="flex w-max items-center gap-12">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-12 whitespace-nowrap text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground"
          >
            {item}
            <span className="size-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  )
}
