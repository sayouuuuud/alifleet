'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '@/lib/i18n/language-context'
import type { BlogPost } from '@/lib/data/blog'
import { BlogCard } from '@/components/blog-card'

gsap.registerPlugin(ScrollTrigger)

export function BlogHero({ featured }: { featured: BlogPost | null }) {
  const sectionRef = useRef<HTMLElement>(null)
  const { t } = useLanguage()

  useGSAP(
    () => {
      gsap.from('[data-blog-heading]', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
      })
      gsap.from('[data-blog-featured]', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.3,
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} className="pt-28 pb-12 md:pt-36 md:pb-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Heading */}
        <div className="mb-12 md:mb-16">
          <p
            data-blog-heading
            className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
          >
            {t.blog.eyebrow}
          </p>
          <h1
            data-blog-heading
            className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl"
          >
            {t.blog.title}{' '}
            <em className="font-serif italic text-accent">{t.blog.titleEm}</em>
          </h1>
          <p
            data-blog-heading
            className="mt-5 max-w-2xl text-pretty leading-relaxed text-muted-foreground"
          >
            {t.blog.lead}
          </p>
        </div>

        {/* Featured post */}
        {featured && (
          <div data-blog-featured>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t.blog.featured}
            </p>
            <BlogCard post={featured} featured />
          </div>
        )}
      </div>
    </section>
  )
}
