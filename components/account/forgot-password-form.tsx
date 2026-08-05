'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { forgotPasswordAction } from '@/lib/auth/actions'
import { idleActionState } from '@/lib/wp/types'
import { Field } from './form-field'
import { FormError, FormSuccess } from './alerts'

export function ForgotPasswordForm() {
  const { t } = useLanguage()
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    idleActionState
  )

  // On success we replace the form entirely — resubmitting serves no purpose
  // and the neutral wording avoids confirming whether an account exists.
  if (state.status === 'success') {
    return (
      <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
        <div className="flex flex-col gap-5">
          <FormSuccess>{t.account.forgot.successLead}</FormSuccess>
          <h2 className="font-serif text-xl tracking-tight text-foreground">
            {t.account.forgot.successTitle}
          </h2>
          <Link
            href="/account/login"
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t.account.forgot.backToLogin}
          </Link>
        </div>
      </div>
    )
  }

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

        <Field
          label={t.account.fields.usernameOrEmail}
          name="usernameOrEmail"
          required
          autoComplete="username"
          placeholder={t.account.placeholders.usernameOrEmail}
          disabled={pending}
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.account.forgot.submitting}
            </>
          ) : (
            <>
              {t.account.forgot.submit}
              <Send className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>

        <Link
          href="/account/login"
          className="text-center text-sm text-accent underline-offset-4 transition-colors hover:underline"
        >
          {t.account.forgot.backToLogin}
        </Link>
      </div>
    </form>
  )
}
