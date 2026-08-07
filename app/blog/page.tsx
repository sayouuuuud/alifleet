import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BlogHero } from '@/components/blog-hero'
import { BlogBrowser } from '@/components/blog-browser'
import { getPosts } from '@/lib/wp/posts'

export const metadata: Metadata = {
  title: 'Blog — ALI FLEET',
  description:
    'Industry news, import tips, fleet management guides and behind-the-scenes stories from the ALI FLEET team.',
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
