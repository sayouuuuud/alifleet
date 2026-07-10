'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const items = [
  'New & Used Vehicles',
  'Global Importing',
  'Genuine Spare Parts',
  'Luxury Commercial Fleet',
  'Worldwide Delivery',
]

export function MarqueeStrip() {
  const wrapRef = useRef<HTMLDivElement>(null)

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
