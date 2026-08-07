/**
 * Pushes the nine seed vehicles from the old static data file into WordPress
 * as `import_car` CPT posts, with ACF fields populated.
 *
 * USAGE
 *   # Dry run — prints what would be created without touching WordPress:
 *   node --env-file-if-exists=.env.local scripts/migrate-cars.mjs --dry-run
 *
 *   # Live run — creates posts in WordPress:
 *   node --env-file-if-exists=.env.local scripts/migrate-cars.mjs
 *
 * REQUIRED ENV VARS
 *   WORDPRESS_GRAPHQL_ENDPOINT   e.g. https://alifleet.com/graphql
 *   WORDPRESS_USER               WordPress username with Author/Editor role
 *   WORDPRESS_APP_PASSWORD       Application Password (Dashboard → Users → Application Passwords)
 *
 * The script is idempotent: it checks for an existing published post with the
 * same slug before creating. Re-running it skips cars already in WordPress.
 *
 * After running this script once you can delete the seed data below — the live
 * inventory is now managed from the WordPress admin.
 */

import process from 'node:process'

// ----------------------------------------------------------------- seed data
// Copied verbatim from the old lib/data/import-cars.ts so the migration is
// self-contained and does not depend on the TypeScript source.

const SEED_CARS = [
  {
    slug: 'executive-sprinter-519-cdi',
    model: 'Sprinter 519 CDI',
    subtitleAr: 'فان تنفيذي بسقف مرتفع وتجهيز داخلي فاخر',
    subtitleEn: 'High-roof executive van with a bespoke interior',
    subtitleHe: 'ואן ניהולי גג גבוה עם פנים מותאם',
    bodyType: 'van',
    origin: 'germany',
    status: 'available',
    stage: 2,
    year: 2022,
    mileage: 68000,
    price: 289000,
    featured: true,
    descriptionAr: 'فان تنفيذي مجهّز من الوكالة بمقاعد كابتن جلدية وإضاءة محيطة وعزل صوتي كامل. صيانة موثقة بالكامل من مركز خدمة معتمد في ألمانيا، وجاهز للفحص قبل الشحن.',
    descriptionEn: 'Factory-fitted executive van with leather captain seats, ambient lighting and full acoustic insulation. Complete service history from an authorised German service centre, ready for a pre-shipment inspection.',
    descriptionHe: 'ואן ניהולי עם מושבי קפטן מעור, תאורת אווירה ובידוד אקוסטי מלא. היסטוריית טיפולים מלאה ממרכז שירות מוסמך בגרמניה.',
    highlights: [
      { ar: 'مقاعد كابتن جلدية × 4', en: '4 leather captain seats', he: '4 מושבי קפטן מעור' },
      { ar: 'تكييف خلفي مستقل', en: 'Independent rear climate', he: 'מיזוג אחורי עצמאי' },
      { ar: 'كاميرا 360 درجة', en: '360° camera', he: 'מצלמת 360°' },
      { ar: 'صيانة موثقة بالكامل', en: 'Full documented service history', he: 'היסטוריית טיפולים מלאה' },
    ],
    engine: '2.0 CDI · 190 hp',
    transmission: 'auto',
    fuel: 'diesel',
    drivetrain: 'RWD',
    colorAr: 'أبيض قطبي', colorEn: 'Polar white', colorHe: 'לבן פולארי',
    seats: 7,
    etaAr: '4 – 6 أسابيع', etaEn: '4 – 6 weeks', etaHe: '4 – 6 שבועות',
  },
  {
    slug: 'luxury-suv-xdrive-40i',
    model: 'X7 xDrive40i',
    subtitleAr: 'دفع رباعي فاخر بسبعة مقاعد وتجهيز كامل',
    subtitleEn: 'Fully-loaded seven-seat luxury SUV',
    subtitleHe: 'רכב שטח יוקרתי שבע מקומות בגימור מלא',
    bodyType: 'suv',
    origin: 'germany',
    status: 'available',
    stage: 1,
    year: 2023,
    mileage: 24000,
    price: 465000,
    featured: true,
    descriptionAr: 'نسخة مجهزة بكل الإضافات: تعليق هوائي، نظام صوت فاخر، شاشة خلفية ترفيهية، وفتحة سقف بانورامية. مالك واحد وسجل خدمة كامل من الوكيل.',
    descriptionEn: 'Every box ticked: air suspension, premium audio, rear entertainment screens and a panoramic roof. One owner with a complete main-dealer service record.',
    descriptionHe: 'כל האפשרויות: מתלי אוויר, מערכת שמע פרימיום, מסכי בידור אחוריים וגג פנורמי. יד ראשונה עם רישום טיפולים מלא.',
    highlights: [
      { ar: 'تعليق هوائي متكيّف', en: 'Adaptive air suspension', he: 'מתלי אוויר אדפטיביים' },
      { ar: 'سقف بانورامي', en: 'Panoramic roof', he: 'גג פנורמי' },
      { ar: 'نظام صوت فاخر', en: 'Premium surround audio', he: 'מערכת שמע פרימיום' },
      { ar: 'مالك واحد فقط', en: 'Single owner', he: 'יד ראשונה' },
    ],
    engine: '3.0 TwinPower · 380 hp',
    transmission: 'auto',
    fuel: 'petrol',
    drivetrain: 'AWD',
    colorAr: 'كحلي معدني', colorEn: 'Metallic navy', colorHe: 'כחול כהה מטאלי',
    seats: 7,
    etaAr: '5 – 7 أسابيع', etaEn: '5 – 7 weeks', etaHe: '5 – 7 שבועות',
  },
  {
    slug: 'land-cruiser-300-vxr',
    model: 'Land Cruiser 300 VXR',
    subtitleAr: 'مواصفات خليجية بتحمّل الطرق الوعرة',
    subtitleEn: 'Gulf-spec, built for punishing terrain',
    subtitleHe: 'מפרט מפרץ, בנוי לשטח קשה',
    bodyType: 'suv',
    origin: 'uae',
    status: 'inTransit',
    stage: 3,
    year: 2023,
    mileage: 41000,
    price: 398000,
    featured: true,
    descriptionAr: 'مواصفات خليجية بتبريد معزّز وفلاتر غبار إضافية، مع نظام تعليق حركي متغير. حاليًا على الباخرة ووصولها المتوقع خلال أسبوعين.',
    descriptionEn: 'Gulf specification with uprated cooling and extra dust filtration, plus the kinetic dynamic suspension system. Currently on the water with arrival expected within two weeks.',
    descriptionHe: 'מפרט מפרץ עם קירור משופר וסינון אבק נוסף, כולל מערכת מתלים קינטית. כרגע בהפלגה, הגעה צפויה בתוך שבועיים.',
    highlights: [
      { ar: 'نظام تعليق حركي KDSS', en: 'KDSS kinetic suspension', he: 'מתלים קינטיים KDSS' },
      { ar: 'تبريد معزّز للمناخ الحار', en: 'Uprated hot-climate cooling', he: 'קירור משופר לאקלים חם' },
      { ar: 'قفل تفاضلي خلفي', en: 'Rear differential lock', he: 'נעילת דיפרנציאל אחורי' },
      { ar: 'كاميرات محيطية للطرق الوعرة', en: 'Multi-terrain camera suite', he: 'מערך מצלמות שטח' },
    ],
    engine: '3.5 V6 Twin-Turbo · 415 hp',
    transmission: 'auto',
    fuel: 'petrol',
    drivetrain: '4WD',
    colorAr: 'أبيض لؤلؤي', colorEn: 'Pearl white', colorHe: 'לבן פנינה',
    seats: 7,
    etaAr: '2 أسبوع', etaEn: '2 weeks', etaHe: 'שבועיים',
  },
  {
    slug: 'electric-crew-cab-pickup',
    model: 'F-150 Lightning Lariat',
    subtitleAr: 'بيك أب كهربائي بكابينة مزدوجة',
    subtitleEn: 'All-electric crew cab pickup',
    subtitleHe: 'טנדר חשמלי בקבינה כפולה',
    bodyType: 'pickup',
    origin: 'usa',
    status: 'available',
    stage: 1,
    year: 2024,
    mileage: 12000,
    price: 372000,
    featured: false,
    descriptionAr: 'بيك أب كهربائي بمدى يصل إلى 515 كم وقدرة سحب عالية، مع نظام تغذية كهربائية للمواقع يحوّل السيارة إلى مولّد متنقل.',
    descriptionEn: 'Electric pickup with up to 515 km of range, serious towing capacity, and an onboard power system that turns the truck into a mobile generator.',
    descriptionHe: 'טנדר חשמלי עם טווח של עד 515 ק״מ, כושר גרירה גבוה ומערכת הספק שהופכת אותו לגנרטור נייד.',
    highlights: [
      { ar: 'مدى حتى 515 كم', en: 'Up to 515 km range', he: 'טווח עד 515 ק״מ' },
      { ar: 'تغذية كهربائية 9.6 كيلوواط', en: '9.6 kW onboard power', he: 'הספק 9.6 קילוואט' },
      { ar: 'صندوق أمامي مبرّد', en: 'Lockable front trunk', he: 'תא מטען קדמי' },
      { ar: 'قدرة سحب 4.5 طن', en: '4.5 t towing capacity', he: 'כושר גרירה 4.5 טון' },
    ],
    engine: 'Dual motor · 580 hp',
    transmission: 'auto',
    fuel: 'electric',
    drivetrain: 'AWD',
    colorAr: 'رمادي فضي', colorEn: 'Iconic silver', colorHe: 'כסף',
    seats: 5,
    etaAr: '6 – 8 أسابيع', etaEn: '6 – 8 weeks', etaHe: '6 – 8 שבועות',
  },
  {
    slug: 'vip-hybrid-mpv',
    model: 'LM 350h VIP',
    subtitleAr: 'مقصورة خلفية VIP بأربعة مقاعد',
    subtitleEn: 'Four-seat VIP rear cabin',
    subtitleHe: 'קבינה אחורית VIP בארבעה מושבים',
    bodyType: 'luxury_mpv',
    origin: 'japan',
    status: 'reserved',
    stage: 2,
    year: 2024,
    mileage: 8500,
    price: null,
    featured: false,
    descriptionAr: 'أفخم ما يُنقل به الركاب: مقصورة خلفية مستقلة بشاشة 48 بوصة، مقاعد كهربائية بوضعية الاستلقاء، وحاجز زجاجي كهربائي بين المقصورتين.',
    descriptionEn: 'The most refined way to move passengers: a separate rear cabin with a 48-inch screen, powered reclining seats and an electric glass partition.',
    descriptionHe: 'הדרך המשובחת ביותר להסיע נוסעים: קבינה אחורית נפרדת עם מסך 48 אינץ׳, מושבים חשמליים נשכבים ומחיצת זכוכית חשמלית.',
    highlights: [
      { ar: 'شاشة 48 بوصة للمقصورة الخلفية', en: '48-inch rear cabin screen', he: 'מסך 48 אינץ׳ מאחור' },
      { ar: 'حاجز زجاجي كهربائي', en: 'Electric glass partition', he: 'מחיצת זכוכית חשמלית' },
      { ar: 'مقاعد مساج كهربائية', en: 'Powered massage seats', he: 'מושבי מסאז׳ חשמליים' },
      { ar: 'عزل صوتي مزدوج الزجاج', en: 'Double-glazed acoustic glass', he: 'זכוכית אקוסטית כפולה' },
    ],
    engine: '2.5 Hybrid · 250 hp',
    transmission: 'auto',
    fuel: 'hybrid',
    drivetrain: 'AWD',
    colorAr: 'أسود أونيكس', colorEn: 'Onyx black', colorHe: 'שחור אוניקס',
    seats: 4,
    etaAr: '7 – 9 أسابيع', etaEn: '7 – 9 weeks', etaHe: '7 – 9 שבועות',
  },
  {
    slug: 'heavy-hauler-fh16-750',
    model: 'FH16 750 Globetrotter',
    subtitleAr: 'رأس قاطرة ثقيل بكابينة نوم كبيرة',
    subtitleEn: 'Heavy tractor unit with a full sleeper cab',
    subtitleHe: 'ראש טרקטור כבד עם קבינת שינה מלאה',
    bodyType: 'truck',
    origin: 'belgium',
    status: 'available',
    stage: 2,
    year: 2021,
    mileage: 385000,
    price: 520000,
    featured: false,
    descriptionAr: 'رأس قاطرة بقوة 750 حصانًا وناقل حركة آلي 12 سرعة، كابينة Globetrotter بسريرين ومطبخ صغير. جاهز لخطوط النقل الطويلة من أول يوم.',
    descriptionEn: '750 hp tractor unit with a 12-speed automated gearbox and a Globetrotter cab featuring twin bunks and a galley. Ready for long-haul routes from day one.',
    descriptionHe: 'ראש טרקטור 750 כ״ס עם תמסורת אוטומטית 12 הילוכים וקבינת Globetrotter עם שתי דרגשים ומטבחון.',
    highlights: [
      { ar: 'محرك 750 حصان', en: '750 hp engine', he: 'מנוע 750 כ״ס' },
      { ar: 'ناقل حركة آلي 12 سرعة', en: '12-speed automated gearbox', he: 'תמסורת אוטומטית 12 הילוכים' },
      { ar: 'كابينة نوم بسريرين', en: 'Twin-bunk sleeper cab', he: 'קבינת שינה כפולה' },
      { ar: 'معيار انبعاثات Euro 6', en: 'Euro 6 emissions', he: 'תקן זיהום Euro 6' },
    ],
    engine: 'D16K · 750 hp',
    transmission: 'auto',
    fuel: 'diesel',
    drivetrain: '6×2',
    colorAr: 'أزرق داكن', colorEn: 'Deep blue', colorHe: 'כחול עמוק',
    seats: 2,
    etaAr: '3 – 5 أسابيع', etaEn: '3 – 5 weeks', etaHe: '3 – 5 שבועות',
  },
  {
    slug: 'nine-seat-people-carrier',
    model: 'Staria Premium 9',
    subtitleAr: 'ميني فان تسعة مقاعد للنقل السياحي',
    subtitleEn: 'Nine-seat carrier for passenger transport',
    subtitleHe: 'מיניוואן תשע מקומות להסעות',
    bodyType: 'minivan',
    origin: 'korea',
    status: 'available',
    stage: 1,
    year: 2023,
    mileage: 52000,
    price: 198000,
    featured: false,
    descriptionAr: 'خيار اقتصادي وموثوق لخدمات النقل السياحي وشركات الفنادق: تسعة مقاعد بمساحة أرجل واسعة، تكييف ثلاثي المناطق، وباب جانبي كهربائي.',
    descriptionEn: 'A dependable, economical choice for shuttle and hotel transfer work: nine seats with generous legroom, tri-zone climate and a powered sliding door.',
    descriptionHe: 'בחירה אמינה וחסכונית להסעות ולמלונות: תשעה מושבים עם מרווח רגליים נדיב, מיזוג תלת-אזורי ודלת הזזה חשמלית.',
    highlights: [
      { ar: 'تسعة مقاعد كاملة', en: 'Full nine seats', he: 'תשעה מושבים מלאים' },
      { ar: 'باب جانبي كهربائي', en: 'Powered sliding door', he: 'דלת הזזה חשמלית' },
      { ar: 'تكييف ثلاثي المناطق', en: 'Tri-zone climate control', he: 'מיזוג תלת-אזורי' },
      { ar: 'حزمة مساعدات السلامة', en: 'Full driver-assist package', he: 'חבילת עזרי בטיחות' },
    ],
    engine: '2.2 CRDi · 177 hp',
    transmission: 'auto',
    fuel: 'diesel',
    drivetrain: 'FWD',
    colorAr: 'رمادي فاتح', colorEn: 'Light grey', colorHe: 'אפור בהיר',
    seats: 9,
    etaAr: '5 – 7 أسابيع', etaEn: '5 – 7 weeks', etaHe: '5 – 7 שבועות',
  },
]

