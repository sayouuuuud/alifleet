'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Clock } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import type { BlogPost, BlogCategory } from '@/lib/data/blog'
import { proxied } from '@/lib/img-proxy'

function getLocalizedTitle(post: BlogPost, locale: string) {
  if (locale === 'ar') return post.titleAr
  if (locale === 'he') return post.titleHe
  return post.titleEn
}

function getLocalizedExcerpt(post: BlogPost, locale: string) {
  if (locale === 'ar') return post.excerptAr
  if (locale === 'he') return post.excerptHe
  return post.excerptEn
}

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(
      locale === 'ar' ? 'ar-SA' : locale === 'he' ? 'he-IL' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' }
    ).format(new Date(iso))
  } catch {
    return iso
  }
}

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const { locale, t } = useLanguage()
  const title = getLocalizedTitle(post, locale)
  const excerpt = getLocalizedExcerpt(post, locale)
  const categoryLabel = t.blog.categories[post.category as BlogCategory] ?? post.category
  const date = formatDate(post.publishedAt, locale)

  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-3xl bg-primary lg:flex-row lg:min-h-[480px]"
        aria-label={title}
      >
        {/* Image */}
        <div className="relative h-64 w-full shrink-0 lg:h-auto lg:w-[55%]">
          <Image
            src={proxied(post.coverImage)}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/60 lg:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent lg:hidden" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-8 lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                {t.blog.featured}
              </span>
              <span className="inline-flex rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
                {categoryLabel}
              </span>
            </div>
            <h2 className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-tight text-primary-foreground md:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-primary-foreground/70 md:text-base">
              {excerpt}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-primary-foreground/20">
                <Image src={proxied(post.authorAvatar)} alt={post.authorName} fill className="object-cover" sizes="32px" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary-foreground/90">{post.authorName}</p>
                <p className="text-[11px] text-primary-foreground/50">{date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-primary-foreground/50">
                <Clock className="size-3.5" aria-hidden="true" />
                {post.readingMinutes} {t.blog.minRead}
              </span>
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-foreground/5"
      aria-label={title}
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={proxied(post.coverImage)}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute start-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 text-balance text-base font-semibold leading-snug tracking-tight text-foreground">
          {title}
        </h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {excerpt}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{date}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden="true" />
            {post.readingMinutes} {t.blog.minRead}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-accent transition-gap group-hover:gap-2">
          {t.blog.readMore}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
