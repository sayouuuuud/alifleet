import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isWpConfigured } from '@/lib/wp/config'
import { getAuthToken } from '@/lib/auth/session'
import { AuthShell } from '@/components/account/auth-shell'
import { RegisterForm } from '@/components/account/register-form'

export const metadata: Metadata = {
  title: 'Create an account | ALI FLEET',
  description:
    'Create your ALI FLEET account for spare parts orders, vehicle import requests and delivery tracking.',
  robots: { index: false, follow: false },
}

export default async function RegisterPage() {
  if (await getAuthToken()) redirect('/account')

  return (
    <AuthShell screen="register" configured={isWpConfigured()}>
      <RegisterForm />
    </AuthShell>
  )
}
