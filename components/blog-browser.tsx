'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { blogPosts, type BlogCategory } from '@/lib/data/blog'
import { BlogCard } from '@/components/blog-card'

const ALL = 'all' as const
type Filter = typeof ALL | BlogCategory

export function BlogBrowser() {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState<Filter>(ALL)

  const categories: { key: Filter; label: string }[] = [
    { key: ALL, label: t.blog.allPosts },
    { key: 'news', label: t.blog.categories.news },
    { key: 'import', label: t.blog.categories.import },
    { key: 'fleet', label: t.blog.categories.fleet },
    { key: 'parts', label: t.blog.categories.parts },
    { key: 'tips', label: t.blog.categories.tips },
  ]

  // Non-featured posts only (featured is shown separately)
  const nonFeatured = blogPosts.filter((p) => !p.featured)
  const filtered =
    activeFilter === ALL
      ? nonFeatured
      : nonFeatured.filter((p) => p.category === activeFilter)

  return (
    <div>
      {/* Category filter */}
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

      {/* Grid */}
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
