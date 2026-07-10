'use client'

import { useRef, useState } from 'react'
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
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const slides = [
  {
    src: '/images/hero-showroom.png',
    alt: 'Luxury white vehicle with open gullwing doors in a futuristic showroom',
    label: 'Classic/Luxury',
    speed: '250 km/hOUR',
  },
  {
    src: '/images/hero-truck.png',
    alt: 'Premium commercial truck in a bright studio',
    label: 'Executive/Fleet',
    speed: '180 km/hOUR',
  },
  {
    src: '/images/hero-light.png',
    alt: 'White luxury SUV side profile on bright background',
    label: 'Comfort/SUV',
    speed: '220 km/hOUR',
  },
]

const thumbnails = [
  { src: '/images/fleet-truck.png', label: 'Trucks', alt: 'Premium white commercial truck' },
  { src: '/images/fleet-van.png', label: 'Vans', alt: 'Luxury white cargo van' },
  { src: '/images/fleet-suv.png', label: 'SUVs', alt: 'High-end white luxury SUV' },
]

const categories = ['Classic', 'Executive', 'Metro', 'Highway', 'Comfort', 'Luxury']

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  const prev = () => setActiveSlide((i) => (i - 1 + slides.length) % slides.length)
  const next = () => setActiveSlide((i) => (i + 1) % slides.length)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('[data-hero-line]', {
        yPercent: 110,
        duration: 1,
        stagger: 0.12,
        delay: 0.2,
      })
        .from('[data-hero-sub]', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
        .from(
          '[data-hero-image-wrap]',
          { y: 50, opacity: 0, duration: 1, ease: 'power2.out' },
          '-=0.7'
        )
        .from(
          '[data-hero-badge]',
          { scale: 0.85, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'back.out(1.7)' },
          '-=0.5'
        )
        .from('[data-hero-card]', { y: 32, opacity: 0, duration: 0.7 }, '-=0.5')
        .from(
          '[data-hero-chip]',
          { y: 10, opacity: 0, duration: 0.35, stagger: 0.05 },
          '-=0.4'
        )

      gsap.to('[data-hero-image]', {
        yPercent: 6,
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

  const slide = slides[activeSlide]

  return (
    <section ref={sectionRef} className="relative bg-white pt-20 md:pt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">

          {/* ---------- Left column ---------- */}
          <div className="flex h-full flex-col py-2">

            {/* Heading */}
            <h1 className="text-balance font-sans text-[clamp(2.6rem,6vw,5rem)] font-black leading-[1.05] tracking-tight text-zinc-950">
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="flex items-center gap-3">
                  Redefining
                  <span className="inline-flex h-9 w-[4.5rem] shrink-0 items-center overflow-hidden rounded-full border-2 border-zinc-200 shadow md:h-10 md:w-[5rem]">
                    <Image
                      src="/images/hero-avatars.png"
                      alt="Trusted by fleet owners worldwide"
                      width={120}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  </span>
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">Art of Driving</span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">With Luxury</span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span data-hero-line className="block">Performance</span>
              </span>
            </h1>

            {/* Dashed divider */}
            <div data-hero-sub className="mt-8 flex items-center gap-4" aria-hidden="true">
              <span className="h-px flex-1 border-t border-dashed border-zinc-300" />
              <span className="flex h-11 w-24 items-center justify-center rounded-[2rem] border border-dashed border-zinc-300">
                <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-zinc-400 stroke-2">
                  <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3m-4 12H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2z" />
                  <circle cx="11" cy="17" r="1" />
                </svg>
              </span>
              <span className="h-px flex-1 border-t border-dashed border-zinc-300" />
            </div>

            {/* Brand tag + description */}
            <div data-hero-sub className="mt-8">
              <p className="font-serif text-xl font-bold tracking-wide text-[oklch(0.68_0.13_235)]">
                ALI FLEET
              </p>
              <p className="mt-3 max-w-[18rem] text-pretty text-[12px] font-bold uppercase leading-relaxed tracking-widest text-zinc-500">
                Explore a curated collection of high-end commercial vehicles that combine advanced
                engineering, elegant interiors, and powerful performance
              </p>
            </div>

            {/* Spacer + decorative plus marks */}
            <div
              data-hero-sub
              className="mt-auto flex items-center justify-between pt-10 font-mono text-base tracking-[0.5em] text-zinc-300"
              aria-hidden="true"
            >
              <span>+++</span>
              <span>+++</span>
            </div>
          </div>

          {/* ---------- Right column ---------- */}
          <div data-hero-image-wrap className="relative flex flex-col">

            {/* Main image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] md:aspect-[16/11]">
              <Image
                data-hero-image
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                fill
                className="scale-105 object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />

              {/* Vertical brand tag */}
              <div
                data-hero-badge
                className="absolute left-4 top-0 hidden flex-col items-center gap-2 md:flex"
              >
                <span className="rounded-b-full bg-white px-2.5 pb-4 pt-5 text-[9px] font-bold uppercase tracking-[0.35em] text-zinc-800 shadow-md [writing-mode:vertical-rl]">
                  ALI FLEET
                </span>
                <a
                  href="#fleet"
                  aria-label="Explore the fleet"
                  className="flex size-9 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md transition-transform hover:scale-110"
                >
                  <ArrowUpRight className="size-4" />
                </a>
              </div>

              {/* Classic/Luxury glass pill */}
              <div
                data-hero-badge
                className="absolute left-[22%] top-[26%] hidden items-center gap-2 rounded-full border border-white/50 bg-white/25 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md md:flex"
              >
                <MousePointer2 className="size-4" />
                <span>
                  {slide.label.split('/')[0]}
                  <span className="font-normal opacity-80">/{slide.label.split('/')[1]}</span>
                </span>
              </div>

              {/* Speed glass pill */}
              <div
                data-hero-badge
                className="absolute left-[42%] top-[50%] hidden items-center gap-2 rounded-full border border-white/50 bg-white/25 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md md:flex"
              >
                <Gauge className="size-4" />
                <span>
                  {slide.speed.split('/')[0]}
                  <span className="font-normal opacity-80">/{slide.speed.split('/')[1]}</span>
                </span>
              </div>

              {/* Category chips — 2×3 grid bottom right */}
              <div className="absolute bottom-5 right-5 hidden grid-cols-2 gap-2 md:grid">
                {categories.map((cat) => (
                  <span
                    data-hero-chip
                    key={cat}
                    className="cursor-pointer rounded-full border border-white/40 bg-white/20 px-5 py-1.5 text-center text-xs font-medium text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/35"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact us pill notched top-right */}
            <div
              data-hero-badge
              className="absolute right-0 top-0 rounded-tr-[2rem] rounded-bl-[1.5rem] bg-white pb-2.5 pl-2.5 md:pb-3 md:pl-3"
            >
              <a
                href="#contact"
                className="inline-flex items-center gap-3 rounded-full bg-zinc-950 py-1.5 pl-1.5 pr-5 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-105"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-white text-zinc-900 md:size-9">
                  <ShoppingCart className="size-4" />
                </span>
                Contact Us
              </a>
            </div>

            {/* Thumbnail carousel — notched bottom-left */}
            <div
              data-hero-card
              className="relative -mt-14 w-fit max-w-full rounded-[1.75rem] bg-white p-2 shadow-xl md:absolute md:bottom-0 md:left-0 md:mt-0 md:rounded-bl-[2rem] md:rounded-tr-[1.75rem] md:pr-3 md:pt-3"
            >
              <div className="rounded-3xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
                <div className="flex gap-2.5">
                  {thumbnails.map((thumb) => (
                    <div
                      key={thumb.label}
                      className="group relative h-24 w-24 overflow-hidden rounded-2xl md:h-24 md:w-28"
                    >
                      <Image
                        src={thumb.src}
                        alt={thumb.alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="128px"
                      />
                      <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-zinc-900 text-white">
                        <ArrowUpRight className="size-3" />
                      </span>
                      <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-white/90 py-1.5 text-center text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur-sm">
                        {thumb.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between px-1 pb-0.5">
                  <p className="text-sm text-zinc-400">
                    <span className="text-xl font-bold text-zinc-900">{activeSlide + 1}</span>
                    /10
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={prev}
                      aria-label="Previous vehicle"
                      className="text-zinc-400 transition-colors hover:text-zinc-900"
                    >
                      <ArrowLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      aria-label="Next vehicle"
                      className="text-zinc-900 transition-transform hover:translate-x-0.5"
                    >
                      <ArrowRight className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8 md:h-20" aria-hidden="true" />
      </div>
    </section>
  )
}
