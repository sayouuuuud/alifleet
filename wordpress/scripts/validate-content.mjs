#!/usr/bin/env node
/**
 * ALI FLEET content validator.
 *
 * Catches the mistakes that are expensive to discover while you are already
 * SSH'd into the VPS: a CSV column that no ACF field answers to, a seed value
 * written under the wrong field name, a repeater row missing its counter
 * column, a select value outside its allowed choices, a file without a BOM
 * that turns Arabic into mojibake in Excel.
 *
 * Run from the repository root, no dependencies required:
 *
 *   node wordpress/scripts/validate-content.mjs
 *
 * Exit code 0 = safe to import. Exit code 1 = fix the reported problems first.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const rel = (...p) => join(ROOT, ...p)

const errors = []
const warnings = []
const notes = []

const fail = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

/* ------------------------------------------------------------------ schema -- */

const schema = JSON.parse(readFileSync(rel('wordpress/acf/alifleet-acf-schema.json'), 'utf8'))

if (!Array.isArray(schema)) {
  console.error('alifleet-acf-schema.json must be a top-level array of field groups.')
  process.exit(1)
}

/**
 * Every field in the schema, indexed by its dotted path
 * (e.g. "hero_section.hero_slides.slide_label_ar").
 */
const fieldsByPath = new Map()
/** Field keys must be unique across the whole schema or ACF silently drops one. */
const keySeen = new Map()

function indexField(field, groupKey, path) {
  const here = path ? `${path}.${field.name}` : field.name

  if (!field.name) fail(`${groupKey}: a field is missing its "name".`)
  if (!field.key) fail(`${groupKey}: field "${here}" is missing its "key".`)
  if (field.key) {
    if (keySeen.has(field.key)) {
      fail(`Duplicate field key "${field.key}" — used by ${keySeen.get(field.key)} and ${groupKey}:${here}.`)
    } else {
      keySeen.set(field.key, `${groupKey}:${here}`)
    }
  }

  fieldsByPath.set(here, { ...field, groupKey, path: here })

  for (const sub of field.sub_fields ?? []) indexField(sub, groupKey, here)
}

const groupsByKey = new Map()

for (const group of schema) {
  if (!group.key || !group.fields) {
    fail(`A field group is missing "key" or "fields": ${JSON.stringify(group).slice(0, 80)}`)
    continue
  }
  groupsByKey.set(group.key, group)

  if (group.show_in_graphql !== 1 && group.show_in_graphql !== true) {
    fail(`${group.key}: show_in_graphql is not enabled — the frontend can never read these fields.`)
  }
  if (!group.graphql_field_name) {
    fail(`${group.key}: graphql_field_name is missing — WPGraphQL will invent a name that may change.`)
  }
  if (!Array.isArray(group.location) || group.location.length === 0) {
    fail(`${group.key}: no location rules — the group will not appear on any edit screen.`)
  }

  const siblings = new Set()
  for (const field of group.fields) {
    if (siblings.has(field.name)) fail(`${group.key}: two top-level fields named "${field.name}".`)
    siblings.add(field.name)
    indexField(field, group.key, '')
  }
}

/* --------------------------------------------------------- path resolution -- */

/**
 * Resolves a flattened meta key ("hero_section_hero_slides_0_slide_label_ar")
 * against the schema. WordPress stores group and repeater values with the
 * parent name prefixed and repeater rows numbered, so the only reliable way to
 * check a CSV header is to walk the tree greedily.
 *
 * @returns {{ok: true, field: object} | {ok: false, reason: string}}
 */
