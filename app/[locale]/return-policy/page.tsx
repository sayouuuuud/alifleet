import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PolicyScreen } from '@/components/policy-screen'
import { getReturnPolicy } from '@/lib/wp/policies'
import { isLocale } from '@/lib/i18n/config'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Refund & Returns Policy | سياسة الإرجاع والاستبدال | ALI FLEET',
  description:
    'Official refund, return, and exchange policy for ALI FLEET spare parts, equipment, and vehicle purchases.',
  alternates: {
    canonical: '/return-policy',
  },
}

type PageProps = {
  searchParams?: Promise<{ locale?: string }>
}

export default async function ReturnPolicyPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const rawLocale = resolvedParams?.locale
  const requestedLocale = typeof rawLocale === 'string' ? rawLocale.trim().toLowerCase() : undefined
  const activeLocale = isLocale(requestedLocale) ? requestedLocale : undefined

  const policy = await getReturnPolicy(activeLocale)

  return (
    <>
      <SiteHeader />
      <main>
        <PolicyScreen
          policyType="return"
          policy={policy}
          initialLocale={activeLocale}
        />
      </main>
      <SiteFooter />
    </>
  )
}
