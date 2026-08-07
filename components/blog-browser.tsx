'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import type { BlogPost, BlogCategory } from '@/lib/data/blog'
import type { PostsStatus } from '@/lib/wp/posts'
import { BlogCard } from '@/components/blog-card'
import Link from 'next/link'

const ALL = 'all' as const
type Filter = typeof ALL | BlogCategory

type Props = {
  posts: BlogPost[]
  status: PostsStatus
}

export function BlogBrowser({ posts, status }: Props) {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState<Filter>(ALL)

  if (status === 'not_configured' || status === 'unreachable') {
    return (
      <div className="rounded-3xl bg-card p-12 text-center ring-1 ring-border">
        <p className="font-semibold text-foreground">{t.products.catalogUnavailable}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.products.catalogUnavailableLead}
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {t.common.callUs}
        </Link>
      </div>
    )
  }

  if (status === 'empty' || posts.length === 0) {
    return (
      <div className="rounded-3xl bg-card p-12 text-center ring-1 ring-border">
        <p className="font-semibold text-foreground">{t.products.catalogEmpty}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.products.catalogEmptyLead}</p>
      </div>
    )
  }

  const categories: { key: Filter; label: string }[] = [
    { key: ALL, label: t.blog.allPosts },
    { key: 'news', label: t.blog.categories.news },
    { key: 'import', label: t.blog.categories.import },
    { key: 'fleet', label: t.blog.categories.fleet },
    { key: 'parts', label: t.blog.categories.parts },
    { key: 'tips', label: t.blog.categories.tips },
  ]

  // Non-featured posts only (featured is shown separately in BlogHero)
  const nonFeatured = posts.filter((p) => !p.featured)
  const filtered =
    activeFilter === ALL
      ? nonFeatured
      : nonFeatured.filter((p) => p.category === activeFilter)

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.blog.allPosts}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveFilter(cat.key)}
            aria-pressed={activeFilter === cat.key}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === cat.key
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {filtered.map((post) => (
            <li key={post.slug}>
              <BlogCard post={post} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-center text-muted-foreground">{t.common.noResults}</p>
      )}
    </div>
  )
}
