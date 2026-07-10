'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type Scene = {
  index: string
  kicker: string
  title: string
  accent: string
  description: string
  tags: string[]
  image: string
  alt: string
}

const scenes: Scene[] = [
  {
    index: '01',
    kicker: 'Personal Import',
    title: 'Your dream vehicle,',
    accent: 'personally sourced',
    description:
      'Luxurious commercial vehicles, new and used — hand-picked to your exact specification and imported directly for you, with every detail handled.',
    tags: ['New & Used', 'Luxury Commercial', 'Tailored Sourcing'],
    image: '/images/scene-personal-import.png',
    alt: 'Luxury SUV presented in a dark premium showroom',
  },
  {
    index: '02',
    kicker: 'Direct Import',
    title: 'Factory to fleet,',
    accent: 'no middlemen',
    description:
      'Importing trucks and luxury vehicles straight from global markets. Full documentation, customs clearance, and delivery — end to end.',
    tags: ['Trucks & Luxury', 'Factory Direct', 'Full Documentation'],
    image: '/images/scene-direct-import.png',
    alt: 'Shipping port at dusk with rows of trucks and container cranes',
  },
  {
    index: '03',
    kicker: 'Spare Parts',
    title: 'Every part,',
    accent: 'zero downtime',
    description:
      'Genuine spare parts for Sprinters and light trucks — sourced, verified, and dispatched express to keep your fleet moving.',
    tags: ['Sprinters & Light Trucks', 'Genuine OEM', 'Express Dispatch'],
    image: '/images/scene-spare-parts.png',
    alt: 'Open car hood revealing a detailed engine bay in a workshop',
  },
]

/* Technical callout labels overlaid on the engine-bay scene (spare parts panel) */
const partCallouts = [
  { label: 'Turbocharger', top: '24%', right: '30%' },
  { label: 'OEM Filters', top: '46%', right: '12%' },
  { label: 'Brake Systems', top: '66%', right: '34%' },
]

export function Services() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>('[data-scene]')

      panels.forEach((panel) => {
        /* Parallax: background slowly zooms while the panel is on screen */
        const bg = panel.querySelector('[data-scene-bg]')
        if (bg) {
          gsap.fromTo(
            bg,
            { scale: 1.15 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          )
        }

        /* Content reveal: staggered rise as the panel covers the previous one */
        const reveals = panel.querySelectorAll('[data-reveal]')
        if (reveals.length) {
          gsap.from(reveals, {
            y: 60,
            opacity: 0,
            stagger: 0.09,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: panel,
              start: 'top 55%',
              toggleActions: 'play none none reverse',
            },
          })
        }

        /* Callout chips pop in (spare parts scene) */
        const callouts = panel.querySelectorAll('[data-callout]')
        if (callouts.length) {
          gsap.from(callouts, {
            scale: 0,
            opacity: 0,
            stagger: 0.14,
            duration: 0.7,
            ease: 'back.out(1.8)',
            scrollTrigger: {
              trigger: panel,
              start: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          })
        }
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="parts" aria-label="Our services">
      {/* Intro strip before the stacked scenes */}
      <div className="bg-secondary px-6 py-16 text-center md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Our Services
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Three services. <em className="font-serif italic text-accent">One story.</em>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Keep scrolling — each chapter takes over the screen.
        </p>
      </div>

      {/* ===== Stacked scroll-swap scenes ===== */}
      <div className="relative">
        {scenes.map((scene, i) => (
          <article
            key={scene.index}
            data-scene
            className="sticky top-0 flex h-svh items-end overflow-hidden md:items-center"
            style={{ zIndex: i + 1 }}
          >
            {/* Themed full-bleed background */}
            <div data-scene-bg className="absolute inset-0 will-change-transform">
              <Image
                src={scene.image || "/placeholder.svg"}
                alt={scene.alt}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </div>

            {/* Legibility overlays */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/15"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent"
            />

            {/* Spare-parts scene: technical callout chips over the engine bay */}
            {scene.index === '03' && (
              <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
                {partCallouts.map((c) => (
                  <div
                    key={c.label}
                    data-callout
                    className="absolute flex items-center gap-2"
                    style={{ top: c.top, right: c.right }}
                  >
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
                      <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-accent" />
                    </span>
                    <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur">
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Scene content */}
            <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 md:pb-0">
              <div className="max-w-xl">
                <p data-reveal className="flex items-baseline gap-4">
                  <span className="font-serif text-6xl italic leading-none text-accent md:text-8xl">
                    {scene.index}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                    {scene.kicker}
                  </span>
                </p>
                <h3
                  data-reveal
                  className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl"
                >
                  {scene.title}{' '}
                  <em className="font-serif italic text-accent">{scene.accent}</em>
                </h3>
                <p
                  data-reveal
                  className="mt-5 max-w-md text-pretty leading-relaxed text-white/75"
                >
                  {scene.description}
                </p>
                <ul data-reveal className="mt-8 flex flex-wrap gap-2">
                  {scene.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chapter progress — bottom right */}
              <div
                data-reveal
                className="absolute bottom-8 right-6 hidden items-center gap-3 md:flex"
              >
                <div className="flex gap-1.5">
                  {scenes.map((s, d) => (
                    <span
                      key={s.index}
                      className={`h-1 rounded-full transition-all ${
                        d === i ? 'w-8 bg-accent' : 'w-3 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium tabular-nums text-white/60">
                  {scene.index} / 0{scenes.length}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
