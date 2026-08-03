'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { ArrowRight, Mail, Phone } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { siteConfig } from '@/lib/site-config'

gsap.registerPlugin(ScrollTrigger)

export function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { t } = useLanguage()

  useGSAP(
    () => {
      gsap.from('[data-cta-reveal]', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="contact" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center rounded-3xl bg-primary px-6 py-16 text-center md:px-16 md:py-24">
          <p
            data-cta-reveal
            className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
          >
            {t.home.cta.eyebrow}
          </p>
          <h2
            data-cta-reveal
            className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-primary-foreground md:text-5xl"
          >
            {t.home.cta.title}
          </h2>
          <p
            data-cta-reveal
            className="mt-5 max-w-xl text-pretty leading-relaxed text-primary-foreground/70"
          >
            {t.home.cta.lead}
          </p>

          <div data-cta-reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <Mail className="size-4" aria-hidden="true" />
              {t.home.cta.primary}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
                data-flip-rtl
              />
            </Link>
            <a
              href={siteConfig.phoneHref}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/25 px-7 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <Phone className="size-4" aria-hidden="true" />
              {t.common.callUs}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
