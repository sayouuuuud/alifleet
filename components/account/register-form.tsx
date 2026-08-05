'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { registerAction } from '@/lib/auth/actions'
import { idleActionState } from '@/lib/wp/types'
import { Field, PasswordField } from './form-field'
import { FormError } from './alerts'

export function RegisterForm() {
  const { t } = useLanguage()
  const [state, formAction, pending] = useActionState(
    registerAction,
    idleActionState
  )

  return (
    <form
      action={formAction}
      className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8"
    >
      <div className="flex flex-col gap-5">
        {state.status === 'error' ? (
          <FormError>
            {t.account.errors[
              state.code as keyof typeof t.account.errors
            ] ?? t.account.errors.unknown}
          </FormError>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.account.fields.firstName}
            name="firstName"
            required
            autoComplete="given-name"
            placeholder={t.account.placeholders.firstName}
            disabled={pending}
          />
          <Field
            label={t.account.fields.lastName}
            name="lastName"
            required
            autoComplete="family-name"
            placeholder={t.account.placeholders.lastName}
            disabled={pending}
          />
        </div>

        <Field
          label={t.account.fields.email}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.account.placeholders.email}
          disabled={pending}
        />

        <Field
          label={t.account.fields.username}
          name="username"
          autoComplete="username"
          placeholder={t.account.placeholders.username}
          hint={t.account.register.usernameHint}
          disabled={pending}
        />

        <Field
          label={t.account.fields.phone}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={t.account.placeholders.phone}
          disabled={pending}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField
            label={t.account.fields.password}
            name="password"
            required
            autoComplete="new-password"
            placeholder={t.account.placeholders.password}
            hint={t.account.register.passwordHint}
            disabled={pending}
          />
          <PasswordField
            label={t.account.fields.confirmPassword}
            name="confirmPassword"
            required
            autoComplete="new-password"
            placeholder={t.account.placeholders.password}
            disabled={pending}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.account.register.submitting}
            </>
          ) : (
            <>
              {t.account.register.submit}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {t.account.register.haveAccount}{' '}
          <Link
            href="/account/login"
            className="text-accent underline-offset-4 transition-colors hover:underline"
          >
            {t.account.register.loginLink}
          </Link>
        </p>
      </div>
    </form>
  )
}
