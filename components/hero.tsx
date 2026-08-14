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
  Truck,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import type { PageImages } from '@/lib/wp/page-images'

gsap.registerPlugin(ScrollTrigger)

// Fallback sources used when WP has not provided a value
const FALLBACK_SLIDE_SRCS = [
  '/images/hero-showroom.png',
  '/images/truck-light.png',
  '/images/van-light.png',
  '/images/suv-light.png',
  '/images/hero-truck.png',
  '/images/import-global.png',
]

export function Hero({ wpImages }: { wpImages?: PageImages }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { t } = useLanguage()

  // Merge WP images with local fallbacks slot-by-slot
  const slideSrcs = wpImages
    ? [
        wpImages.heroSlide1 || FALLBACK_SLIDE_SRCS[0],
        wpImages.heroSlide2 || FALLBACK_SLIDE_SRCS[1],
        wpImages.heroSlide3 || FALLBACK_SLIDE_SRCS[2],
        wpImages.heroSlide4 || FALLBACK_SLIDE_SRCS[3],
        wpImages.heroSlide5 || FALLBACK_SLIDE_SRCS[4],
        FALLBACK_SLIDE_SRCS[5], // slot 6 has no WP counterpart yet
      ]
    : FALLBACK_SLIDE_SRCS

  const avatarSrc = wpImages?.heroAvatarImage || '/images/hero-avatars.png'

  const slides = [
    { src: slideSrcs[0], label: t.home.heroSlides.flagship, alt: t.home.heroAvatarAlt },
    { src: slideSrcs[1], label: t.home.heroSlides.trucks, alt: t.home.heroSlides.trucks },
    { src: slideSrcs[2], label: t.home.heroSlides.vans, alt: t.home.heroSlides.vans },
    { src: slideSrcs[3], label: t.home.heroSlides.suvs, alt: t.home.heroSlides.suvs },
    { src: slideSrcs[4], label: t.home.heroSlides.highway, alt: t.home.heroSlides.highway },
    { src: slideSrcs[5], label: t.home.heroSlides.imports, alt: t.home.heroSlides.imports },
  ]

  const total = slides.length

  const goTo = (index: number) => setActive((index + total) % total)
  const prev = () => goTo(active - 1)
  const next = () => goTo(active + 1)

  // Carousel window: current slide first, then the two upcoming (cyclic)
  const windowSlides = [0, 1, 2].map((offset) => {
    const index = (active + offset) % total
    return { ...slides[index], index }
  })

  const activeSlide = slides[active]

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
        .from('[data-hero-card]', { y: 40, opacity: 0, duration: 0.8 }, '-=0.6')

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
                  {t.home.heroLine1}
                  <span className="hidden h-9 w-[4.5rem] shrink-0 items-center overflow-hidden rounded-full border-[3px] border-background shadow-md md:inline-flex xl:h-11 xl:w-[5.5rem]">
                    <Image
                      src={avatarSrc}
                      alt={t.home.heroAvatarAlt}
                      width={132}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </span>
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">
                  {t.home.heroLine2}
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">
                  {t.home.heroLine3}
                </span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span data-hero-line className="block">
                  {t.home.heroLine4}
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
                {t.nav.brand}
              </p>
              <p className="mt-3 max-w-[17rem] text-pretty text-[13px] font-bold uppercase leading-relaxed tracking-wide text-foreground">
                {t.home.heroDescription}
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
                key={activeSlide.src}
                data-hero-image
                src={activeSlide.src || '/placeholder.svg'}
                alt={activeSlide.alt}
                fill
                className="scale-105 animate-in fade-in object-cover duration-500"
                priority
                quality={82}
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>

            {/* Thumbnail carousel card — floating over the image's left edge like the reference */}
            <div
              data-hero-card
              className="relative -mt-14 w-fit max-w-full md:absolute md:bottom-10 md:mt-0 md:ltr:-left-16 md:rtl:-right-16 lg:ltr:-left-24 lg:rtl:-right-24"
            >
              <div className="rounded-3xl bg-card p-3 shadow-2xl">
                <div className="flex gap-3">
                  {windowSlides.map((thumb, position) => {
                    const isActive = position === 0
                    return (
                        <button
                        type="button"
                        key={thumb.label}
                        onClick={() => goTo(thumb.index)}
                        aria-label={`${t.home.heroView} ${thumb.label}`}
                        aria-current={isActive}
                        className={`group relative h-24 w-24 overflow-hidden rounded-2xl outline-none transition md:h-24 md:w-28 ${
                          isActive
                            ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card'
                            : 'opacity-80 hover:opacity-100'
                        } focus-visible:ring-2 focus-visible:ring-accent`}
                      >
                        <Image
                          src={thumb.src || '/placeholder.svg'}
                          alt={thumb.alt}
                          fill
                          // These render at ~112px — no need to ship the
                          // full-size original for a thumbnail.
                          quality={70}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="128px"
                        />
                        <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                          <ArrowUpRight className="size-3" />
                        </span>
                        <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-card py-1.5 text-center text-xs font-semibold text-card-foreground shadow-sm">
                          {thumb.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between px-1 pb-1">
                  <p dir="ltr" className="text-sm text-muted-foreground">
                    <span className="text-xl font-semibold text-foreground">
                      {active + 1}
                    </span>
                    /{total}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={prev}
                      aria-label={t.home.heroPrev}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      aria-label={t.home.heroNext}
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
