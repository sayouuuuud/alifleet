'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ============================================================
   Scene data
   ============================================================ */

const showroomSpecs = [
  { label: 'Sourcing', value: 'Hand-picked to spec' },
  { label: 'Condition', value: 'New & Certified Used' },
  { label: 'Class', value: 'Luxury Commercial' },
  { label: 'Handover', value: 'Delivered to your door' },
]

const showroomStats = [
  { value: 500, suffix: '+', label: 'Vehicles Sourced' },
  { value: 40, suffix: '+', label: 'Export Markets' },
  { value: 100, suffix: '%', label: 'Spec Matched' },
]

const routeStops = [
  { code: 'FTY', label: 'Factory', place: 'Stuttgart, DE', status: 'done', meta: 'Departed · Jan 12' },
  { code: 'PRT', label: 'Port of Origin', place: 'Hamburg, DE', status: 'done', meta: 'Loaded · Jan 18' },
  { code: 'CAI', label: 'Customs', place: 'Alexandria, EG', status: 'current', meta: 'Clearing now' },
  { code: 'FLT', label: 'Your Fleet', place: 'Cairo, EG', status: 'pending', meta: 'ETA · Feb 03' },
]

const partCallouts = [
  { label: 'Turbocharger', code: 'PN 074-145-701', top: '22%', right: '28%' },
  { label: 'OEM Filters', code: 'PN 651-090-0052', top: '44%', right: '10%' },
  { label: 'Brake Systems', code: 'PN 910-421-002', top: '64%', right: '32%' },
]

const partsStock = [
  { name: 'Sprinter Engine Parts', level: 92 },
  { name: 'Light Truck Drivetrain', level: 84 },
  { name: 'Filters & Service Kits', level: 97 },
]

/* ============================================================
   Shared bits
   ============================================================ */

function CrosshairCorners() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-6 hidden md:block">
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos) => (
        <span key={pos} className={`absolute ${pos} font-mono text-lg leading-none text-white/40`}>
          +
        </span>
      ))}
    </div>
  )
}

function ChapterProgress({ active }: { active: number }) {
  return (
    <div data-reveal className="absolute bottom-8 right-6 hidden items-center gap-3 md:flex">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((d) => (
          <span
            key={d}
            className={`h-1 rounded-full transition-all ${d === active ? 'w-8 bg-accent' : 'w-3 bg-white/30'}`}
          />
        ))}
      </div>
      <span className="font-mono text-xs tabular-nums text-white/60">
        0{active + 1} / 03
      </span>
    </div>
  )
}

function SceneShell({
  index,
  image,
  video,
  alt,
  children,
}: {
  index: number
  image: string
  video: string
  alt: string
  children: React.ReactNode
}) {
  return (
    <article
      data-scene
      className="sticky top-0 flex h-svh items-end overflow-hidden md:items-center"
      style={{ zIndex: index + 1 }}
    >
      <div data-scene-bg className="absolute inset-0 will-change-transform">
        <video
          data-scene-video
          src={video}
          poster={image}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={alt}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent"
      />
      <CrosshairCorners />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 md:pb-0">
        {children}
        <ChapterProgress active={index} />
      </div>
    </article>
  )
}

function SceneKicker({ index, kicker }: { index: string; kicker: string }) {
  return (
    <p data-reveal className="flex items-baseline gap-4">
      <span className="font-serif text-6xl italic leading-none text-accent md:text-8xl">{index}</span>
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
        {kicker}
      </span>
    </p>
  )
}

/* ============================================================
   Scene 01 — Personal Import: luxury spec sheet
   ============================================================ */

