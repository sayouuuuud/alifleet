'use client'

import { useActionState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { updateProfileAction } from '@/lib/auth/actions'
import { idleActionState, type Customer } from '@/lib/wp/types'
import { Field, PasswordField } from './form-field'
import { FormError, FormSuccess } from './alerts'

export function ProfileView({ customer }: { customer: Customer }) {
  const { t } = useLanguage()
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    idleActionState
  )

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {t.account.eyebrow}
        </p>
        <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.08] tracking-tight text-foreground md:text-5xl">
          {t.account.profile.title}{' '}
          <em className="italic text-accent">{t.account.profile.titleEm}</em>
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          {t.account.profile.lead}
        </p>
      </header>

      <form
        action={formAction}
        className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8"
      >
        <div className="flex flex-col gap-6">
          {state.status === 'error' ? (
            <FormError>
              {t.account.errors[
                state.code as keyof typeof t.account.errors
              ] ?? t.account.errors.unknown}
            </FormError>
          ) : null}
          {state.status === 'success' ? (
            <FormSuccess>{t.account.profile.saved}</FormSuccess>
          ) : null}

          <section>
            <h2 className="font-serif text-xl tracking-tight text-foreground">
              {t.account.profile.sectionDetails}
            </h2>
            <div className="mt-5 flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label={t.account.fields.firstName}
                  name="firstName"
                  defaultValue={customer.firstName}
                  autoComplete="given-name"
                  placeholder={t.account.placeholders.firstName}
                  disabled={pending}
                />
                <Field
                  label={t.account.fields.lastName}
                  name="lastName"
                  defaultValue={customer.lastName}
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
                defaultValue={customer.email}
                autoComplete="email"
                placeholder={t.account.placeholders.email}
                disabled={pending}
              />
            </div>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="font-serif text-xl tracking-tight text-foreground">
              {t.account.profile.sectionPassword}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t.account.profile.passwordLead}
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <PasswordField
                label={t.account.fields.newPassword}
                name="newPassword"
                autoComplete="new-password"
                placeholder={t.account.placeholders.password}
                disabled={pending}
              />
              <PasswordField
                label={t.account.fields.confirmPassword}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder={t.account.placeholders.password}
                disabled={pending}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t.account.profile.saving}
              </>
            ) : (
              <>
                {t.account.profile.save}
                <Save className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
