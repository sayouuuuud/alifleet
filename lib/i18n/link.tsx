'use client'

import NextLink from 'next/link'
import { useLanguage } from './language-context'
import { ComponentProps } from 'react'

type NextLinkProps = ComponentProps<typeof NextLink>

export function Link({ href, ...props }: NextLinkProps) {
  const { locale } = useLanguage()
  
  let localizedHref = href
  
  if (typeof href === 'string') {
    // If it's an absolute URL or a hash link, don't prefix
    if (!href.startsWith('http') && !href.startsWith('#') && href.startsWith('/')) {
      localizedHref = `/${locale}${href === '/' ? '' : href}`
    }
  } else if (href && typeof href === 'object' && href.pathname) {
    if (!href.pathname.startsWith('http') && href.pathname.startsWith('/')) {
      localizedHref = {
        ...href,
        pathname: `/${locale}${href.pathname === '/' ? '' : href.pathname}`
      }
    }
  }

  return <NextLink href={localizedHref} {...props} />
}