function resolveMetaKey(metaKey, allowedGroupKeys) {
  const roots = []
  for (const groupKey of allowedGroupKeys) {
    for (const field of groupsByKey.get(groupKey)?.fields ?? []) roots.push(field)
  }
  return walk(metaKey, roots, '')

  function walk(remaining, candidates, sofar) {
    // Longest name first so "hero_line1_ar" wins over a hypothetical "hero".
    const sorted = [...candidates].sort((a, b) => b.name.length - a.name.length)

    for (const field of sorted) {
      if (remaining === field.name) {
        if (field.type === 'repeater') {
          // Bare repeater name = the row-count column. Valid on its own.
          return { ok: true, field, isCounter: true }
        }
        if (field.type === 'group') {
          return { ok: false, reason: `"${sofar}${field.name}" is a group, not a value — use one of its sub fields.` }
        }
        return { ok: true, field }
      }

      if (!remaining.startsWith(`${field.name}_`)) continue
      const rest = remaining.slice(field.name.length + 1)

      if (field.type === 'group') {
        return walk(rest, field.sub_fields ?? [], `${sofar}${field.name}_`)
      }
      if (field.type === 'repeater') {
        const m = /^(\d+)_(.+)$/.exec(rest)
        if (!m) {
          return { ok: false, reason: `repeater "${sofar}${field.name}" needs a row index, e.g. ${field.name}_0_${(field.sub_fields ?? [])[0]?.name ?? 'sub'}.` }
        }
        return walk(m[2], field.sub_fields ?? [], `${sofar}${field.name}_${m[1]}_`)
      }
    }

    return { ok: false, reason: `no ACF field matches "${sofar}${remaining}".` }
  }
}

/* --------------------------------------------------------------- CSV parse -- */

function parseCsv(path) {
  const raw = readFileSync(path, 'utf8')
  const hasBom = raw.charCodeAt(0) === 0xfeff
  const text = hasBom ? raw.slice(1) : raw

  const rows = []
  let row = ['']
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          row[row.length - 1] += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        row[row.length - 1] += ch
      }
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ',') row.push('')
    else if (ch === '\r') continue
    else if (ch === '\n') {
      rows.push(row)
      row = ['']
    } else row[row.length - 1] += ch
  }
  if (row.length > 1 || row[0] !== '') rows.push(row)

  return { hasBom, header: rows[0] ?? [], rows: rows.slice(1) }
}

/* --------------------------------------------------------- CSV validation -- */

/** Columns that map to WordPress/WooCommerce core, not to ACF. */
const CORE_COLUMNS = new Set([
  'post_title',
  'post_name',
  'post_type',
  'post_status',
  'post_date',
  'post_excerpt',
  'post_content',
  'featured_image',
  'is_front_page',
  'regular_price',
  'sale_price',
  'stock_status',
  'product_cat',
  'category',
])

const CSV_TARGETS = [
  {
    file: 'wordpress/import/pages.csv',
    groups: [
      'group_home_page',
      'group_import_page',
      'group_products_page',
      'group_blog_page',
      'group_cart_page',
      'group_contact_page',
    ],
    postType: 'page',
    expectedRows: 6,
  },
  {
    file: 'wordpress/import/import-cars.csv',
    groups: ['group_import_car_fields'],
    postType: 'import_car',
    expectedRows: 7,
  },
  {
    file: 'wordpress/import/spare-parts.csv',
    groups: ['group_spare_part_fields'],
    postType: 'product',
    expectedRows: 12,
  },
  {
    file: 'wordpress/import/blog-posts.csv',
    groups: ['group_blog_post_fields'],
    postType: 'post',
    expectedRows: 6,
  },
]

