'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import type { PageImages } from '@/lib/wp/page-images'

gsap.registerPlugin(ScrollTrigger)

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
    <div data-reveal className="absolute bottom-8 end-6 hidden items-center gap-3 md:flex">
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
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/15 rtl:bg-gradient-to-l"
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

function ShowroomScene({ bgImage }: { bgImage?: string }) {
  const { t } = useLanguage()
  const s = t.home.services

  const showroomSpecs = [
    { label: s.spec1Label, value: s.spec1Value },
    { label: s.spec2Label, value: s.spec2Value },
    { label: s.spec3Label, value: s.spec3Value },
    { label: s.spec4Label, value: s.spec4Value },
  ]

  const showroomStats = [
    { value: 500, suffix: '+', label: s.stat1Label },
    { value: 40,  suffix: '+', label: s.stat2Label },
    { value: 100, suffix: '%', label: s.stat3Label },
  ]

  return (
    <SceneShell
      index={0}
      image={bgImage || '/images/scene-personal-import.png'}
      video="/videos/scene-showroom.mp4"
      alt={s.scene1Kicker}
    >
      <div className="grid items-end gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center rtl:md:grid-cols-[0.8fr_1.2fr]">
        <div className="max-w-xl rtl:order-2">
          <SceneKicker index="01" kicker={s.scene1Kicker} />
          <h3 data-title className="mt-6 overflow-hidden text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
            <span data-title-line className="block">{s.scene1Title1}</span>
            <em data-title-line className="block font-serif italic text-accent">{s.scene1Title2}</em>
          </h3>
          <p data-reveal className="mt-5 max-w-md text-pretty leading-relaxed text-white/75">
            {s.scene1Desc}
          </p>

          {/* Animated counters */}
          <div data-reveal className="mt-10 flex gap-10">
            {showroomStats.map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-3xl font-semibold tabular-nums text-white md:text-4xl">
                  <span data-counter data-counter-to={stat.value}>0</span>
                  <span className="text-accent">{stat.suffix}</span>
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Spec sheet card */}
        <div
          data-spec-card
          className="hidden rounded-xl border border-white/15 bg-black/40 p-6 backdrop-blur-md md:block rtl:order-1"
        >
          <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
            <span>{s.specSheetTitle}</span>
            <span className="text-accent">{s.specSheetCode}</span>
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
              {s.specAvailable}
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

function PortScene({ bgImage }: { bgImage?: string }) {
  const { t } = useLanguage()
  const s = t.home.services

  const routeStops = [
    { code: 'FTY', label: s.stop1Label, place: s.stop1Place, status: 'done',    meta: s.stop1Meta },
    { code: 'PRT', label: s.stop2Label, place: s.stop2Place, status: 'done',    meta: s.stop2Meta },
    { code: 'CAI', label: s.stop3Label, place: s.stop3Place, status: 'current', meta: s.stop3Meta },
    { code: 'FLT', label: s.stop4Label, place: s.stop4Place, status: 'pending', meta: s.stop4Meta },
  ]

  return (
    <SceneShell
      index={1}
      image={bgImage || '/images/scene-direct-import.png'}
      video="/videos/scene-port.mp4"
      alt={s.scene2Kicker}
    >
      <div className="max-w-xl">
        <SceneKicker index="02" kicker={s.scene2Kicker} />
        <h3 data-title className="mt-6 overflow-hidden text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
          <span data-title-line className="block">{s.scene2Title1}</span>
          <em data-title-line className="block font-serif italic text-accent">{s.scene2Title2}</em>
        </h3>
        <p data-reveal className="mt-5 max-w-md text-pretty leading-relaxed text-white/75">
          {s.scene2Desc}
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
                {s.trackingLabel}
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
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={`absolute start-[10px] top-6 h-full w-px ${
                        isDone ? 'bg-accent/60' : 'bg-white/15'
                      }`}
                    />
                  )}
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

function PartsScene({ bgImage }: { bgImage?: string }) {
  const { t } = useLanguage()
  const s = t.home.services

  const partCallouts = [
    { label: s.callout1Label, code: 'PN 074-145-701',  top: '22%', insetInlineEnd: '28%' },
    { label: s.callout2Label, code: 'PN 651-090-0052', top: '44%', insetInlineEnd: '10%' },
    { label: s.callout3Label, code: 'PN 910-421-002',  top: '64%', insetInlineEnd: '32%' },
  ]

  const partsStock = [
    { name: s.stock1Name, level: 92 },
    { name: s.stock2Name, level: 84 },
    { name: s.stock3Name, level: 97 },
  ]

  return (
    <SceneShell
      index={2}
      image={bgImage || '/images/scene-spare-parts.png'}
      video="/videos/scene-engine.mp4"
      alt={s.scene3Kicker}
    >
      {/* Scan sweep line */}
      <div
        data-scanline
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 z-0 w-px bg-gradient-to-b from-transparent via-accent/80 to-transparent"
        style={{ boxShadow: '0 0 24px 2px oklch(0.55 0.2 250 / 0.5)' }}
      />

      {/* HUD callouts over the engine */}
      <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
        {partCallouts.map((c) => (
          <div key={c.label} data-callout className="absolute" style={{ top: c.top, insetInlineEnd: c.insetInlineEnd }}>
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
        <SceneKicker index="03" kicker={s.scene3Kicker} />
        <h3 data-title className="mt-6 overflow-hidden text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
          <span data-title-line className="block">{s.scene3Title1}</span>
          <em data-title-line className="block font-serif italic text-accent">{s.scene3Title2}</em>
        </h3>
        <p data-reveal className="mt-5 max-w-md text-pretty leading-relaxed text-white/75">
          {s.scene3Desc}
        </p>

        {/* Live inventory bars */}
        <div data-reveal className="mt-10 max-w-md rounded-xl border border-white/15 bg-black/40 p-5 backdrop-blur-md">
          <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
            <span>{s.liveInventory}</span>
            <span className="flex items-center gap-1.5 text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              {s.inStock}
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

export function Services({ wpImages }: { wpImages?: import('@/lib/wp/page-images').PageImages }) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const isRtl = document.documentElement.dir === 'rtl'
      const panels = gsap.utils.toArray<HTMLElement>('[data-scene]')

      /* Play each background video whenever its scene is actually visible. */
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
            x: isRtl ? -60 : 60,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: enter,
          })
          gsap.from(panel.querySelectorAll('[data-spec-row]'), {
            x: isRtl ? -24 : 24,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            delay: 0.3,
            ease: 'power2.out',
            scrollTrigger: enter,
          })
        }

        /* Scene 02: timeline stops slide in */
        const routeStopEls = panel.querySelectorAll('[data-route-stop]')
        if (routeStopEls.length) {
          gsap.from(routeStopEls, {
            x: isRtl ? 24 : -24,
            opacity: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: enter,
          })
        }

        /* Scene 02: tracking code typewriter */
        const trackingCode = panel.querySelector<HTMLElement>('[data-tracking-code]')
        if (trackingCode) {
          const full = trackingCode.textContent ?? ''
          trackingCode.textContent = ''
          let idx = 0
          gsap.to({}, {
            duration: full.length * 0.06,
            ease: 'none',
            scrollTrigger: enter,
            // GSAP fires onUpdate synchronously on creation, before the const
            // assignment lands — read progress from `this` (the tween) instead.
            onUpdate(this: gsap.core.Tween) {
              const progress = Math.round(this.progress() * full.length)
              if (progress > idx) {
                idx = progress
                trackingCode.textContent = full.slice(0, idx)
              }
            },
          })
        }

        /* Scene 03: scan-line sweep */
        const scanLine = panel.querySelector('[data-scanline]')
        if (scanLine) {
          gsap.to(scanLine, {
            x: '100vw',
            duration: 3,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
            scrollTrigger: enter,
          })
        }

        /* Scene 03: callout ping lines grow */
        const calloutLines = panel.querySelectorAll('[data-callout-line]')
        if (calloutLines.length) {
          gsap.from(calloutLines, {
            scaleX: 0,
            stagger: 0.15,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: enter,
          })
        }

        /* Scene 03: stock bars fill */
        const stockBars = panel.querySelectorAll<HTMLElement>('[data-stock-bar]')
        stockBars.forEach((bar) => {
          const targetW = bar.style.width
          bar.style.width = '0%'
          gsap.to(bar, {
            width: targetW,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: enter,
          })
        })
      })

      /* Dwell spacers: each scene gets a full viewport height of scroll before
         the next panel takes over, giving time to read the content. */
      panels.forEach((panel) => {
        ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
          end: '+=100%',
          pin: true,
          pinSpacing: true,
        })
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} aria-label="Services">
      <ShowroomScene bgImage={wpImages?.serviceScene1} />
      <PortScene     bgImage={wpImages?.serviceScene2} />
      <PartsScene    bgImage={wpImages?.serviceScene3} />
    </section>
  )
}
