'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { AccountNav } from './account-nav'

/** Routes that render their own standalone shell without the account sidebar. */
const PUBLIC_ROUTES = [
  '/account/login',
  '/account/register',
  '/account/forgot-password',
]

export function AccountChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (PUBLIC_ROUTES.includes(pathname)) {
    return (
      <>
        <SiteHeader />
        {children}
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-8 md:pb-32 md:pt-40">
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="lg:sticky lg:top-28">
            <AccountNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </>
  )
}
