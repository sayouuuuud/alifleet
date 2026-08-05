'use client'

import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { logoutAction } from '@/lib/auth/actions'

export function LogoutButton() {
  const { t } = useLanguage()
  const [confirming, setConfirming] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Move focus into the dialog when it opens, and close it on Escape.
  useEffect(() => {
    if (!confirming) return
    cancelRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirming(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirming])

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
        {t.account.nav.logout}
      </button>

      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t.account.logout.cancel}
            onClick={() => setConfirming(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-desc"
            className="relative w-full max-w-sm rounded-3xl bg-card p-6 ring-1 ring-border"
          >
            <h2
              id="logout-title"
              className="font-serif text-xl tracking-tight text-foreground"
            >
              {t.account.logout.confirmTitle}
            </h2>
            <p
              id="logout-desc"
              className="mt-2 text-sm leading-relaxed text-muted-foreground"
            >
              {t.account.logout.confirmLead}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <form action={logoutAction} className="sm:flex-1">
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  {t.account.logout.confirm}
                </button>
              </form>
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full px-5 py-3 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-secondary sm:flex-1"
              >
                {t.account.logout.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
