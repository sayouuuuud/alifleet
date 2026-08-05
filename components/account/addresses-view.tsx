'use client'

import { useActionState, useRef } from 'react'
import { ClipboardCopy, Loader2, Save } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { updateAddressesAction } from '@/lib/auth/actions'
import { idleActionState, type WpAddress } from '@/lib/wp/types'
import { Field } from './form-field'
import { FormError, FormSuccess } from './alerts'

const ADDRESS_KEYS = [
  'firstName',
  'lastName',
  'company',
  'address1',
  'address2',
  'city',
  'state',
  'postcode',
  'country',
  'phone',
] as const

function AddressFieldset({
  prefix,
  title,
  lead,
  address,
  disabled,
  withEmail = false,
}: {
  prefix: 'billing' | 'shipping'
  title: string
  lead: string
  address: WpAddress
  disabled: boolean
  withEmail?: boolean
}) {
  const { t } = useLanguage()

  return (
    <fieldset className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-serif text-xl tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {lead}
      </p>

      <div className="mt-5 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.account.fields.firstName}
            name={`${prefix}_firstName`}
            defaultValue={address.firstName}
            placeholder={t.account.placeholders.firstName}
            disabled={disabled}
          />
          <Field
            label={t.account.fields.lastName}
            name={`${prefix}_lastName`}
            defaultValue={address.lastName}
            placeholder={t.account.placeholders.lastName}
            disabled={disabled}
          />
        </div>

        <Field
          label={t.account.fields.company}
          name={`${prefix}_company`}
          defaultValue={address.company}
          placeholder={t.account.placeholders.company}
          disabled={disabled}
        />

        <Field
          label={t.account.fields.address1}
          name={`${prefix}_address1`}
          defaultValue={address.address1}
          placeholder={t.account.placeholders.address1}
          disabled={disabled}
        />
        <Field
          label={t.account.fields.address2}
          name={`${prefix}_address2`}
          defaultValue={address.address2}
          placeholder={t.account.placeholders.address2}
          disabled={disabled}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.account.fields.city}
            name={`${prefix}_city`}
            defaultValue={address.city}
            placeholder={t.account.placeholders.city}
            disabled={disabled}
          />
          <Field
            label={t.account.fields.state}
            name={`${prefix}_state`}
            defaultValue={address.state}
            placeholder={t.account.placeholders.state}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.account.fields.postcode}
            name={`${prefix}_postcode`}
            defaultValue={address.postcode}
            placeholder={t.account.placeholders.postcode}
            disabled={disabled}
          />
          <Field
            label={t.account.fields.country}
            name={`${prefix}_country`}
            defaultValue={address.country}
            placeholder={t.account.placeholders.country}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t.account.fields.phone}
            name={`${prefix}_phone`}
            type="tel"
            defaultValue={address.phone}
            placeholder={t.account.placeholders.phone}
            disabled={disabled}
          />
          {withEmail ? (
            <Field
              label={t.account.fields.email}
              name={`${prefix}_email`}
              type="email"
              defaultValue={address.email ?? ''}
              placeholder={t.account.placeholders.email}
              disabled={disabled}
            />
          ) : null}
        </div>
      </div>
    </fieldset>
  )
}

export function AddressesView({
  billing,
  shipping,
}: {
  billing: WpAddress
  shipping: WpAddress
}) {
  const { t } = useLanguage()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    updateAddressesAction,
    idleActionState
  )

  /**
   * Copies the billing inputs into the shipping inputs in place, so the visitor
   * can still tweak them before saving.
   */
  function copyBillingToShipping() {
    const form = formRef.current
    if (!form) return
    for (const key of ADDRESS_KEYS) {
      const from = form.elements.namedItem(
        `billing_${key}`
      ) as HTMLInputElement | null
      const to = form.elements.namedItem(
        `shipping_${key}`
      ) as HTMLInputElement | null
      if (from && to) to.value = from.value
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {t.account.eyebrow}
        </p>
        <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.08] tracking-tight text-foreground md:text-5xl">
          {t.account.addresses.title}{' '}
          <em className="italic text-accent">{t.account.addresses.titleEm}</em>
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          {t.account.addresses.lead}
        </p>
      </header>

      <form
        ref={formRef}
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
            <FormSuccess>{t.account.addresses.saved}</FormSuccess>
          ) : null}

          <AddressFieldset
            prefix="billing"
            title={t.account.addresses.billingTitle}
            lead={t.account.addresses.billingLead}
            address={billing}
            disabled={pending}
            withEmail
          />

          <div className="border-t border-border pt-6">
            <button
              type="button"
              onClick={copyBillingToShipping}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
              {t.account.addresses.sameAsBilling}
            </button>
          </div>

          <AddressFieldset
            prefix="shipping"
            title={t.account.addresses.shippingTitle}
            lead={t.account.addresses.shippingLead}
            address={shipping}
            disabled={pending}
          />

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t.account.addresses.saving}
              </>
            ) : (
              <>
                {t.account.addresses.save}
                <Save className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
