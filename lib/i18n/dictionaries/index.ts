import type { Locale } from '../config'
import { ar } from './ar'
import { en, type Dictionary } from './en'
import { he } from './he'

/** Every dictionary, keyed by locale, for server-side use (metadata, JSON-LD). */
export const dictionaries: Record<Locale, Dictionary> = { ar, en, he }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.he
}
