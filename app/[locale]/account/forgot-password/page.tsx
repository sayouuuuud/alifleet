import type { Metadata } from 'next'
import { isWpConfigured } from '@/lib/wp/config'
import { AuthShell } from '@/components/account/auth-shell'
import { ForgotPasswordForm } from '@/components/account/forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset your password | ALI FLEET',
  description: 'Request a password reset link for your ALI FLEET account.',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell screen="forgot" configured={isWpConfigured()}>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
