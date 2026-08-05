'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { loginAction } from '@/lib/auth/actions'
import { idleActionState } from '@/lib/wp/types'
import { Field, PasswordField } from './form-field'
import { FormError, FormSuccess } from './alerts'

export function LoginForm() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [state, formAction, pending] = useActionState(
    loginAction,
    idleActionState
  )

  // Preserved so users land back where they were sent from after signing in.
  const redirectTo = searchParams.get('redirect') ?? '/account'
  const justRegistered = searchParams.get('registered') === '1'

  return (
    <form
      action={formAction}
      className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-5">
        {justRegistered && state.status === 'idle' ? (
          <FormSuccess>{t.account.register.manualLoginLead}</FormSuccess>
        ) : null}

        {state.status === 'error' ? (
          <FormError>
            {t.account.errors[
              state.code as keyof typeof t.account.errors
            ] ?? t.account.errors.unknown}
          </FormError>
        ) : null}

        <Field
          label={t.account.fields.usernameOrEmail}
          name="usernameOrEmail"
          required
          autoComplete="username"
          placeholder={t.account.placeholders.usernameOrEmail}
          disabled={pending}
        />

        <PasswordField
          label={t.account.fields.password}
          name="password"
          required
          autoComplete="current-password"
          placeholder={t.account.placeholders.password}
          disabled={pending}
        />

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/account/forgot-password"
            className="text-sm text-accent underline-offset-4 transition-colors hover:underline"
          >
            {t.account.login.forgotLink}
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.account.login.submitting}
            </>
          ) : (
            <>
              {t.account.login.submit}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {t.account.login.noAccount}{' '}
          <Link
            href="/account/register"
            className="text-accent underline-offset-4 transition-colors hover:underline"
          >
            {t.account.login.registerLink}
          </Link>
        </p>
      </div>
    </form>
  )
}
