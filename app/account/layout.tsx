import { AccountChrome } from '@/components/account/account-chrome'

/**
 * The auth screens (login/register/forgot) render standalone, so this layout only
 * adds the signed-in chrome around the protected pages. AccountChrome decides
 * which of the two it is from the current pathname.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AccountChrome>{children}</AccountChrome>
}
