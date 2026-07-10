'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Gauge,
  MousePointer2,
  ShoppingCart,
  Truck,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const thumbnails = [
  { src: '/images/fleet-truck.png', label: 'Trucks', alt: 'Premium white commercial truck' },
  { src: '/images/fleet-van.png', label: 'Vans', alt: 'Luxury white cargo van' },
  { src: '/images/fleet-suv.png', label: 'SUVs', alt: 'High-end white luxury SUV' },
]

const categories = ['Classic', 'Executive', 'Metro', 'Highway', 'Comfort', 'Luxury']

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('[data-hero-line]', {
        yPercent: 110,
        duration: 1,
        stagger: 0.12,
        delay: 0.3,
      })
        .from('[data-hero-sub]', { y: 24, opacity: 0, duration: 0.8 }, '-=0.5')
        .from(
          '[data-hero-image-wrap]',
          { y: 60, opacity: 0, duration: 1.1, ease: 'power2.out' },
          '-=0.7'
        )
        .from(
          '[data-hero-badge]',
          { scale: 0.8, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)' },
          '-=0.5'
        )
        .from('[data-hero-card]', { y: 40, opacity: 0, duration: 0.8 }, '-=0.6')
        .from(
          '[data-hero-chip]',
          { y: 12, opacity: 0, duration: 0.4, stagger: 0.05 },
          '-=0.5'
        )

      // Gentle parallax on the hero image
      gsap.to('[data-hero-image]', {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="pt-20 md:pt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          {/* ---------- Left column ---------- */}
          <div className="flex h-full flex-col lg:pt-2">
            <h1 className="text-balance text-5xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-6xl xl:text-[4.25rem]">
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="flex items-center gap-3">
                  Redefining
                  <span className="hidden h-9 w-[4.5rem] shrink-0 items-center overflow-hidden rounded-full border-[3px] border-background shadow-md md:inline-flex xl:h-11 xl:w-[5.5rem]">
                    <Image
                      src="/images/hero-avatars.png"
                      alt="Trusted by fleet owners worldwide"
                      width={132}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </span>
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">
                  Art of Driving
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">
                  With Luxury
                </span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span data-hero-line className="block">
                  Performance
                </span>
              </span>
            </h1>

            {/* Dashed divider with vehicle icon */}
            <div data-hero-sub className="mt-9 flex items-center" aria-hidden="true">
              <span className="h-px flex-1 border-t border-dashed border-muted-foreground/50" />
              <span className="mx-4 flex h-12 w-24 items-center justify-center rounded-[2rem] border border-dashed border-muted-foreground/60">
                <Truck className="size-5 text-muted-foreground" />
              </span>
              <span className="h-px flex-1 border-t border-dashed border-muted-foreground/50" />
            </div>

            {/* Brand + description */}
            <div data-hero-sub className="mt-9">
              <p className="font-serif text-xl font-bold tracking-wide text-accent">
                ALI FLEET
              </p>
              <p className="mt-3 max-w-[17rem] text-pretty text-[13px] font-bold uppercase leading-relaxed tracking-wide text-foreground">
                Explore a curated collection of high-end commercial vehicles that
                combine advanced engineering, elegant interiors, and powerful
                performance
              </p>
            </div>

            {/* Double plus decorations */}
            <div
              data-hero-sub
              className="mt-auto flex items-center justify-between pt-10 text-lg tracking-[0.4em] text-foreground/70"
              aria-hidden="true"
            >
              <span>+++</span>
              <span className="hidden md:inline">+++</span>
            </div>
          </div>

          {/* ---------- Right column: showroom image ---------- */}
          <div data-hero-image-wrap className="relative flex flex-col lg:-mt-16 lg:h-[calc(100%+4rem)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] md:aspect-[16/11.5] lg:aspect-auto lg:min-h-[36rem] lg:flex-1">
              <Image
                data-hero-image
                src="/images/hero-showroom.png"
                alt="Futuristic white luxury vehicle with open gullwing doors in a bright showroom"
                fill
                className="scale-105 object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />

              {/* Vertical brand tag — top left, flush with edge */}
              <div
                data-hero-badge
                className="absolute left-4 top-0 hidden flex-col items-center gap-2 md:flex"
              >
                <span className="rounded-b-full bg-card px-2.5 pb-4 pt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-card-foreground shadow-md [writing-mode:vertical-rl]">
                  ALI FLEET
                </span>
                <a
                  href="#fleet"
                  aria-label="Explore the fleet"
                  className="flex size-9 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform hover:scale-110"
                >
                  <ArrowUpRight className="size-4" />
                </a>
              </div>

              {/* Classic / Luxury glass pill */}
              <div
                data-hero-badge
                className="absolute left-[22%] top-[27%] hidden items-center gap-2 rounded-full border border-white/50 bg-white/30 px-5 py-2.5 text-sm text-white shadow-lg backdrop-blur-md md:flex"
              >
                <MousePointer2 className="size-4" />
                <span className="font-semibold">
                  Classic<span className="font-normal opacity-90">/Luxury</span>
                </span>
              </div>

              {/* Speed pill — solid white like the reference */}
              <div
                data-hero-badge
                className="absolute left-[44%] top-[50%] hidden items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm text-card-foreground shadow-lg md:flex"
              >
                <Gauge className="size-4" />
                <span className="font-semibold">
                  250 km<span className="font-normal text-muted-foreground">/hour</span>
                </span>
              </div>

              {/* Category chips — 2x3 grid bottom right */}
              <div className="absolute bottom-6 right-6 hidden grid-cols-2 gap-2 md:grid">
                {categories.map((category) => (
                  <span
                    data-hero-chip
                    key={category}
                    className="rounded-full border border-white/40 bg-white/25 px-6 py-2 text-center text-xs font-medium text-white shadow-sm backdrop-blur-md"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact us pill — notched into the top-right corner */}
            <div
              data-hero-badge
              className="absolute right-0 top-0 rounded-tr-[2rem] rounded-bl-[1.75rem] bg-background pb-2.5 pl-2.5 md:pb-3 md:pl-3"
            >
              <a
                href="#contact"
                className="inline-flex items-center gap-3 rounded-full bg-card py-1.5 pl-1.5 pr-5 text-xs font-bold uppercase tracking-wide text-card-foreground shadow-lg transition-transform hover:scale-105 md:py-2 md:pl-2 md:pr-6"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-background md:size-9">
                  <ShoppingCart className="size-4" />
                </span>
                Contact Us
              </a>
            </div>

            {/* Thumbnail carousel card — floating over the image's left edge like the reference */}
            <div
              data-hero-card
              className="relative -mt-14 w-fit max-w-full md:absolute md:bottom-10 md:-left-16 md:mt-0 lg:-left-24"
            >
              <div className="rounded-3xl bg-card p-3 shadow-2xl">
                <div className="flex gap-3">
                  {thumbnails.map((thumb) => (
                    <div
                      key={thumb.label}
                      className="group relative h-24 w-24 overflow-hidden rounded-2xl md:h-24 md:w-28"
                    >
                      <Image
                        src={thumb.src || "/placeholder.svg"}
                        alt={thumb.alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="128px"
                      />
                      <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                        <ArrowUpRight className="size-3" />
                      </span>
                      <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-card py-1.5 text-center text-xs font-semibold text-card-foreground shadow-sm">
                        {thumb.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between px-1 pb-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-xl font-semibold text-foreground">2</span>/10
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      aria-label="Previous vehicles"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next vehicles"
                      className="text-foreground transition-transform hover:translate-x-0.5"
                    >
                      <ArrowRight className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer so the overlapping card doesn't collide with next section */}
        <div className="h-6 md:h-8" aria-hidden="true" />
      </div>
    </section>
  )
}
