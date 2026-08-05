import type { Metadata } from 'next'
import { loadAccount } from '@/lib/auth/queries'
import { AccountGuard } from '@/components/account/account-guard'
import { ProfileView } from '@/components/account/profile-view'

export const metadata: Metadata = {
  title: 'Personal details | ALI FLEET',
  description:
    'Update the name, email address and password on your ALI FLEET account.',
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  const data = await loadAccount(0)

  if (data.state === 'error') return <AccountGuard code={data.code} />

  return <ProfileView customer={data.customer} />
}
