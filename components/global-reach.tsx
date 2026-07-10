'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import createGlobe from 'cobe'
import { useMotionValue, useSpring } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Globe2, ShieldCheck, Truck, Plane, Ship } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const MARKERS: { location: [number, number]; size: number }[] = [
  { location: [14.5995, 120.9842], size: 0.03 }, // Manila
  { location: [19.076, 72.8777], size: 0.05 }, // Mumbai
  { location: [23.8103, 90.4125], size: 0.03 }, // Dhaka
  { location: [30.0444, 31.2357], size: 0.08 }, // Cairo
  { location: [39.9042, 116.4074], size: 0.06 }, // Beijing
  { location: [-23.5505, -46.6333], size: 0.05 }, // São Paulo
  { location: [19.4326, -99.1332], size: 0.04 }, // Mexico City
  { location: [40.7128, -74.006], size: 0.07 }, // New York
  { location: [34.6937, 135.5022], size: 0.04 }, // Osaka
  { location: [41.0082, 28.9784], size: 0.04 }, // Istanbul
  { location: [51.5074, -0.1278], size: 0.06 }, // London
  { location: [48.8566, 2.3522], size: 0.05 }, // Paris
]

// Importing Services data — each feature spins the globe to a representative market
const IMPORT_FEATURES: {
  icon: typeof Globe2
  title: string
  text: string
  city: string
  lat: number
  lng: number
}[] = [
  {
    icon: Globe2,
    title: 'Global Sourcing',
    text: 'Direct access to markets in Europe, Asia, and the Americas for trucks and luxury vehicles.',
    city: 'London',
    lat: 51.5074,
    lng: -0.1278,
  },
  {
    icon: ShieldCheck,
    title: 'Full Compliance',
    text: 'Customs clearance, documentation, and homologation handled end-to-end.',
    city: 'Beijing',
    lat: 39.9042,
    lng: 116.4074,
  },
  {
    icon: Truck,
    title: 'Door-to-Door Delivery',
    text: 'Secure international shipping with real-time tracking, right to your location.',
    city: 'New York',
    lat: 40.7128,
    lng: -74.006,
  },
]

function locationToAngles(lat: number, lng: number): [number, number] {
  return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180]
}

