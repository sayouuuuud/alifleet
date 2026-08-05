import type { Metadata } from 'next'
import { loadAccount } from '@/lib/auth/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { AddressesView } from '@/components/account/addresses-view'

export const metadata: Metadata = {
  title: 'Addresses | ALI FLEET',
  description:
    'Manage the billing and shipping addresses used for your ALI FLEET spare parts orders.',
  robots: { index: false, follow: false },
}

export default async function AddressesPage() {
  const data = await loadAccount(0)

  if (data.state === 'error') return <AccountGuard code={data.code} />

  return (
    <AddressesView
      billing={data.customer.billing}
      shipping={data.customer.shipping}
    />
  )
}
