import type { Metadata } from 'next'
import AccountPage, { metadata as accountMetadata } from '../account/page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...accountMetadata,
  title: 'My Account | حسابي | ALI FLEET',
  alternates: {
    canonical: '/my-account',
  },
}

export default AccountPage
