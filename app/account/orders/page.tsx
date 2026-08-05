import type { Metadata } from 'next'
import { loadAccount } from '@/lib/auth/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { OrdersView } from '@/components/account/orders-view'

export const metadata: Metadata = {
  title: 'Order history | ALI FLEET',
  description:
    'Review every spare parts order you have placed with ALI FLEET, including status and contents.',
  robots: { index: false, follow: false },
}

export default async function OrdersPage() {
  const data = await loadAccount(50)

  if (data.state === 'error') return <AccountGuard code={data.code} />

  return <OrdersView orders={data.customer.orders} />
}
