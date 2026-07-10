'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const stats = [
  { value: 850, suffix: '+', label: 'Vehicles delivered' },
  { value: 40, suffix: '+', label: 'Countries served' },
  { value: 15, suffix: '', label: 'Years of experience' },
  { value: 98, suffix: '%', label: 'Client satisfaction' },
]

export function StatsStrip() {
  const sectionRef = useRef<HTMLElement>(null)

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
    <section ref={sectionRef} className="py-20 md:py-28" id="why-us">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} data-stat-card className="flex flex-col gap-2">
              <p className="text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
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
    </section>
  )
}