function ShowroomScene() {
  return (
    <SceneShell
      index={0}
      image="/images/scene-personal-import.png"
      video="/videos/scene-showroom.mp4"
      alt="Luxury SUV traveling at dusk"
    >
      <div className="grid items-end gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div className="max-w-xl">
          <SceneKicker index="01" kicker="Personal Import" />
          <h3 data-title className="mt-6 overflow-hidden text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
            <span data-title-line className="block">Your dream vehicle,</span>
            <em data-title-line className="block font-serif italic text-accent">personally sourced</em>
          </h3>
          <p data-reveal className="mt-5 max-w-md text-pretty leading-relaxed text-white/75">
            Luxurious commercial vehicles, new and used — hand-picked to your exact
            specification and imported directly for you.
          </p>

          {/* Animated counters */}
          <div data-reveal className="mt-10 flex gap-10">
            {showroomStats.map((s) => (
              <div key={s.label}>
                <p className="font-mono text-3xl font-semibold tabular-nums text-white md:text-4xl">
                  <span data-counter data-counter-to={s.value}>0</span>
                  <span className="text-accent">{s.suffix}</span>
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Spec sheet card */}
        <div
          data-spec-card
          className="hidden rounded-xl border border-white/15 bg-black/40 p-6 backdrop-blur-md md:block"
        >
          <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
            <span>Vehicle Spec Sheet</span>
            <span className="text-accent">ALI-FLEET / 01</span>
          </p>
          <ul className="mt-4">
            {showroomSpecs.map((row) => (
              <li
                key={row.label}
                data-spec-row
                className="flex items-center justify-between border-b border-white/10 py-3.5 last:border-0"
              >
                <span className="font-mono text-xs uppercase tracking-wider text-white/50">
                  {row.label}
                </span>
                <span className="text-sm font-medium text-white">{row.value}</span>
              </li>
            ))}
          </ul>
          <div data-spec-row className="mt-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
              Sourcing available now
            </span>
          </div>
        </div>
      </div>
    </SceneShell>
  )
}

/* ============================================================
   Scene 02 — Direct Import: logistics route HUD
   ============================================================ */

function PortScene() {
  return (
    <SceneShell
      index={1}
      image="/images/scene-direct-import.png"
      video="/videos/scene-port.mp4"
      alt="Loading port with cranes, containers and ships"
    >
      <div className="max-w-xl">
        <SceneKicker index="02" kicker="Direct Import" />
        <h3 data-title className="mt-6 overflow-hidden text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
          <span data-title-line className="block">Factory to fleet,</span>
          <em data-title-line className="block font-serif italic text-accent">no middlemen</em>
        </h3>
        <p data-reveal className="mt-5 max-w-md text-pretty leading-relaxed text-white/75">
          Importing trucks and luxury vehicles straight from global markets. Full
          documentation, customs clearance, and delivery — end to end.
        </p>
      </div>

      {/* Shipment tracking card */}
      <div data-reveal className="mt-12 max-w-md">
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
                Shipment Tracking
              </span>
            </div>
            <span data-tracking-code className="font-mono text-[11px] tracking-wider text-accent">
              ALIFLT-2026-0071
            </span>
          </div>

          {/* Vertical timeline */}
          <ol className="relative px-6 py-5">
            {routeStops.map((stop, i) => {
              const isLast = i === routeStops.length - 1
              const isDone = stop.status === 'done'
              const isCurrent = stop.status === 'current'
              return (
                <li
                  key={stop.code}
                  data-route-stop
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {/* Connector line between stops */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[10px] top-6 h-full w-px ${
                        isDone ? 'bg-accent/60' : 'bg-white/15'
                      }`}
                    />
                  )}
                  {/* Node */}
                  <span
                    className={`relative z-10 mt-0.5 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border-2 ${
                      isDone
                        ? 'border-accent bg-accent'
                        : isCurrent
                          ? 'border-accent bg-black'
                          : 'border-white/25 bg-black'
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-3 w-3 text-black" strokeWidth={3} />
                    ) : isCurrent ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    ) : null}
                  </span>
                  {/* Text */}
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium text-white">
                        {stop.label}
                        <span className="font-mono text-[9px] uppercase tracking-widest text-accent">
                          {stop.code}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-white/50">{stop.place}</p>
                    </div>
                    <span
                      className={`whitespace-nowrap font-mono text-[10px] uppercase tracking-wider ${
                        isCurrent ? 'text-accent' : 'text-white/45'
                      }`}
                    >
                      {stop.meta}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </SceneShell>
  )
}

/* ============================================================
   Scene 03 — Spare Parts: engine HUD
   ============================================================ */

function PartsScene() {
  return (
    <SceneShell
      index={2}
      image="/images/scene-spare-parts.png"
      video="/videos/scene-engine.mp4"
      alt="Mechanic working on a car engine under an open hood"
    >
      {/* Scan sweep line */}
      <div
        data-scanline
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-px bg-gradient-to-b from-transparent via-accent/80 to-transparent"
        style={{ boxShadow: '0 0 24px 2px oklch(0.55 0.2 250 / 0.5)' }}
      />

      {/* HUD callouts over the engine */}
      <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
        {partCallouts.map((c) => (
          <div key={c.label} data-callout className="absolute" style={{ top: c.top, right: c.right }}>
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent ring-2 ring-white/80" />
              </span>
              <span data-callout-line className="h-px w-10 origin-left bg-accent/70" />
              <span className="rounded-md border border-white/20 bg-black/60 px-3 py-1.5 backdrop-blur">
                <span className="block text-xs font-medium tracking-wide text-white">{c.label}</span>
                <span className="block font-mono text-[9px] uppercase tracking-widest text-accent">
                  {c.code}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-xl">
        <SceneKicker index="03" kicker="Spare Parts" />
        <h3 data-title className="mt-6 overflow-hidden text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
          <span data-title-line className="block">Every part,</span>
          <em data-title-line className="block font-serif italic text-accent">zero downtime</em>
        </h3>
        <p data-reveal className="mt-5 max-w-md text-pretty leading-relaxed text-white/75">
          Genuine spare parts for Sprinters and light trucks — sourced, verified, and
          dispatched express to keep your fleet moving.
        </p>

        {/* Live inventory bars */}
        <div data-reveal className="mt-10 max-w-md rounded-xl border border-white/15 bg-black/40 p-5 backdrop-blur-md">
          <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
            <span>Live Inventory</span>
            <span className="flex items-center gap-1.5 text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              In Stock
            </span>
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {partsStock.map((p) => (
              <li key={p.name}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-white">{p.name}</span>
                  <span className="font-mono text-xs tabular-nums text-accent">{p.level}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    data-stock-bar
                    className="h-full origin-left rounded-full bg-accent"
                    style={{ width: `${p.level}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SceneShell>
  )
}

/* ============================================================
   Section
   ============================================================ */

export function Services() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>('[data-scene]')

      /* Play each background video whenever its scene is actually visible.
         Scenes are sticky and stay pinned during the dwell spacers, so
         scroll-offset math would pause them while still on screen. An
         IntersectionObserver tracks real visibility and keeps them playing. */
      const videos = document.querySelectorAll<HTMLVideoElement>('[data-scene-video]')
      const videoObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const video = entry.target as HTMLVideoElement
            if (entry.isIntersecting) {
              video.play().catch(() => {})
            } else {
              video.pause()
            }
          }
        },
        { threshold: 0.05 }
      )
      videos.forEach((video) => videoObserver.observe(video))

      panels.forEach((panel) => {
        /* Parallax background zoom */
        const bg = panel.querySelector('[data-scene-bg]')
        if (bg) {
          gsap.fromTo(
            bg,
            { scale: 1.15 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom+=100% top', scrub: true },
            }
          )
        }

        const enter = {
          trigger: panel,
          start: 'top 55%',
          toggleActions: 'play none none reverse',
        } as const

        /* Title lines slide up from behind a mask */
        const titleLines = panel.querySelectorAll('[data-title-line]')
        if (titleLines.length) {
          gsap.from(titleLines, {
            yPercent: 110,
            skewY: 4,
            stagger: 0.12,
            duration: 1,
            ease: 'power4.out',
            scrollTrigger: enter,
          })
        }

        /* Generic staggered reveals */
        const reveals = panel.querySelectorAll('[data-reveal]')
        if (reveals.length) {
          gsap.from(reveals, {
            y: 50,
            opacity: 0,
            stagger: 0.1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: enter,
          })
        }

        /* Scene 01: counters + spec sheet rows */
        const counters = panel.querySelectorAll<HTMLElement>('[data-counter]')
        counters.forEach((el) => {
          const to = Number(el.dataset.counterTo || 0)
          const obj = { n: 0 }
          gsap.to(obj, {
            n: to,
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: enter,
            onUpdate: () => {
              el.textContent = String(Math.round(obj.n))
            },
          })
        })

        const specCard = panel.querySelector('[data-spec-card]')
        if (specCard) {
          gsap.from(specCard, {
            x: 60,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: enter,
          })
          gsap.from(panel.querySelectorAll('[data-spec-row]'), {
            x: 24,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            delay: 0.3,
            ease: 'power2.out',
            scrollTrigger: enter,
          })
        }

        /* Scene 02: timeline stops slide in and stack top to bottom */
        const routeStopEls = panel.querySelectorAll('[data-route-stop]')
        if (routeStopEls.length) {
          gsap.from(routeStopEls, {
            x: -24,
            opacity: 0,
            stagger: 0.18,
            duration: 0.55,
            ease: 'power3.out',
            scrollTrigger: enter,
          })
        }

        /* Scene 03: scan sweep, callout connector lines, stock bars */
        const scanline = panel.querySelector('[data-scanline]')
        if (scanline) {
          gsap.fromTo(
            scanline,
            { x: 0, opacity: 0 },
            {
              x: () => window.innerWidth,
              opacity: 1,
              duration: 2.2,
              ease: 'power2.inOut',
              scrollTrigger: enter,
              onComplete: () => {
                gsap.to(scanline, { opacity: 0, duration: 0.6 })
              },
            }
          )
        }

        const callouts = panel.querySelectorAll('[data-callout]')
        if (callouts.length) {
          gsap.from(callouts, {
            scale: 0,
            opacity: 0,
            stagger: 0.18,
            duration: 0.7,
            delay: 0.5,
            ease: 'back.out(1.8)',
            scrollTrigger: enter,
          })
          gsap.from(panel.querySelectorAll('[data-callout-line]'), {
            scaleX: 0,
            stagger: 0.18,
            duration: 0.5,
            delay: 0.7,
            ease: 'power2.out',
            scrollTrigger: enter,
          })
        }

        const bars = panel.querySelectorAll('[data-stock-bar]')
        if (bars.length) {
          gsap.from(bars, {
            scaleX: 0,
            stagger: 0.15,
            duration: 1.1,
            delay: 0.4,
            ease: 'power3.out',
            scrollTrigger: enter,
          })
        }
      })

      return () => videoObserver.disconnect()
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="parts" aria-label="Our services">
      {/* Intro strip before the stacked scenes */}
      <div className="bg-secondary px-6 py-16 text-center md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Our Services</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Three services. <em className="font-serif italic text-accent">One story.</em>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Keep scrolling — each chapter takes over the screen.
        </p>
      </div>

      {/* Stacked scroll-swap scenes — spacers keep each scene pinned
          for extra scroll distance before the next one covers it */}
      <div className="relative">
        <ShowroomScene />
        <div aria-hidden="true" className="h-[80svh]" />
        <PortScene />
        <div aria-hidden="true" className="h-[80svh]" />
        <PartsScene />
        <div aria-hidden="true" className="h-[60svh]" />
      </div>
    </section>
  )
}
