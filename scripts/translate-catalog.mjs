/**
 * Fills in the Arabic and English translations for the Hebrew product text that
 * lives in WooCommerce.
 *
 *   node --env-file-if-exists=.env.local scripts/translate-catalog.mjs
 *   node --env-file-if-exists=.env.local scripts/translate-catalog.mjs --dry-run
 *
 * Needs two environment variables:
 *   WORDPRESS_GRAPHQL_ENDPOINT   the same value the site uses
 *   AI_GATEWAY_API_KEY           https://vercel.com/ai-gateway → API keys
 *
 * The script is incremental and non-destructive: it only asks the model about
 * strings that have no entry yet, so re-running it after adding products costs
 * only the new products, and any translation you correct by hand is left alone.
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { generateText } from 'ai'

const DICTIONARY = path.join(
  process.cwd(),
  'lib',
  'i18n',
  'product-translations.json'
)
const MODEL = 'openai/gpt-4o-mini'
const BATCH_SIZE = 10
const PAGE_SIZE = 100
const MAX_PAGES = 12

const dryRun = process.argv.includes('--dry-run')

const CATALOG_QUERY = `
  query TranslateCatalog($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId
        name
        description
        shortDescription
        image { altText }
      }
    }
  }
`

main().catch((error) => {
  console.error('\n✖', error.message)
  process.exit(1)
})

async function main() {
  const endpoint = (process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? '').trim()
  if (!endpoint) {
    throw new Error(
      'WORDPRESS_GRAPHQL_ENDPOINT is not set. Put it in .env.local and run this with --env-file-if-exists=.env.local'
    )
  }
  if (!dryRun && !(process.env.AI_GATEWAY_API_KEY ?? '').trim()) {
    throw new Error(
      'AI_GATEWAY_API_KEY is not set. Create one at https://vercel.com/ai-gateway → API keys'
    )
  }

  const file = JSON.parse(await readFile(DICTIONARY, 'utf8'))
  const entries = file.entries ?? {}
  console.log(`Dictionary: ${Object.keys(entries).length} strings already translated`)

  const products = await fetchProducts(endpoint)
  console.log(`WooCommerce: ${products.length} products`)

  const sources = collectSources(products)
  const missing = [...sources].filter((source) => !isComplete(entries[source]))

  console.log(
    `Unique strings: ${sources.size} — ${sources.size - missing.length} translated, ${missing.length} missing`
  )

  if (missing.length === 0) {
    console.log('\n✔ Nothing to do, every product string already has ar + en.')
    return
  }

  if (dryRun) {
    console.log('\nDRY RUN — the first 10 strings that would be translated:')
    for (const source of missing.slice(0, 10)) {
      console.log(`  · ${truncate(source, 90)}`)
    }
    console.log(
      `\nRun again without --dry-run to translate all ${missing.length}.`
    )
    return
  }

  let done = 0
  for (let index = 0; index < missing.length; index += BATCH_SIZE) {
    const batch = missing.slice(index, index + BATCH_SIZE)
    const translated = await translateBatch(batch)

    for (const [source, value] of Object.entries(translated)) {
      entries[source] = { ...entries[source], ...value }
    }

    done += batch.length
    // Written after every batch so an interrupted run keeps its progress.
    file.entries = sortKeys(entries)
    await writeFile(DICTIONARY, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
    console.log(`  ${done}/${missing.length} translated`)
  }

  const stillMissing = [...sources].filter((s) => !isComplete(entries[s])).length
  console.log(
    `\n✔ Done. ${Object.keys(entries).length} strings in the dictionary` +
      (stillMissing ? `, ${stillMissing} still missing — re-run to retry.` : '.')
  )
}

/* ----------------------------------------------------------------- fetching */

async function fetchProducts(endpoint) {
  const nodes = []
  let after = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: CATALOG_QUERY,
        variables: { first: PAGE_SIZE, after },
      }),
      signal: AbortSignal.timeout(30_000),
    })

    const raw = await response.text()
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      throw new Error(
        `${endpoint} replied with HTTP ${response.status} and a non-JSON body:\n${raw.slice(0, 300)}`
      )
    }
    if (payload.errors?.length) {
      throw new Error(
        `GraphQL error: ${payload.errors.map((e) => e.message).join(' | ')}`
      )
    }

    const connection = payload.data?.products
    if (!connection) break
    nodes.push(...connection.nodes)
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break
    after = connection.pageInfo.endCursor
  }

  return nodes
}

/**
 * Mirrors `translationKey()` in lib/i18n/machine-translations.ts. The two must
 * agree or the site will look up keys this script never wrote.
 */
function collectSources(products) {
  const sources = new Set()

  for (const product of products) {
    for (const field of [
      product.name,
      product.shortDescription || product.description,
      product.image?.altText,
    ]) {
      const key = normalise(field ?? '')
      if (key && containsHebrew(key)) sources.add(key)
    }
  }

  return sources
}

function normalise(value) {
  return stripHtml(value).replace(/\s+/g, ' ').trim()
}

function stripHtml(html) {
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

function containsHebrew(value) {
  return /[\u0590-\u05FF]/.test(value)
}

/* -------------------------------------------------------------- translation */

async function translateBatch(batch) {
  const numbered = batch
    .map((source, index) => `${index + 1}. ${source}`)
    .join('\n')

  const { text } = await generateText({
    model: MODEL,
    system: [
      'You translate commercial-vehicle spare-part listings for an Israeli parts supplier.',
      'Translate from Hebrew into Arabic and English.',
      'Rules:',
      '- Keep part numbers, SKUs, measurements, units and vehicle model codes exactly as written.',
      '- Keep brand names in Latin script (Bosch, Brembo, Textar, Mercedes, Mann...).',
      '- Use the standard automotive term in each language, not a literal word-for-word rendering.',
      '- Preserve the register: these are catalog titles and short product blurbs, not marketing copy.',
      '- Never add information that is not in the source and never leave a field empty.',
      'Reply with JSON only: an array of objects {"n": <number>, "ar": "...", "en": "..."} with one entry per numbered input.',
    ].join('\n'),
    prompt: `Translate these ${batch.length} Hebrew strings:\n\n${numbered}`,
  })

  const parsed = parseJsonArray(text)
  const result = {}

  for (const row of parsed) {
    const index = Number(row?.n) - 1
    const source = batch[index]
    if (!source) continue
    const ar = typeof row.ar === 'string' ? row.ar.trim() : ''
    const en = typeof row.en === 'string' ? row.en.trim() : ''
    if (ar && en) result[source] = { ar, en }
  }

  const dropped = batch.length - Object.keys(result).length
  if (dropped > 0) {
    console.log(`  ⚠ ${dropped} string(s) in this batch came back unusable — will retry on the next run`)
  }

  return result
}

/** Models like to wrap JSON in prose or a code fence; dig the array out. */
function parseJsonArray(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = (fenced ? fenced[1] : text).trim()
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start === -1 || end === -1) return []
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ helpers */

function isComplete(entry) {
  return Boolean(entry?.ar?.trim() && entry?.en?.trim())
}

function sortKeys(entries) {
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))
  )
}

function truncate(value, length) {
  return value.length <= length ? value : `${value.slice(0, length)}…`
}
