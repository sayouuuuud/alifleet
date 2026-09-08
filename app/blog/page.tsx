import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { pageAlternates } from '@/lib/seo/alternates'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BlogHero } from '@/components/blog-hero'
import { BlogBrowser } from '@/components/blog-browser'
import { getPosts } from '@/lib/wp/posts'

/** Title and description follow the visitor's language (see t.seo). */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const t = getDictionary(locale)
  return {
    title: t.seo.blogTitle,
    description: t.seo.blogDescription,
    alternates: pageAlternates('/blog/', locale),
  }
}

export default async function BlogPage() {
  const { posts, featured, status } = await getPosts()

  return (
    <>
      <SiteHeader />
      <main>
        <BlogHero featured={featured} />
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <BlogBrowser posts={posts} status={status} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
