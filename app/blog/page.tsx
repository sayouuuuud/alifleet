import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BlogHero } from '@/components/blog-hero'
import { BlogBrowser } from '@/components/blog-browser'
import { ChatbotWidget } from '@/components/chatbot-widget'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — ALI FLEET',
  description:
    'Industry news, import tips, fleet management guides and behind-the-scenes stories from the ALI FLEET team.',
}

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <BlogHero />
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <BlogBrowser />
          </div>
        </section>
      </main>
      <SiteFooter />
      <ChatbotWidget />
    </>
  )
}
