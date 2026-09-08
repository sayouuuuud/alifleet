import type { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { pageAlternates } from '@/lib/seo/alternates'
import { getRequestLocale } from '@/lib/i18n/request-locale'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ContactSection } from '@/components/contact-section'

/** Title and description follow the visitor's language (see t.seo). */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const t = getDictionary(locale)
  return {
    title: t.seo.contactTitle,
    description: t.seo.contactDescription,
    alternates: pageAlternates('/contact/', locale),
  }
}

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  )
}
