import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ContactSection } from '@/components/contact-section'

export const metadata: Metadata = {
  title: 'Contact | ALI FLEET',
  description:
    'Talk to the ALI FLEET team about spare parts, vehicle imports or a full fleet plan. We reply within one business day.',
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
