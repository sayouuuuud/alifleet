'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type Service = {
  index: string
  kicker: string
  title: string
  accent: string
  description: string
  tags: string[]
  image: string
  alt: string
}

const services: Service[] = [
  {
    index: '01',
    kicker: 'Personal Import',
    title: 'Your dream vehicle,',
    accent: 'personally sourced',
    description:
      'Luxurious commercial vehicles, new and used — hand-picked to your exact specification and imported directly for you, with every detail handled.',
    tags: ['New & Used', 'Luxury Commercial', 'Tailored Sourcing'],
    image: '/images/suv-light.png',
    alt: 'Luxury commercial SUV presented in a bright showroom',
  },
  {
    index: '02',
    kicker: 'Direct Import',
    title: 'Factory to fleet,',
    accent: 'no middlemen',
    description:
      'Importing trucks and luxury vehicles straight from global markets. Full documentation, customs clearance, and delivery — end to end.',
    tags: ['Trucks & Luxury', 'Factory Direct', 'Full Documentation'],
    image: '/images/truck-light.png',
    alt: 'Modern heavy truck photographed in bright studio light',
  },
  {
    index: '03',
    kicker: 'Spare Parts',
    title: 'Every part,',
    accent: 'zero downtime',
    description:
      'Genuine spare parts for Sprinters and light trucks — sourced, verified, and dispatched express to keep your fleet moving.',
    tags: ['Sprinters & Light Trucks', 'Genuine OEM', 'Express Dispatch'],
    image: '/images/parts-light.png',
    alt: 'Genuine automotive spare parts arranged neatly on a white surface',
  },
]

/* Floating exploded parts — all confined to the RIGHT half (around the image)
   and the far-left gutter, so they NEVER overlap the text column. */
const parts = [
  {
    // top-left corner of the image; only moves right/down (stays right of center)
    src: '/images/part-gear.png',
    alt: '',
    className: 'left-[49%] top-[12%] w-20 md:w-28',
    states: [
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: 60, y: 60, rotation: 65, scale: 0.85 },
      { x: 20, y: 150, rotation: 130, scale: 1.05 },
    ],
  },
  {
    // top-right edge
    src: '/images/part-turbo.png',
    alt: '',
    className: 'right-[3%] top-[9%] w-28 md:w-36',
    states: [
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: -40, y: 60, rotation: -40, scale: 1.1 },
      { x: 10, y: 130, rotation: 25, scale: 0.9 },
    ],
  },
  {
    // bottom of image, left-of-image but still right of viewport center
    src: '/images/part-piston.png',
    alt: '',
    className: 'bottom-[12%] left-[52%] w-16 md:w-24',
    states: [
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: 70, y: -30, rotation: 35, scale: 1.08 },
      { x: 130, y: 20, rotation: -20, scale: 0.92 },
    ],
  },
  {
    // bottom-right edge
    src: '/images/part-brake.png',
    alt: '',
    className: 'bottom-[10%] right-[5%] w-28 md:w-36',
    states: [
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: -50, y: -60, rotation: -55, scale: 0.88 },
      { x: -10, y: -140, rotation: -110, scale: 1.12 },
    ],
  },
  {
    // far-left gutter; only ever moves further LEFT (never toward the text)
    src: '/images/part-headlight.png',
    alt: '',
    className: 'left-[-2%] top-[26%] w-20 md:w-28',
    states: [
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: -14, y: 50, rotation: 18, scale: 1.05 },
      { x: -22, y: -20, rotation: -12, scale: 0.9 },
    ],
  },
  {
    // right edge, mid-height
    src: '/images/part-wheel.png',
    alt: '',
    className: 'right-[1%] top-[44%] w-28 md:w-36',
    states: [
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: -30, y: 60, rotation: 90, scale: 0.92 },
      { x: -10, y: -50, rotation: 200, scale: 1.08 },
    ],
  },
]

