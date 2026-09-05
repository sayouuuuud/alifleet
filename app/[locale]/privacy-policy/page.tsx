import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PolicyScreen } from '@/components/policy-screen'
import { getPrivacyPolicy } from '@/lib/wp/policies'
import { isLocale } from '@/lib/i18n/config'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Privacy Policy | سياسة الخصوصية | ALI FLEET',
  description:
    'Official privacy policy and data protection terms for ALI FLEET customers, visitors, and commercial vehicle clients.',
  alternates: {
    canonical: '/privacy-policy',
  },
}

type PageProps = {
  searchParams?: Promise<{ locale?: string }>
}

export default async function PrivacyPolicyPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const rawLocale = resolvedParams?.locale
  const requestedLocale = typeof rawLocale === 'string' ? rawLocale.trim().toLowerCase() : undefined
  const activeLocale = isLocale(requestedLocale) ? requestedLocale : undefined

  const policy = await getPrivacyPolicy(activeLocale)

  return (
    <>
      <SiteHeader />
      <main>
        <PolicyScreen
          policyType="privacy"
          policy={policy}
          initialLocale={activeLocale}
        />
      </main>
      <SiteFooter />
    </>
  )
}
