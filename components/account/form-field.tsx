'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'

export const fieldClass =
  'mt-2 w-full rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-accent disabled:opacity-60'
export const labelClass = 'block text-sm font-medium text-foreground'

type FieldProps = {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  defaultValue?: string
  autoComplete?: string
  hint?: string
  disabled?: boolean
}

export function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  defaultValue,
  autoComplete,
  hint,
  disabled,
}: FieldProps) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} {required ? <span className="text-accent">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        disabled={disabled}
        className={fieldClass}
      />
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/**
 * Password input with a show/hide toggle. The toggle is a real button with an
 * accessible label so screen readers announce the state change.
 */
export function PasswordField({
  label,
  name,
  required,
  placeholder,
  autoComplete,
  hint,
  disabled,
}: Omit<FieldProps, 'type' | 'defaultValue'>) {
  const id = useId()
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} {required ? <span className="text-accent">*</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${fieldClass} pe-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.account.hidePassword : t.account.showPassword}
          aria-pressed={visible}
          className="absolute inset-y-0 end-0 mt-2 flex w-12 items-center justify-center rounded-e-2xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
