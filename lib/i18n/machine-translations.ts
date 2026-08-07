import type { Localized } from './localized'
import translationFile from './product-translations.json'

/**
 * The products in WooCommerce were written in Hebrew only. Rather than
 * translating 165 products on every request — slow, and a per-visitor bill —
 * translations are generated once into `product-translations.json` by
 * `scripts/translate-catalog.mjs` and read from there at runtime.
 *
 * A missing entry is not an error: the Hebrew original is shown and the field
 * is flagged `untranslated` so the markup can still declare `lang="he"`.
 */

type Entry = { ar?: string; en?: string }

const entries = (translationFile as { entries?: Record<string, Entry> })
  .entries ?? {}

/**
 * Normalises a source string into a lookup key. WooCommerce descriptions come
 * back as HTML with `&nbsp;`, wrapping `<p>` tags and editor line breaks, none
 * of which should change the identity of the text.
 */
export function translationKey(source: string): string {
  return stripHtml(source).replace(/\s+/g, ' ').trim()
}

/** Turns WooCommerce's HTML description into plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Builds the three-language field the UI expects from a Hebrew source string.
 *
 * `overrides` wins over the generated dictionary — that is how the curated
 * products keep the hand-written copy stored in their ACF `name_ar` / `name_en`
 * fields instead of a machine translation.
 */
export function localizeHebrew(
  source: string,
  overrides: { ar?: string | null; en?: string | null } = {}
): { value: Localized; translated: boolean } {
  const he = stripHtml(source)
  const generated = entries[translationKey(source)]

  const ar = firstFilled(overrides.ar, generated?.ar)
  const en = firstFilled(overrides.en, generated?.en)

  return {
    value: { ar: ar ?? he, en: en ?? he, he },
    translated: Boolean(ar && en),
  }
}

function firstFilled(...values: (string | null | undefined)[]) {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

/** How many source strings currently have a translation — used by the script. */
export function translationCount(): number {
  return Object.keys(entries).length
}