export function Services() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      /* ---------- Desktop: pinned exploded-assembly experience ---------- */
      mm.add('(min-width: 1024px)', () => {
        const stage = sectionRef.current?.querySelector('[data-stage]')
        if (!stage) return

        const chapters = gsap.utils.toArray<HTMLElement>('[data-chapter]')
        const partEls = gsap.utils.toArray<HTMLElement>('[data-part]')
        const navItems = gsap.utils.toArray<HTMLElement>('[data-nav-item]')
        const fill = stage.querySelector<HTMLElement>('[data-progress-fill]')

        /* Initial state: only chapter 0 visible */
        chapters.forEach((c, i) => {
          gsap.set(c, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 80 })
        })

        /* Parts pop in when the section scrolls into view */
        gsap.from(partEls, {
          scale: 0,
          opacity: 0,
          rotation: () => gsap.utils.random(-120, 120),
          stagger: 0.08,
          duration: 1,
          ease: 'back.out(1.6)',
          scrollTrigger: { trigger: stage, start: 'top 75%' },
        })

        /* Continuous gentle float on inner wrappers (never fights the timeline) */
        partEls.forEach((el) => {
          const inner = el.querySelector('[data-part-float]')
          if (!inner) return
          gsap.to(inner, {
            y: gsap.utils.random(-14, 14),
            x: gsap.utils.random(-10, 10),
            rotation: gsap.utils.random(-8, 8),
            duration: gsap.utils.random(2.4, 3.6),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        })

        /* Master scrubbed timeline with pin */
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: '+=2800',
            pin: true,
            scrub: 1,
            onUpdate: (self) => {
              if (fill) gsap.set(fill, { scaleX: self.progress })
              const active = Math.min(2, Math.floor(self.progress * 3))
              navItems.forEach((item, i) => {
                item.dataset.active = String(i === active)
              })
            },
          },
        })

        /* Chapter transitions + parts re-explode between chapters */
        for (let i = 1; i < chapters.length; i++) {
          const label = `c${i}`
          tl.addLabel(label, i === 1 ? '+=0.4' : '+=0.6')

          tl.to(
            chapters[i - 1],
            { autoAlpha: 0, y: -70, filter: 'blur(6px)', duration: 0.8 },
            label
          )
          tl.fromTo(
            chapters[i],
            { autoAlpha: 0, y: 80, filter: 'blur(6px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9 },
            `${label}+=0.5`
          )

          /* image clip reveal for incoming chapter */
          const img = chapters[i].querySelector('[data-chapter-img]')
          if (img) {
            tl.fromTo(
              img,
              { clipPath: 'inset(12% 12% 12% 12% round 24px)', scale: 1.12 },
              { clipPath: 'inset(0% 0% 0% 0% round 24px)', scale: 1, duration: 1 },
              `${label}+=0.55`
            )
          }

          /* every part flies to its next keyframe */
          partEls.forEach((el, p) => {
            const s = parts[p].states[i]
            tl.to(el, { ...s, duration: 1.4 }, label)
          })
        }

        /* small hold at the end so the last chapter breathes */
        tl.to({}, { duration: 0.6 })

        /* Mouse parallax on parts via a dedicated wrapper */
        const quicks = partEls.map((el) => {
          const mid = el.querySelector('[data-part-parallax]')
          return mid
            ? {
                x: gsap.quickTo(mid, 'x', { duration: 0.8, ease: 'power3.out' }),
                y: gsap.quickTo(mid, 'y', { duration: 0.8, ease: 'power3.out' }),
              }
            : null
        })
        const onMove = (e: MouseEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5
          const ny = e.clientY / window.innerHeight - 0.5
          quicks.forEach((q, i) => {
            if (!q) return
            const depth = 14 + (i % 3) * 10
            q.x(nx * depth)
            q.y(ny * depth)
          })
        }
        window.addEventListener('mousemove', onMove)
        return () => window.removeEventListener('mousemove', onMove)
      })

      /* ---------- Mobile: stacked cards with reveals ---------- */
      mm.add('(max-width: 1023px)', () => {
        gsap.utils.toArray<HTMLElement>('[data-mobile-card]').forEach((card) => {
          gsap.from(card.querySelectorAll('[data-mobile-reveal]'), {
            y: 40,
            opacity: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 82%' },
          })
        })
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="parts" className="overflow-hidden bg-secondary">
      {/* ===================== Desktop pinned stage ===================== */}
      <div data-stage className="relative hidden h-screen lg:block">
        {/* blueprint grid backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, oklch(0.32 0.06 250 / 5%) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.06 250 / 5%) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        {/* floating exploded parts */}
        {parts.map((part, i) => (
          <div
            key={part.src}
            data-part
            className={`pointer-events-none absolute z-10 ${part.className}`}
          >
            <div data-part-parallax>
              <div data-part-float>
                <Image
                  src={part.src}
                  alt=""
                  width={160}
                  height={160}
                  className="h-auto w-full rounded-2xl shadow-lg ring-1 ring-primary/10"
                  aria-hidden="true"
                  priority={i < 2}
                />
              </div>
            </div>
          </div>
        ))}

        {/* progress rail — bottom center, horizontal */}
        <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-4">
          <ol className="flex items-center gap-10">
            {services.map((s, i) => (
              <li
                key={s.index}
                data-nav-item
                data-active={i === 0}
                className="flex items-center gap-2.5 transition-opacity duration-300 data-[active=false]:opacity-40"
              >
                <span className="font-serif text-lg italic text-accent">{s.index}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  {s.kicker}
                </span>
              </li>
            ))}
          </ol>
          <div className="relative h-px w-72 overflow-hidden bg-primary/15">
            <div
              data-progress-fill
              className="absolute inset-0 origin-left bg-accent"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>

        {/* section heading */}
        <div className="absolute left-1/2 top-10 z-20 -translate-x-1/2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Our Services
          </p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground">
            Engineered around <em className="font-serif italic text-accent">you</em>
          </h2>
        </div>

        {/* chapters */}
        <div className="relative z-20 mx-auto flex h-full max-w-6xl items-center px-6">
          {services.map((service) => (
            <article
              key={service.index}
              data-chapter
              className="absolute inset-x-6 grid grid-cols-2 items-center gap-16"
            >
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-6 -top-24 select-none font-serif text-[11rem] italic leading-none text-primary/5"
                >
                  {service.index}
                </span>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  {service.kicker}
                </p>
                <h3 className="text-balance text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
                  {service.title}{' '}
                  <em className="font-serif italic text-accent">{service.accent}</em>
                </h3>
                <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-primary/10 bg-card px-4 py-1.5 text-xs font-medium text-secondary-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                data-chapter-img
                className="relative aspect-[4/3] overflow-hidden rounded-3xl"
              >
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ===================== Mobile stacked cards ===================== */}
      <div className="px-4 py-20 lg:hidden">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Our Services
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground">
            Engineered around <em className="font-serif italic text-accent">you</em>
          </h2>
        </div>
        <div className="flex flex-col gap-14">
          {services.map((service) => (
            <article key={service.index} data-mobile-card>
              <div
                data-mobile-reveal
                className="relative aspect-[4/3] overflow-hidden rounded-2xl"
              >
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 font-serif text-sm italic text-accent backdrop-blur">
                  {service.index}
                </span>
              </div>
              <p
                data-mobile-reveal
                className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
              >
                {service.kicker}
              </p>
              <h3
                data-mobile-reveal
                className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground"
              >
                {service.title}{' '}
                <em className="font-serif italic text-accent">{service.accent}</em>
              </h3>
              <p data-mobile-reveal className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                {service.description}
              </p>
              <ul data-mobile-reveal className="mt-5 flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-primary/10 bg-card px-4 py-1.5 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
