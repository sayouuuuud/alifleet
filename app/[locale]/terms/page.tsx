import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PolicyScreen } from '@/components/policy-screen'
import { getTermsPolicy } from '@/lib/wp/policies'
import { isLocale } from '@/lib/i18n/config'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Terms & Conditions | الشروط والأحكام | ALI FLEET',
  description:
    'Official terms and conditions of service for ALI FLEET customers, commercial vehicle purchases, and vehicle importing.',
  alternates: {
    canonical: '/terms',
  },
}

type PageProps = {
  searchParams?: Promise<{ locale?: string }>
}

export default async function TermsPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const rawLocale = resolvedParams?.locale
  const requestedLocale = typeof rawLocale === 'string' ? rawLocale.trim().toLowerCase() : undefined
  const activeLocale = isLocale(requestedLocale) ? requestedLocale : undefined

  const policy = await getTermsPolicy(activeLocale)

  return (
    <>
      <SiteHeader />
      <main>
        <PolicyScreen
          policyType="terms"
          policy={policy}
          initialLocale={activeLocale}
        />
      </main>
      <SiteFooter />
    </>
  )
}
