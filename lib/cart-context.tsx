'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const CART_STORAGE_KEY = 'alifleet-cart'

export type CartLine = {
  slug: string
  quantity: number
}

type CartContextValue = {
  lines: CartLine[]
  count: number
  ready: boolean
  add: (slug: string, quantity?: number) => void
  setQuantity: (slug: string, quantity: number) => void
  remove: (slug: string) => void
  clear: () => void
  quantityOf: (slug: string) => number
}

const CartContext = createContext<CartContextValue | null>(null)

function parseStored(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (line): line is CartLine =>
          typeof line?.slug === 'string' && Number.isFinite(line?.quantity)
      )
      .map((line) => ({
        slug: line.slug,
        quantity: Math.max(1, Math.min(99, Math.round(line.quantity))),
      }))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  // `ready` prevents a hydration mismatch: the badge only renders once the
  // client has read localStorage.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLines(parseStored(window.localStorage.getItem(CART_STORAGE_KEY)))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
  }, [lines, ready])

  const add = useCallback((slug: string, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.slug === slug)
      if (!existing) return [...current, { slug, quantity }]
      return current.map((line) =>
        line.slug === slug
          ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
          : line
      )
    })
  }, [])

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((current) =>
      quantity < 1
        ? current.filter((line) => line.slug !== slug)
        : current.map((line) =>
            line.slug === slug
              ? { ...line, quantity: Math.min(99, Math.round(quantity)) }
              : line
          )
    )
  }, [])

  const remove = useCallback((slug: string) => {
    setLines((current) => current.filter((line) => line.slug !== slug))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(() => {
    const quantityOf = (slug: string) =>
      lines.find((line) => line.slug === slug)?.quantity ?? 0
    return {
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
      quantityOf,
    }
  }, [lines, ready, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside a CartProvider')
  return ctx
}
