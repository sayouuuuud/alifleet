'use client'

import { Suspense } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { PageHero } from '@/components/page-hero'
import { ContactDetails } from '@/components/contact-details'
import { ContactForm } from '@/components/contact-form'

export function ContactSection() {
  const { t } = useLanguage()

  return (
    <>
      <PageHero
        eyebrow={t.contact.eyebrow}
        title={t.contact.title}
        titleEm={t.contact.titleEm}
        lead={t.contact.lead}
      />
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8 md:pb-28">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:gap-12">
          <ContactDetails />
          <Suspense
            fallback={
              <div className="rounded-3xl bg-card p-8 ring-1 ring-border">
                <p className="text-sm text-muted-foreground">{t.common.loading}</p>
              </div>
            }
          >
            <ContactForm />
          </Suspense>
        </div>
      </section>
    </>
  )
}
