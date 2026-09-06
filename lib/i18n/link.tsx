'use client'

import NextLink from 'next/link'
import { useLanguage } from './language-context'
import { ComponentProps } from 'react'

import { getLocalizedPath } from './config'

type NextLinkProps = ComponentProps<typeof NextLink>

export function Link({ href, ...props }: NextLinkProps) {
  const { locale } = useLanguage()
  
  let localizedHref = href
  
  if (typeof href === 'string') {
    if (!href.startsWith('http') && !href.startsWith('#') && href.startsWith('/')) {
      const urlObj = new URL(href, 'http://localhost')
      let baseSlug = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '')
      if (baseSlug === '') baseSlug = 'home'
      
      const newPath = getLocalizedPath(baseSlug, locale)
      localizedHref = `${newPath}${urlObj.search}${urlObj.hash}`
    }
  } else if (href && typeof href === 'object' && href.pathname) {
    if (!href.pathname.startsWith('http') && href.pathname.startsWith('/')) {
      let baseSlug = href.pathname.replace(/^\//, '').replace(/\/$/, '')
      if (baseSlug === '') baseSlug = 'home'
      
      localizedHref = {
        ...href,
        pathname: getLocalizedPath(baseSlug, locale)
      }
    }
  }

  return <NextLink href={localizedHref} {...props} />
}
