import type { Locale } from './config'

/** A field that carries one value per supported language. */
export type Localized<T = string> = Record<Locale, T>

/** Technical values (numbers, units, model codes) can stay language-neutral. */
export type LocalizedOrPlain = string | Localized

export function resolve(value: LocalizedOrPlain, locale: Locale): string {
  return typeof value === 'string' ? value : value[locale]
}

export function pick<T>(field: Localized<T>, locale: Locale): T {
  return field[locale]
}
