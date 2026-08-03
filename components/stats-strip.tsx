'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/lib/i18n/language-context'

gsap.registerPlugin(ScrollTrigger)

export function StatsStrip() {
  const sectionRef = useRef<HTMLElement>(null)
  const { t } = useLanguage()

  const stats = [
    { value: 850, suffix: '+', label: t.home.stats.vehicles },
    { value: 40, suffix: '+', label: t.home.stats.countries },
    { value: 15, suffix: '', label: t.home.stats.years },
    { value: 98, suffix: '%', label: t.home.stats.satisfaction },
  ]

  useGSAP(
    () => {
      gsap.from('[data-stat-card]', {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
        },
      })

      gsap.utils.toArray<HTMLElement>('[data-stat-number]').forEach((el) => {
        const target = Number(el.dataset.target || 0)
        const counter = { val: 0 }
        gsap.to(counter, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
          },
          onUpdate: () => {
            el.textContent = Math.round(counter.val).toString()
          },
        })
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="pb-20 pt-8 md:pb-28 md:pt-12" id="why-us">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 md:p-12">
          {/* Grid pattern background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage:
                'radial-gradient(ellipse at center, black 40%, transparent 85%)',
              WebkitMaskImage:
                'radial-gradient(ellipse at center, black 40%, transparent 85%)',
            }}
          />
          <div className="relative grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} data-stat-card className="flex flex-col gap-2">
                <p
                  dir="ltr"
                  className="text-5xl font-semibold tracking-tight text-foreground md:text-6xl rtl:text-end"
                >
                  <span data-stat-number data-target={stat.value}>
                    0
                  </span>
                  <span className="text-accent">{stat.suffix}</span>
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
