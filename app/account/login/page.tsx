import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { isWpConfigured } from '@/lib/wp/config'
import { getAuthToken } from '@/lib/auth/session'
import { AuthShell } from '@/components/account/auth-shell'
import { LoginForm } from '@/components/account/login-form'

export const metadata: Metadata = {
  title: 'Sign in | ALI FLEET',
  description:
    'Sign in to your ALI FLEET account to track spare parts orders, manage delivery addresses and reorder in seconds.',
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  // Already signed in? Skip the form entirely.
  if (await getAuthToken()) redirect('/account')

  return (
    <AuthShell screen="login" configured={isWpConfigured()}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
