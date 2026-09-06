'use client'

import { ReactLenis, useLenis } from 'lenis/react'
import { ReactNode, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Make GSAP lag smoothing compatible with Lenis
    gsap.ticker.lagSmoothing(0)
  }, [])

  // Update ScrollTrigger whenever Lenis scrolls
  useLenis(ScrollTrigger.update)

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}

