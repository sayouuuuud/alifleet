import type { Metadata } from 'next'
import { loadAccount } from '@/lib/auth/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { DashboardView } from '@/components/account/dashboard-view'

export const metadata: Metadata = {
  title: 'My account | ALI FLEET',
  description:
    'Your ALI FLEET account overview: recent spare parts orders, contact details and delivery addresses.',
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const data = await loadAccount(5)

  if (data.state === 'error') return <AccountGuard code={data.code} />

  return <DashboardView customer={data.customer} viewer={data.viewer} />
}
