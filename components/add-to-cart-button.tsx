'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, ShoppingCart } from 'lucide-react'
import { trackMetaEvent } from '@/lib/analytics/meta-pixel'
import { useCart } from '@/lib/cart-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { cn } from '@/lib/utils'

export function AddToCartButton({
  slug,
  quantity = 1,
  disabled,
  size = 'md',
  className,
}: {
  slug: string
  quantity?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { add } = useCart()
  const { t } = useLanguage()
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), 1600)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(slug, quantity)
        trackMetaEvent('AddToCart', {
          content_type: 'product',
          content_ids: [slug],
          contents: [{ id: slug, quantity }],
        })
        setJustAdded(true)
      }}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40',
        justAdded
          ? 'bg-accent text-accent-foreground'
          : 'bg-foreground text-background hover:opacity-90',
        sizes[size],
        className
      )}
    >
      {justAdded ? (
        <>
          <Check className="size-4 shrink-0" aria-hidden="true" />
          {t.common.added}
        </>
      ) : (
        <>
          {size === 'lg' ? (
            <ShoppingCart className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Plus className="size-4 shrink-0" aria-hidden="true" />
          )}
          {t.common.addToCart}
        </>
      )}
    </button>
  )
}
