'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, MapPin, Package, UserRound } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { LogoutButton } from './logout-button'

const items = [
  { href: '/account', key: 'dashboard', Icon: LayoutGrid },
  { href: '/account/orders', key: 'orders', Icon: Package },
  { href: '/account/profile', key: 'profile', Icon: UserRound },
  { href: '/account/addresses', key: 'addresses', Icon: MapPin },
] as const

export function AccountNav() {
  const { t } = useLanguage()
  const pathname = usePathname()

  return (
    <nav aria-label={t.account.myAccount} className="flex flex-col gap-2">
      {items.map(({ href, key, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t.account.nav[key]}
          </Link>
        )
      })}

      <div className="mt-2 border-t border-border pt-2">
        <LogoutButton />
      </div>
    </nav>
  )
}