export function GlobalReach() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Start facing Cairo / Europe so land is visible immediately
  const phiRef = useRef(locationToAngles(30.0444, 31.2357)[0])
  const thetaRef = useRef(0.3)
  const focusRef = useRef<[number, number] | null>(null)
  const draggingRef = useRef(false)
  const pointerStartX = useRef(0)
  const dragStartOffset = useRef(0)

  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const dragOffset = useMotionValue(0)
  const springOffset = useSpring(dragOffset, { mass: 1, stiffness: 280, damping: 40 })

  const focusCity = useCallback((lat: number, lng: number, city: string) => {
    focusRef.current = locationToAngles(lat, lng)
    setActiveCity(city)
  }, [])

  const releaseFocus = useCallback(() => {
    focusRef.current = null
    setActiveCity(null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    let width = wrapper.offsetWidth
    const onResize = () => {
      width = wrapper.offsetWidth
      canvas.width = width * 2
      canvas.height = width * 2
    }
    onResize()
    window.addEventListener('resize', onResize)

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 24000,
      mapBrightness: 6,
      mapBaseBrightness: 0,
      baseColor: [0.12, 0.16, 0.24],
      markerColor: [0.29, 0.62, 1],
      glowColor: [0.9, 0.92, 0.96],
      markers: MARKERS,
      onRender: (state) => {
        const focus = focusRef.current
        if (focus) {
          const [targetPhi, targetTheta] = focus
          const spring = springOffset.get()
          const currentTotal = phiRef.current + spring
          const distA = (targetPhi - currentTotal) % (Math.PI * 2)
          const distB = distA - Math.PI * 2 * Math.sign(distA)
          const dist = Math.abs(distA) < Math.abs(distB) ? distA : distB
          phiRef.current += dist * 0.08
          thetaRef.current += (targetTheta * 0.9 - thetaRef.current) * 0.08
        } else {
          if (!draggingRef.current) phiRef.current += 0.005
          thetaRef.current += (0.3 - thetaRef.current) * 0.05
        }
        state.phi = phiRef.current + springOffset.get()
        state.theta = thetaRef.current
        state.width = width * 2
        state.height = width * 2
      },
    })

    const timeout = setTimeout(() => setReady(true), 100)

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true
      pointerStartX.current = e.clientX
      dragStartOffset.current = dragOffset.get()
      canvas.style.cursor = 'grabbing'
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const delta = e.clientX - pointerStartX.current
      dragOffset.set(dragStartOffset.current + delta / 200)
    }
    const onPointerUp = () => {
      draggingRef.current = false
      canvas.style.cursor = 'grab'
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current || !e.touches[0]) return
      const delta = e.touches[0].clientX - pointerStartX.current
      dragOffset.set(dragStartOffset.current + delta / 100)
    }
    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return
      draggingRef.current = true
      pointerStartX.current = e.touches[0].clientX
      dragStartOffset.current = dragOffset.get()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onPointerUp)

    return () => {
      globe.destroy()
      clearTimeout(timeout)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onPointerUp)
    }
  }, [dragOffset, springOffset])

  useGSAP(
    () => {
      // Entrance animations
      gsap.from('[data-globe-copy]', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
      gsap.from('[data-globe-feature]', {
        x: -24,
        opacity: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      })
      gsap.from('[data-globe-canvas]', {
        scale: 0.85,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
      gsap.from('[data-globe-chip]', {
        scale: 0,
        opacity: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 0.6,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })

      // Continuous ambient motion
      gsap.to('[data-orbit-ring]', {
        rotate: 360,
        duration: 40,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      })
      gsap.to('[data-orbit-ring-2]', {
        rotate: -360,
        duration: 55,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      })
      // Floating chips bob gently
      gsap.utils.toArray<HTMLElement>('[data-globe-chip]').forEach((chip, i) => {
        gsap.to(chip, {
          y: i % 2 === 0 ? -12 : 12,
          duration: 2.4 + i * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })
      // Orbiting satellite container spins, icons counter-rotate to stay upright
      gsap.to('[data-satellite-track]', {
        rotate: 360,
        duration: 22,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      })
      gsap.to('[data-satellite]', {
        rotate: -360,
        duration: 22,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="importing" className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy + import features */}
          <div className="order-2 flex flex-col gap-8 lg:order-1">
            <div className="flex flex-col gap-4">
              <p
                data-globe-copy
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
              >
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                Importing Services
              </p>
              <h2
                data-globe-copy
                className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl"
              >
                The world&apos;s finest, <em className="font-serif italic text-accent">imported</em> for you
              </h2>
              <p data-globe-copy className="max-w-md text-pretty leading-relaxed text-muted-foreground">
                We import trucks and luxury vehicles from every major market. Our
                global network keeps your vehicle moving — hover a service to spin
                the globe to its market.
              </p>
            </div>

            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {IMPORT_FEATURES.map((feature) => {
                const isActive = activeCity === feature.city
                return (
                  <li key={feature.title} data-globe-feature>
                    <button
                      type="button"
                      onMouseEnter={() => focusCity(feature.lat, feature.lng, feature.city)}
                      onMouseLeave={releaseFocus}
                      onFocus={() => focusCity(feature.lat, feature.lng, feature.city)}
                      onBlur={releaseFocus}
                      className={`group flex w-full items-start gap-4 px-2 py-5 text-left transition-colors duration-300 ${
                        isActive ? 'bg-secondary' : 'bg-transparent'
                      }`}
                      aria-label={`${feature.title} — focus globe on ${feature.city}`}
                    >
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          isActive
                            ? 'scale-110 bg-accent text-accent-foreground'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        <feature.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-1">
                        <span
                          className={`font-medium transition-transform duration-300 ${
                            isActive ? 'translate-x-1 text-accent' : 'text-foreground'
                          }`}
                        >
                          {feature.title}
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">
                          {feature.text}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Globe + floating objects */}
          <div className="order-1 flex items-center justify-center lg:order-2">
            <div
              data-globe-canvas
              className="relative aspect-square w-[min(600px,90vw)] md:w-[520px] lg:w-[560px]"
            >
              {/* Rotating orbit rings */}
              <svg
                data-orbit-ring
                className="pointer-events-none absolute inset-0 h-full w-full text-accent/25"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="49"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.4"
                  strokeDasharray="2 3"
                />
              </svg>
              <svg
                data-orbit-ring-2
                className="pointer-events-none absolute inset-[8%] h-[84%] w-[84%] text-border"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="49"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.3"
                  strokeDasharray="1 6"
                />
              </svg>

              {/* Orbiting satellites (plane + ship) */}
              <div
                data-satellite-track
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                <div
                  data-satellite
                  className="absolute left-1/2 top-0 -translate-x-1/2 flex size-9 items-center justify-center rounded-full border border-border bg-background/90 text-accent shadow-sm backdrop-blur-md"
                >
                  <Plane className="size-4" />
                </div>
                <div
                  data-satellite
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 flex size-9 items-center justify-center rounded-full border border-border bg-background/90 text-accent shadow-sm backdrop-blur-md"
                >
                  <Ship className="size-4" />
                </div>
              </div>

              {/* Globe canvas wrapper */}
              <div ref={wrapperRef} className="absolute inset-[6%]" style={{ contain: 'layout paint size' }}>
                <canvas
                  ref={canvasRef}
                  className="h-full w-full cursor-grab transition-opacity duration-1000"
                  style={{ opacity: ready ? 1 : 0, aspectRatio: '1' }}
                  aria-label="Interactive 3D globe showing ALI FLEET import markets worldwide"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at center, transparent 0%, transparent 58%, oklch(0.985 0.002 240 / 0.55) 78%, var(--background) 96%)',
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Floating glass stat chips */}
              <div
                data-globe-chip
                className="absolute -left-2 top-[18%] flex items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md md:-left-6"
              >
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                40+ Countries
              </div>
              <div
                data-globe-chip
                className="absolute -right-2 top-[62%] flex items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md md:-right-6"
              >
                <span className="size-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
                Live Tracking
              </div>

              {/* Active city floating label */}
              {activeCity ? (
                <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-border bg-background/90 px-4 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-md">
                  {activeCity}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
