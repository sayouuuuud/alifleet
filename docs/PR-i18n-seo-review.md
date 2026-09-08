# PR: Localisation review + SEO/GEO tags (2026-09-08)

Branch `content/i18n-seo-review` → `main`. No UI component was changed, no dictionary key was renamed or removed, and `npx tsc --noEmit` / `npx next build` pass with zero TypeScript errors.

## 1. Copy values (ar.ts / en.ts / he.ts)

Source of truth: `content/copy-2026-09-08-review.json`, applied with `scripts/content/apply-copy.py` (34 strings + the `seo` block + the `faq` section, identical key set in the three files).

| Area | What changed |
| --- | --- |
| nav / common | "Truck Parts / חלקי חילוף למשאיות / قطع غيار شاحنات"; "Cars" → "Vehicles"; "SKU" → "Part number / מק"ט / رقم القطعة" |
| home | hero line + description use the industry terms (Aftermarket Spare Parts, OEM-replacement, Heavy Vehicles; חלקי חילוף איכותיים למשאיות; قطع غيار بديلة ذات جودة عالية مع ضمان 3 أشهر); stats labels match the real counters already in `stats-strip.tsx` (100+ customers, 120+ parts); truck card + parts scene mention every brand and the 3-month warranty |
| products | title/lead rewritten around "Aftermarket truck spare parts, with a 3-month warranty"; search placeholder lists model examples (FH, XF, TGX, Actros); trust badges: warranty / fast dispatch from Reineh (typo "Reine" fixed) / fitment confirmed before you pay |
| productDetail | fitment note asks for the VIN on WhatsApp and promises confirmation before payment |
| contact | lead states the hours, road 745, Reineh near Nazareth; subjects use the same terms as the nav |
| footer | tagline rewritten around parts + import + warranty; "Fleet" column → "Vehicles"; links say "Truck spare parts", "Vehicle import", "Warranty and aftersales" |
| faq | all seven answers are self-contained and AI-ready: each names ALI FLEET, the location (main road 745, Reineh), the brands, the 3-month warranty and the hours, so an assistant can quote one answer on its own |

Arabic uses "ضمان 3 أشهر" (MSA) everywhere instead of the colloquial "شهور", and the Israeli-market vocabulary kept from the product pass (بكلايت, مرايا, مسيت ريح…) is untouched.

## 2. SEO tags (`seo.*`)

Every title/description was rewritten per language with the target keywords:

- he: חלקי חילוף למשאיות, ייבוא רכב אישי, אחריות 3 חודשים, ריינה
- ar: قطع غيار شاحنات, استيراد سيارات, ضمان 3 أشهر, الرينة
- en: Aftermarket Truck Parts, OEM-replacement, Heavy Vehicles, Vehicle Import to Israel

Four keys were **added** (same name in all three files, consumed by the JSON-LD only): `orgName`, `orgAlternateName`, `areaServed`, `openingHoursText`.

## 3. hreflang alternates

New helper `lib/seo/alternates.ts` (`pageAlternates(internalPath, locale)`) builds, from the existing `toPublicPathname` routing rules:

- `canonical` = the page's own public URL for the active language (`/products/`, `/ar/products-ar/`, `/en/products-en/`)
- `alternates.languages` = `he`, `ar`, `en` + `x-default` (Hebrew, the default locale)

Wired into `generateMetadata` of: root layout (`/`), `/products/`, `/products/[slug]/`, `/cars/`, `/contact/`, `/blog/`, `/blog/[slug]/`, `/cars/sale/[slug]/`, `/cars/import/[slug]/`. Verified on the production build: every page emits `<link rel="canonical">` plus four `<link rel="alternate" hreflang>` tags with absolute URLs.

## 4. GEO: AutoPartsStore JSON-LD

`app/layout.tsx` now reads the organisation fields from `getDictionary(locale)`: `name` (`t.seo.orgName`), `alternateName` (localised: עלי פליט / علي فليت / Ali Fleet – Truck Spare Parts & Vehicle Import), `inLanguage` (`he` / `ar` / `en`), `description` and `areaServed.name` (ישראל / إسرائيل / Israel). Address, telephone, WhatsApp contact point, `openingHoursSpecification` (Sun–Thu + Sat 09:00–18:00) and social links were already there and are unchanged.

## 5. Verification

```
npx tsc --noEmit            → 0 errors
node --test scripts/tests   → 35/35 search tests pass
npx next build              → success
next start + curl           → titles, canonical, hreflang and JSON-LD checked for / , /ar/home-ar/ , /products/ , /en/products-en/
```

## Files

- `content/copy-2026-09-08-review.json` (new), `lib/i18n/dictionaries/{ar,en,he}.ts`
- `lib/seo/alternates.ts` (new)
- `app/layout.tsx`, `app/products/page.tsx`, `app/products/[slug]/page.tsx`, `app/cars/page.tsx`, `app/contact/page.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/cars/sale/[slug]/page.tsx`, `app/cars/import/[slug]/page.tsx`
- `docs/PR-i18n-seo-review.md` (this report)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
