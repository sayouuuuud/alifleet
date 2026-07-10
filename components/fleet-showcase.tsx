'use client'

import { useRef } from 'react'
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

      gsap.utils.toArray<HTMLElement>('[data-fleet-card]').forEach((card, i) => {
        gsap.from(card, {
          y: 60,
          opacity: 0,
          duration: 0.9,
          delay: i * 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
          },
        })
      })
    },
    { scope: sectionRef }
  )

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

        <div className="grid gap-6 md:grid-cols-3">
          {vehicles.map((vehicle) => (
            <article
              key={vehicle.title}
              data-fleet-card
              className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={vehicle.image}
                  alt={vehicle.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                  {vehicle.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold text-foreground">
                  {vehicle.title}
                  <ArrowUpRight className="size-5 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {vehicle.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
