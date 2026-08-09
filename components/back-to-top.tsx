'use client'

import { ArrowUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

/**
 * Floating action button that appears once the visitor has scrolled a
 * screen's worth down the page and smooth-scrolls back to the top on click.
 * Mounted once in the root layout so it is available on every route.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      data-visible={visible}
      className="fixed bottom-6 end-6 z-50 flex size-11 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[visible=false]:pointer-events-none data-[visible=false]:translate-y-3 data-[visible=false]:opacity-0 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100"
    >
      <ArrowUp className="size-5" />
    </button>
  )
}
