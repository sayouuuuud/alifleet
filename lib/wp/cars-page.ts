import 'server-only'

import type { Locale } from '@/lib/i18n/config'
import type { CopyBlock } from '@/lib/i18n/copy-block'
import { isWpConfigured } from './config'
import { wpFetch } from './client'

export type { CopyBlock }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CarsPageCopy = {
  hero: {
    eyebrow: CopyBlock
    title: CopyBlock
    titleEm: CopyBlock
    lead: CopyBlock
    ctaSale: CopyBlock
    ctaImport: CopyBlock
  }
  saleHeader: {
    eyebrow: CopyBlock
    title: CopyBlock
    lead: CopyBlock
  }
  importHeader: {
    eyebrow: CopyBlock
    title: CopyBlock
    lead: CopyBlock
  }
}

/** Nothing overridden — the UI renders entirely from its dictionaries. */
export const EMPTY_CARS_PAGE_COPY: CarsPageCopy = {
  hero: {
    eyebrow: {},
    title: {},
    titleEm: {},
    lead: {},
    ctaSale: {},
    ctaImport: {},
  },
  saleHeader: { eyebrow: {}, title: {}, lead: {} },
  importHeader: { eyebrow: {}, title: {}, lead: {} },
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

/*
 * The ACF group is still keyed `importPageFields` because renaming a live ACF
 * group key would orphan every value already saved against it. The page it is
 * bound to is `/cars`, which is what `idType: URI` looks up here.
 */
const CARS_PAGE_COPY_QUERY = /* GraphQL */ `
  query AliFleetCarsPageCopy {
    page(id: "cars", idType: URI) {
      importPageFields {
        importHero {
          eyebrowAr
          eyebrowEn
          eyebrowHe
          titleAr
          titleEn
          titleHe
          titleEmAr
          titleEmEn
          titleEmHe
          leadAr
          leadEn
          leadHe
          ctaBrowseAr
          ctaBrowseEn
          ctaBrowseHe
          ctaCustomAr
          ctaCustomEn
          ctaCustomHe
        }
        saleCarsHeader {
          saleEyebrowAr
          saleEyebrowEn
          saleEyebrowHe
          saleTitleAr
          saleTitleEn
          saleTitleHe
          saleLeadAr
          saleLeadEn
          saleLeadHe
        }
        availableCarsHeader {
          listEyebrowAr
          listEyebrowEn
          listEyebrowHe
          listTitleAr
          listTitleEn
          listTitleHe
          listLeadAr
          listLeadEn
          listLeadHe
        }
      }
    }
  }
`

type RawGroup = Record<string, string | null> | null

type RawResponse = {
  page: {
    importPageFields: {
      importHero: RawGroup
      saleCarsHeader: RawGroup
      availableCarsHeader: RawGroup
    } | null
  } | null
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

const SUFFIX: Record<Locale, string> = { ar: 'Ar', en: 'En', he: 'He' }

/**
 * Collapses a `<prefix><Lang>` field trio into a `CopyBlock`.
 *
 * Whitespace-only values are treated as unset — ACF stores an empty textarea as
 * `""` rather than null, and an editor clearing a field means "use the default",
 * not "render a blank heading".
 */
function block(group: RawGroup, prefix: string): CopyBlock {
  if (!group) return {}

  const out: CopyBlock = {}
  for (const locale of Object.keys(SUFFIX) as Locale[]) {
    const value = group[`${prefix}${SUFFIX[locale]}`]
    if (typeof value === 'string' && value.trim()) {
      out[locale] = value.trim()
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

/**
 * Loads the editable copy for `/cars` from WordPress.
 *
 * This is purely additive: the page renders correctly with zero WordPress
 * involvement, and every field an editor fills in overrides its dictionary
 * counterpart for that one language. A missing endpoint, an unreachable box or
 * a deleted field group all degrade to `EMPTY_CARS_PAGE_COPY` rather than
 * surfacing an error, because copy overrides are an enhancement and never the
 * reason a visitor cannot see the inventory.
 *
 * Cached for 10 minutes, matching the catalog fetchers, so an edit appears
 * without a redeploy.
 */
export async function getCarsPageCopy(): Promise<CarsPageCopy> {
  if (!isWpConfigured()) return EMPTY_CARS_PAGE_COPY

  try {
    const data = await wpFetch<RawResponse>(
      CARS_PAGE_COPY_QUERY,
      {},
      { revalidate: 600 }
    )

    const fields = data.page?.importPageFields
    if (!fields) return EMPTY_CARS_PAGE_COPY

    const hero = fields.importHero
    const sale = fields.saleCarsHeader
    const list = fields.availableCarsHeader

    return {
      hero: {
        eyebrow: block(hero, 'eyebrow'),
        title: block(hero, 'title'),
        titleEm: block(hero, 'titleEm'),
        lead: block(hero, 'lead'),
        ctaSale: block(hero, 'ctaBrowse'),
        ctaImport: block(hero, 'ctaCustom'),
      },
      saleHeader: {
        eyebrow: block(sale, 'saleEyebrow'),
        title: block(sale, 'saleTitle'),
        lead: block(sale, 'saleLead'),
      },
      importHeader: {
        eyebrow: block(list, 'listEyebrow'),
        title: block(list, 'listTitle'),
        lead: block(list, 'listLead'),
      },
    }
  } catch {
    return EMPTY_CARS_PAGE_COPY
  }
}