for (const target of CSV_TARGETS) {
  const label = target.file.split('/').pop()
  const { hasBom, header, rows } = parseCsv(rel(target.file))

  if (!hasBom) {
    fail(`${label}: missing UTF-8 BOM — Excel will mangle the Arabic and Hebrew columns.`)
  }

  const dupes = header.filter((c, i) => header.indexOf(c) !== i)
  if (dupes.length) fail(`${label}: duplicate columns: ${[...new Set(dupes)].join(', ')}`)

  for (const column of header) {
    if (CORE_COLUMNS.has(column)) continue
    const result = resolveMetaKey(column, target.groups)
    if (!result.ok) fail(`${label}: column "${column}" — ${result.reason}`)
  }

  const dataRows = rows.filter((r) => r.some((cell) => cell.trim() !== ''))
  if (dataRows.length !== target.expectedRows) {
    warn(`${label}: ${dataRows.length} data rows, expected ${target.expectedRows}.`)
  }
  for (const [i, r] of dataRows.entries()) {
    if (r.length !== header.length) {
      fail(`${label}: row ${i + 2} has ${r.length} cells but the header has ${header.length}.`)
    }
  }

  const typeIndex = header.indexOf('post_type')
  if (typeIndex === -1) {
    fail(`${label}: no post_type column.`)
  } else {
    for (const [i, r] of dataRows.entries()) {
      if (r[typeIndex] !== target.postType) {
        fail(`${label}: row ${i + 2} has post_type "${r[typeIndex]}", expected "${target.postType}".`)
      }
    }
  }

  const slugIndex = header.indexOf('post_name')
  if (slugIndex === -1) {
    fail(`${label}: no post_name column — the importer matches existing content by slug.`)
  } else {
    const slugs = dataRows.map((r) => r[slugIndex])
    const slugDupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
    if (slugDupes.length) fail(`${label}: duplicate slugs: ${[...new Set(slugDupes)].join(', ')}`)
    if (slugs.some((s) => !s)) fail(`${label}: at least one row has an empty post_name.`)
  }

  // Every repeater referenced by an indexed column needs its counter column,
  // otherwise ACF reads zero rows no matter how many are filled in.
  const repeaterPrefixes = new Set()
  for (const column of header) {
    // Greedy on purpose: a group named scene_01 also contains "_01_", so the
    // candidate prefix is only kept when the schema says it is a repeater.
    for (const m of column.matchAll(/_(\d+)_/g)) {
      const candidate = column.slice(0, m.index)
      const resolved = resolveMetaKey(candidate, target.groups)
      if (resolved.ok && resolved.field.type === 'repeater') repeaterPrefixes.add(candidate)
    }
  }
  for (const prefix of repeaterPrefixes) {
    if (!header.includes(prefix)) {
      fail(`${label}: columns use repeater "${prefix}" but the row-count column "${prefix}" is missing.`)
    }
  }

  notes.push(`${label}: ${header.length} columns, ${dataRows.length} rows — OK`)
}

/* -------------------------------------------------------- seed validation -- */

const seed = JSON.parse(readFileSync(rel('wordpress/scripts/seed-data.json'), 'utf8'))

/**
 * Walks a seed ACF tree against the schema, checking names, repeater shapes
 * and select choices.
 */
function checkAcfTree(value, fields, where, label) {
  const byName = new Map(fields.map((f) => [f.name, f]))

  for (const [name, val] of Object.entries(value ?? {})) {
    const field = byName.get(name)
    if (!field) {
      fail(`${label}: ${where}${name} does not exist in the schema.`)
      continue
    }

    if (field.type === 'group') {
      if (typeof val !== 'object' || Array.isArray(val) || val === null) {
        fail(`${label}: ${where}${name} is a group and needs an object.`)
        continue
      }
      checkAcfTree(val, field.sub_fields ?? [], `${where}${name}.`, label)
      continue
    }

    if (field.type === 'repeater') {
      if (!Array.isArray(val)) {
        fail(`${label}: ${where}${name} is a repeater and needs an array.`)
        continue
      }
      val.forEach((rowValue, i) => {
        if (typeof rowValue !== 'object' || rowValue === null || Array.isArray(rowValue)) {
          fail(`${label}: ${where}${name}[${i}] must be an object of sub fields.`)
          return
        }
        checkAcfTree(rowValue, field.sub_fields ?? [], `${where}${name}[${i}].`, label)
      })
      continue
    }

    if (field.type === 'select' && field.choices && val !== '' && val !== null) {
      if (!Object.prototype.hasOwnProperty.call(field.choices, String(val))) {
        fail(
          `${label}: ${where}${name} = "${val}" is not one of [${Object.keys(field.choices).join(', ')}].`,
        )
      }
    }

    if (field.type === 'number' && val !== null && val !== '' && typeof val !== 'number') {
      warn(`${label}: ${where}${name} should be a number, got ${typeof val}.`)
    }

    if ((field.type === 'image' || field.name === 'featured_image') && typeof val === 'string' && val !== '') {
      if (!val.startsWith('/')) {
        warn(`${label}: ${where}${name} = "${val}" is not a public-folder path (expected /images/...).`)
      }
    }
  }
}

const SEED_TARGETS = [
  { key: 'siteSettings', groups: ['group_site_options'], kind: 'options' },
  {
    key: 'pages',
    kind: 'posts',
    groupsFor: (page) =>
      ({
        home: ['group_home_page'],
        import: ['group_import_page'],
        products: ['group_products_page'],
        blog: ['group_blog_page'],
        cart: ['group_cart_page'],
        contact: ['group_contact_page'],
      })[page.slug],
  },
  { key: 'importCars', kind: 'posts', groupsFor: () => ['group_import_car_fields'] },
  { key: 'spareParts', kind: 'posts', groupsFor: () => ['group_spare_part_fields'] },
  { key: 'blogPosts', kind: 'posts', groupsFor: () => ['group_blog_post_fields'] },
]

