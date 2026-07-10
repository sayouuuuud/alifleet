'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const vehicles = [
  {
    title: 'Heavy-Duty Trucks',
    tag: 'New & Used',
    description:
      "Premium tractor units and rigid trucks from the world's leading manufacturers — inspected, certified, and road-ready.",
    image: '/images/truck-light.png',
    alt: 'Modern blue heavy-duty commercial truck photographed outdoors in daylight',
  },
  {
    title: 'Executive Vans',
    tag: 'Luxury Line',
    description:
      'First-class commercial vans with refined interiors — built for VIP transport, executive shuttles, and premium logistics.',
    image: '/images/van-light.png',
    alt: 'Luxury silver executive van in a bright modern showroom',
  },
  {
    title: 'Luxury Vehicles',
    tag: 'Imported',
    description:
      'Hand-selected luxury SUVs and vehicles sourced from global markets, imported with full documentation.',
    image: '/images/suv-light.png',
    alt: 'Luxury navy blue SUV in a bright white studio',
  },
]

export function FleetShowcase() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('[data-fleet-heading] > *', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-fleet-heading]',
          start: 'top 85%',
        },
      })

      gsap.from('[data-fleet-panel]', {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-fleet-panels]',
          start: 'top 85%',
        },
      })
    },
    { scope: sectionRef }
  )

  const [active, setActive] = useState(0)

  return (
    <section ref={sectionRef} id="fleet" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div data-fleet-heading className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              The Fleet
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Luxurious commercial vehicles,{' '}
              <em className="font-serif italic text-accent">curated</em> for you
            </h2>
          </div>
          <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            From heavy-duty workhorses to executive luxury, every vehicle is
            selected for performance, comfort, and prestige.
          </p>
        </div>

        <div
          data-fleet-panels
          className="flex h-[520px] flex-col gap-3 md:h-[560px] md:flex-row"
        >
          {vehicles.map((vehicle, i) => {
            const isActive = active === i
            return (
              <article
                key={vehicle.title}
                data-fleet-panel
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                tabIndex={0}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl outline-none transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive ? 'flex-[5]' : 'flex-[1]'
                }`}
              >
                <Image
                  src={vehicle.image}
                  alt={vehicle.alt}
                  fill
                  className={`object-cover transition-transform duration-700 ease-out ${
                    isActive ? 'scale-100' : 'scale-110'
                  }`}
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
                {/* Dark gradient for text legibility */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                />

                <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                  {vehicle.tag}
                </span>

                {/* Collapsed label — vertical title shown when the panel is idle */}
                <span
                  className={`pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-lg font-semibold uppercase tracking-wide text-white transition-opacity duration-300 [writing-mode:vertical-rl] md:block ${
                    isActive ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {vehicle.title}
                </span>

                {/* Expanded content */}
                <div
                  className={`absolute inset-0 flex flex-col justify-end p-6 transition-all duration-500 md:p-8 ${
                    isActive
                      ? 'translate-y-0 opacity-100 delay-150'
                      : 'pointer-events-none translate-y-4 opacity-0 md:opacity-0'
                  }`}
                >
                  <h3 className="flex items-center gap-2 text-2xl font-semibold text-white md:text-3xl">
                    {vehicle.title}
                    <ArrowUpRight className="size-6 text-accent" />
                  </h3>
                  <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-white/85 md:text-base">
                    {vehicle.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
