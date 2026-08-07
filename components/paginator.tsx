'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginatorProps {
  current: number
  total: number
  onChange: (page: number) => void
  prevLabel?: string
  nextLabel?: string
}

/**
 * Smart paginator: always shows first + last page, current ± 1 neighbour,
 * and ellipsis gaps. Works correctly for any number of pages.
 */
export function Paginator({ current, total, onChange, prevLabel, nextLabel }: PaginatorProps) {
  if (total <= 1) return null

  // Build the page list with null gaps for ellipsis
  const pages: (number | null)[] = []
  const add = (p: number) => {
    if (!pages.includes(p)) pages.push(p)
  }

  add(1)
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) add(p)
  add(total)

  // Insert nulls where gaps exist
  const result: (number | null)[] = []
  let prev = 0
  for (const p of pages) {
    if (p! - prev > 1) result.push(null)
    result.push(p)
    prev = p!
  }

  const btn = 'flex size-10 items-center justify-center rounded-full text-sm transition-colors'
  const inactive = `${btn} bg-card ring-1 ring-border text-muted-foreground hover:bg-secondary hover:text-foreground`
  const active = `${btn} bg-foreground font-semibold text-background`
  const nav = `${btn} bg-card ring-1 ring-border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-30`

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label={prevLabel ?? 'Previous'}
        className={nav}
      >
        <ChevronLeft className="size-4" aria-hidden="true" data-flip-rtl />
      </button>

      {result.map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="flex size-10 items-center justify-center text-muted-foreground select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === current ? 'page' : undefined}
            className={p === current ? active : inactive}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label={nextLabel ?? 'Next'}
        className={nav}
      >
        <ChevronRight className="size-4" aria-hidden="true" data-flip-rtl />
      </button>
    </nav>
  )
}