for (const target of SEED_TARGETS) {
  const value = seed[target.key]
  if (value === undefined) {
    fail(`seed-data.json: "${target.key}" is missing.`)
    continue
  }

  if (target.kind === 'options') {
    const fields = target.groups.flatMap((k) => groupsByKey.get(k)?.fields ?? [])
    checkAcfTree(value, fields, '', 'seed.siteSettings')
    continue
  }

  const slugs = new Set()
  for (const entry of value) {
    if (!entry.slug) {
      fail(`seed-data.json ${target.key}: an entry has no slug.`)
      continue
    }
    if (slugs.has(entry.slug)) fail(`seed-data.json ${target.key}: duplicate slug "${entry.slug}".`)
    slugs.add(entry.slug)

    if (!entry.title) fail(`seed-data.json ${target.key}/${entry.slug}: no title.`)

    const groupKeys = target.groupsFor(entry)
    if (!groupKeys) {
      fail(`seed-data.json ${target.key}: slug "${entry.slug}" has no matching ACF group.`)
      continue
    }
    const fields = groupKeys.flatMap((k) => groupsByKey.get(k)?.fields ?? [])
    checkAcfTree(entry.acf ?? {}, fields, '', `seed.${target.key}/${entry.slug}`)
  }

  notes.push(`seed.${target.key}: ${value.length ?? 0} entries — OK`)
}

// The home page must be flagged, because group_home_page is located on
// page_type == front_page and shows nothing otherwise.
const frontPages = (seed.pages ?? []).filter((p) => p.isFrontPage)
if (frontPages.length !== 1) {
  fail(`seed-data.json pages: exactly one page must have "isFrontPage": true (found ${frontPages.length}).`)
}

/* ------------------------------------------------- WooCommerce duplication -- */

// These belong to WooCommerce. Re-adding them to ACF makes the storefront and
// the cart disagree on price and stock — see docs/PLAN.md section 1.3.
const WOO_OWNED = ['price', 'in_stock', 'part_image', 'woo_id']
for (const name of WOO_OWNED) {
  const clash = [...fieldsByPath.values()].find(
    (f) => f.groupKey === 'group_spare_part_fields' && f.name === name,
  )
  if (clash) {
    fail(`group_spare_part_fields: "${name}" duplicates a WooCommerce field and must be removed.`)
  }
}

/* --------------------------------------------------- seed ↔ CSV row parity -- */

const PARITY = [
  ['pages', 'wordpress/import/pages.csv'],
  ['importCars', 'wordpress/import/import-cars.csv'],
  ['spareParts', 'wordpress/import/spare-parts.csv'],
  ['blogPosts', 'wordpress/import/blog-posts.csv'],
]

for (const [key, file] of PARITY) {
  const { header, rows } = parseCsv(rel(file))
  const slugIndex = header.indexOf('post_name')
  if (slugIndex === -1) continue

  const csvSlugs = new Set(
    rows.filter((r) => r.some((c) => c.trim() !== '')).map((r) => r[slugIndex]),
  )
  const seedSlugs = new Set((seed[key] ?? []).map((e) => e.slug))

  for (const slug of seedSlugs) {
    if (!csvSlugs.has(slug)) warn(`${file}: seed has "${slug}" but the CSV does not.`)
  }
  for (const slug of csvSlugs) {
    if (!seedSlugs.has(slug)) warn(`${file}: CSV has "${slug}" but the seed does not.`)
  }
}

/* ------------------------------------------------------------------ report -- */

console.log(`Schema: ${schema.length} groups, ${fieldsByPath.size} fields\n`)
for (const note of notes) console.log(`  ok   ${note}`)

if (warnings.length) {
  console.log('')
  for (const w of warnings) console.log(`  warn ${w}`)
}

if (errors.length) {
  console.log('')
  for (const e of errors) console.log(`  FAIL ${e}`)
  console.log(`\n${errors.length} problem(s) must be fixed before importing.`)
  process.exit(1)
}

console.log(`\nAll checks passed${warnings.length ? ` (${warnings.length} warning(s))` : ''}. Safe to import.`)