// ------------------------------------------------------------------ helpers

function storeOrigin(endpoint) {
  try {
    const url = new URL(endpoint)
    return `${url.protocol}//${url.host}`
  } catch {
    return endpoint.split('/graphql')[0]
  }
}

async function wpRequest(origin, path, method, body, authHeader) {
  const url = `${origin}/wp-json${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${method} ${url} → ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

async function slugExists(origin, slug, authHeader) {
  const url = `${origin}/wp-json/wp/v2/import_car?slug=${encodeURIComponent(slug)}&per_page=1`
  const res = await fetch(url, { headers: { Authorization: authHeader } })
  if (!res.ok) return false
  const data = await res.json()
  return Array.isArray(data) && data.length > 0
}

// -------------------------------------------------------------------- main

async function main() {
  const endpoint = (process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? '').trim()
  const user = (process.env.WORDPRESS_USER ?? '').trim()
  const appPassword = (process.env.WORDPRESS_APP_PASSWORD ?? '').trim()
  const dryRun = process.argv.includes('--dry-run')

  if (!endpoint) {
    throw new Error('WORDPRESS_GRAPHQL_ENDPOINT is not set in .env.local')
  }
  if (!user || !appPassword) {
    throw new Error(
      'WORDPRESS_USER and WORDPRESS_APP_PASSWORD must be set.\n' +
      'Create an Application Password in WordPress: Dashboard → Users → Your Profile → Application Passwords.'
    )
  }

  const origin = storeOrigin(endpoint)
  const authHeader = 'Basic ' + Buffer.from(`${user}:${appPassword}`).toString('base64')

  console.log(`\nEndpoint: ${origin}`)
  console.log(`Mode:     ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`)
  console.log(`Cars:     ${SEED_CARS.length}\n`)

  let created = 0
  let skipped = 0

  for (const car of SEED_CARS) {
    process.stdout.write(`  ${car.slug} … `)

    if (await slugExists(origin, car.slug, authHeader)) {
      console.log('already exists, skipping')
      skipped++
      continue
    }

    if (dryRun) {
      console.log('would create')
      created++
      continue
    }

    // 1. Create the post
    const post = await wpRequest(origin, '/wp/v2/import_car', 'POST', {
      title: car.model,
      slug: car.slug,
      status: 'publish',
    }, authHeader)

    const postId = post.id

    // 2. Set ACF fields via the ACF REST endpoint
    const acfFields = {
      car_model: car.model,
      car_subtitle_ar: car.subtitleAr,
      car_subtitle_en: car.subtitleEn,
      car_subtitle_he: car.subtitleHe,
      body_type: car.bodyType,
      origin: car.origin,
      status: car.status,
      stage: car.stage,
      year: car.year,
      mileage: car.mileage,
      price: car.price ?? '',
      featured: car.featured ? 1 : 0,
      description_ar: car.descriptionAr,
      description_en: car.descriptionEn,
      description_he: car.descriptionHe,
      eta_ar: car.etaAr,
      eta_en: car.etaEn,
      eta_he: car.etaHe,
      specs: {
        engine: car.engine,
        transmission: car.transmission,
        fuel: car.fuel,
        drivetrain: car.drivetrain,
        color_ar: car.colorAr,
        color_en: car.colorEn,
        color_he: car.colorHe,
        seats: car.seats,
      },
      // Highlights 1–4 (seed data always has exactly 4)
      ...Object.fromEntries(
        car.highlights.map((h, i) => [
          `highlight_${i + 1}`,
          { item_ar: h.ar, item_en: h.en, item_he: h.he },
        ])
      ),
    }

    await wpRequest(origin, `/acf/v3/import_car/${postId}`, 'POST', { fields: acfFields }, authHeader)

    console.log(`created (id=${postId})`)
    created++
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}\n`)

  if (!dryRun && created > 0) {
    console.log('Next steps:')
    console.log('  1. Open WordPress admin → Import Cars and verify the new posts.')
    console.log('  2. Add cover images in the WordPress media library.')
    console.log('  3. Once you are happy, remove the SEED_CARS array from this script\n     (or keep it — re-running is safe because the slug check prevents duplicates).')
  }
}

main().catch((err) => {
  console.error('\n✖', err.message)
  process.exit(1)
})
