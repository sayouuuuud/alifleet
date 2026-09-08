/**
 * Small, fast, synchronous string hash (cyrb53) used to let customers search
 * by a part's original (OE) number without shipping the number itself: the
 * server hashes the OE number, the browser hashes what the customer typed,
 * and only the two hashes are compared. Not cryptographic; it only keeps the
 * numbers out of the page source.
 */
export function hashToken(value: string): string {
  const str = value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
  let h1 = 0xdeadbeef ^ 53
  let h2 = 0x41c6ce57 ^ 53
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/**
 * Catalogue search that behaves the way customers type.
 *
 * - The query is split into words; every word must match, in any order.
 * - A word matches when it is a prefix of any word in the product's haystack
 *   (names in all three languages, brand, SKU, model), so "מרא" finds "מראה"
 *   and "cf036" finds "HTP-CF036".
 * - Each query word is expanded to its synonym group (see synonyms.ts), and
 *   Hebrew construct/plural forms are folded (מראת ↔ מראה, פנסים → פנס).
 * - Niqqud, Arabic tashkeel, Hebrew final letters and Arabic letter variants
 *   are normalised on both sides.
 */
/*
 * Words customers use interchangeably when searching the catalogue, across the
 * three site languages and the trade jargon of Israeli truck garages. Each
 * group is one meaning; a query word is expanded to its whole group before
 * matching, so "מראה דאף", "mirror daf" and "مراية داف" all find "מראת דלת דאף".
 *
 * Keep entries lowercase and without niqqud/tashkeel; normalizeToken() applies
 * the same folding to both sides.
 */
export const SYNONYM_GROUPS: string[][] = [
  // parts
  ['מראה', 'מראת', 'מראות', 'ראי', 'mirror', 'mirrors', 'مرآة', 'مراية', 'مرايا', 'مرايات'],
  ['פנס', 'פנסים', 'פנסי', 'תאורה', 'light', 'lights', 'lamp', 'headlight', 'headlamp', 'ضوء', 'اضواء', 'أضواء', 'فنار', 'فنارات', 'مصباح', 'مصابيح', 'لمبة', 'انارة', 'إنارة'],
  ['אחורי', 'אחורית', 'בקלית', 'tail', 'rear', 'خلفي', 'خلفية', 'بكليت'],
  ['ערפל', 'fog', 'ضباب'],
  ['פגוש', 'פגושים', 'bumper', 'bumpers', 'صدام', 'صدامات', 'بمبر', 'بامبر'],
  ['פינת', 'פינה', 'משקפיים', 'משקפים', 'corner', 'زاوية', 'زاويه'],
  ['גריל', 'grille', 'grill', 'شبك', 'شبكة'],
  ['מדרגה', 'מדרגת', 'מדרגות', 'step', 'steps', 'درجة', 'درجه', 'درجات'],
  ['מסית', 'מסיט', 'deflector', 'كاسر'],
  ['כנף', 'כנפיים', 'fender', 'wing', 'رفرف', 'جناح'],
  ['מגן', 'guard', 'واقي', 'واقية'],
  ['פוטס', 'בוץ', 'mud', 'mudguard', 'طين'],
  ['כיסוי', 'מכסה', 'cover', 'cap', 'غطاء', 'غطا'],
  ['ידית', 'handle', 'مقبض'],
  ['לוח', 'panel', 'لوح'],
  ['סמל', 'emblem', 'badge', 'logo', 'شعار'],
  ['מצבר', 'מצברים', 'battery', 'batteries', 'بطارية', 'بطاريات'],
  ['מסנן', 'פילטר', 'filter', 'فلتر'],
  ['מיכל', 'tank', 'خزان'],
  ['מגב', 'מגבים', 'wiper', 'wipers', 'مساحة', 'مساحات'],
  ['תושבת', 'bracket', 'mount', 'قاعدة', 'حامل'],
  ['מסגרת', 'frame', 'إطار', 'اطار'],
  ['מגן שמש', 'visor', 'واقية شمس'],
  // position / variant
  ['קדמי', 'קדמית', 'front', 'أمامي', 'امامي', 'أمامية', 'امامية'],
  ['ימין', 'ימני', 'ימנית', 'right', 'يمين', 'أيمن', 'ايمن'],
  ['שמאל', 'שמאלי', 'שמאלית', 'left', 'يسار', 'أيسر', 'ايسر'],
  ['חשמלי', 'חשמלית', 'electric', 'كهربائي', 'كهربائية', 'كهربا'],
  ['led', 'לד', 'ליד', 'ليد'],
  ['קסנון', 'xenon', 'زينون', 'كسنون'],
  // brands
  ['דאף', 'daf', 'داف'],
  ['וולוו', 'וולבו', 'volvo', 'فولفو'],
  ['סקניה', 'סקאניה', 'scania', 'سكانيا', 'سكانيه'],
  ['מאן', 'man', 'مان'],
  ['מרצדס', 'mercedes', 'مرسيدس', 'مرسدس', 'بنز'],
  ['איווקו', 'איווקו', 'iveco', 'ايفيكو', 'إيفيكو', 'ايفكو'],
]

const HEBREW_FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' }

export function normalizeToken(value: string): string {
  return (
    value
      .toLowerCase()
      // NFD splits niqqud, tashkeel and the hamza/madda of أ إ آ into combining
      // marks; dropping every mark (\p{M}) folds all of them at once.
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .replace(/[ךםןףץ]/g, (c) => HEBREW_FINALS[c] ?? c)
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ـ/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  )
}

export function tokenize(value: string): string[] {
  return normalizeToken(value).split(/\s+/).filter(Boolean)
}

const SYNONYM_INDEX: Map<string, string[]> = (() => {
  const index = new Map<string, string[]>()
  for (const group of SYNONYM_GROUPS) {
    const normalized = Array.from(new Set(group.flatMap((word) => tokenize(word))))
    for (const word of normalized) {
      index.set(word, Array.from(new Set([...(index.get(word) ?? []), ...normalized])))
    }
  }
  return index
})()

/** Hebrew morphology that changes the word ending: construct state and plurals. */
function hebrewVariants(word: string): string[] {
  const out = [word]
  if (word.length > 3) {
    if (word.endsWith('ת')) out.push(word.slice(0, -1) + 'ה')
    if (word.endsWith('ה')) out.push(word.slice(0, -1) + 'ת')
    if (word.endsWith('ים') || word.endsWith('ות')) out.push(word.slice(0, -2))
  }
  return out
}

export function expandToken(token: string): string[] {
  const base = hebrewVariants(token)
  const expanded = base.flatMap((word) => SYNONYM_INDEX.get(word) ?? [word])
  return Array.from(new Set([...base, ...expanded]))
}

/** Words the product can be found by; build once per product. */
export function buildHaystack(fields: Array<string | null | undefined>): string[] {
  return tokenize(fields.filter(Boolean).join(' '))
}

/**
 * `hashes` are cyrb53 hashes of hidden search keys (the OE number). A query
 * matches on hashes when the whole query with separators removed, or any
 * single token, hashes to one of them, so "81.615.100.570" and
 * "81615100570" both find the part while the number itself never leaves the
 * server.
 */
export function matchesQuery(haystack: string[], query: string, hashes: readonly string[] = []): boolean {
  const tokens = tokenize(query)
  if (tokens.length === 0) return true
  if (hashes.length > 0) {
    const whole = hashToken(query)
    if (hashes.includes(whole) || tokens.some((token) => hashes.includes(hashToken(token)))) return true
  }
  return tokens.every((token) => {
    const variants = expandToken(token)
    // One-letter variants would match almost anything; keep them exact.
    return haystack.some((word) =>
      variants.some((variant) => (variant.length >= 2 ? word.startsWith(variant) : word === variant))
    )
  })
}
