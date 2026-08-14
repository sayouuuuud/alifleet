'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Full-screen brand loader shown on the very first visit of a session.
 *
 * It is rendered on top of the app (not instead of it), so the page underneath
 * keeps hydrating while the overlay fades out — nothing is blocked waiting for
 * the loader. It hides on `window.load` (or after a hard 2.5s cap so a slow
 * third-party asset can never trap the visitor behind it), then unmounts once
 * the fade transition has finished.
 */
export function SiteLoader() {
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
  const startRef = useRef(Date.now())

  useEffect(() => {
    let hideTimer: number
    const finish = () => {
      // Keep it on screen just long enough to read as intentional rather than
      // as a flash of a spinner.
      const elapsed = Date.now() - startRef.current
      hideTimer = window.setTimeout(() => setDone(true), Math.max(0, 650 - elapsed))
    }

    if (document.readyState === 'complete') {
      finish()
    } else {
      window.addEventListener('load', finish, { once: true })
    }

    // Safety cap: never hold the overlay longer than this.
    const cap = window.setTimeout(() => setDone(true), 2500)

    return () => {
      window.removeEventListener('load', finish)
      window.clearTimeout(hideTimer)
      window.clearTimeout(cap)
    }
  }, [])

  // Unmount after the fade so the overlay stops costing a compositor layer.
  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setGone(true), 600)
    return () => window.clearTimeout(t)
  }, [done])

  /* NOTE: this used to set `document.body.style.overflow = 'hidden'` while the
     overlay was up. That locked the page during the exact window in which GSAP
     ScrollTrigger measures the document, so every scroll-triggered reveal got
     computed against a frozen page and sections stayed blank or fired at the
     wrong point. The overlay covers the viewport anyway, so no lock is needed —
     and once it is gone we tell ScrollTrigger to re-measure. */
  useEffect(() => {
    if (!gone) return
    ScrollTrigger.refresh()
  }, [gone])

  if (gone) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo with a sweeping ring around it */}
      <div className="relative flex size-28 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-2 border-accent/15 border-t-accent [animation-duration:1.1s]"
        />
        <Image
          src="/logo-mark.png"
          alt=""
          width={72}
          height={72}
          priority
          className="size-16 animate-pulse [animation-duration:1.8s]"
        />
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        Ali Fleet
      </p>

      {/* Indeterminate progress bar */}
      <div className="mt-4 h-px w-40 overflow-hidden bg-border">
        <span aria-hidden="true" className="block h-full w-1/3 animate-loader-sweep bg-accent" />
      </div>

      <span className="sr-only">Loading Ali Fleet</span>
    </div>
  )
}
