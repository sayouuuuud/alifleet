import type { Localized } from '@/lib/i18n/localized'

export type CarOrigin = 'germany' | 'uae' | 'usa' | 'japan' | 'korea' | 'belgium'
export type CarStatus = 'available' | 'inTransit' | 'reserved' | 'sold'

export type ImportCar = {
  slug: string
  /** Display name is language-neutral (make + model), the subtitle is localized. */
  model: string
  subtitle: Localized
  bodyType: Localized
  origin: CarOrigin
  status: CarStatus
  /** 1–4, matching the four import steps — how far this unit has progressed. */
  stage: 1 | 2 | 3 | 4
  year: number
  /** Kilometres. 0 means brand new. */
  mileage: number
  /** Estimated landed price. `null` renders as "on request". */
  price: number | null
  featured?: boolean
  image: string
  alt: Localized
  gallery: { src: string; alt: Localized }[]
  description: Localized
  highlights: Localized[]
  specs: {
    engine: string
    transmission: Localized
    fuel: Localized
    drivetrain: string
    color: Localized
    seats: number
  }
  eta: Localized
}

const auto = { ar: 'أوتوماتيك', en: 'Automatic', he: 'אוטומטי' }
const manual = { ar: 'يدوي', en: 'Manual', he: 'ידני' }
const diesel = { ar: 'ديزل', en: 'Diesel', he: 'דיזל' }
const petrol = { ar: 'بنزين', en: 'Petrol', he: 'בנזין' }
const hybrid = { ar: 'هايبرد', en: 'Hybrid', he: 'היברידי' }
const electric = { ar: 'كهربائي', en: 'Electric', he: 'חשמלי' }

const portShot = {
  src: '/images/port-light.png',
  alt: {
    ar: 'ميناء شحن السيارات في ضوء النهار',
    en: 'Vehicle shipping port in daylight',
    he: 'נמל שילוח רכבים באור יום',
  },
}
const inspectionShot = {
  src: '/images/import-inspection.png',
  alt: {
    ar: 'فحص فني للسيارة على رافعة في ورشة نظيفة',
    en: 'Technical inspection of a vehicle on a workshop lift',
    he: 'בדיקה טכנית של רכב על מגבה במוסך',
  },
}
const globalShot = {
  src: '/images/import-global.png',
  alt: {
    ar: 'سيارات مستوردة من أسواق عالمية',
    en: 'Vehicles imported from global markets',
    he: 'רכבים מיובאים משווקים גלובליים',
  },
}

export const importCars: ImportCar[] = [
  {
    slug: 'executive-sprinter-519-cdi',
    model: 'Sprinter 519 CDI',
    subtitle: {
      ar: 'فان تنفيذي بسقف مرتفع وتجهيز داخلي فاخر',
      en: 'High-roof executive van with a bespoke interior',
      he: 'ואן ניהולי גג גבוה עם פנים מותאם',
    },
    bodyType: { ar: 'فان', en: 'Van', he: 'ואן' },
    origin: 'germany',
    status: 'available',
    stage: 2,
    year: 2022,
    mileage: 68000,
    price: 289000,
    featured: true,
    image: '/images/import-sprinter.png',
    alt: {
      ar: 'فان أبيض كبير بسقف مرتفع في استوديو فاتح',
      en: 'Large white high-roof van in a bright studio',
      he: 'ואן לבן גדול בגג גבוה בסטודיו בהיר',
    },
    gallery: [inspectionShot, portShot],
    description: {
      ar: 'فان تنفيذي مجهّز من الوكالة بمقاعد كابتن جلدية وإضاءة محيطة وعزل صوتي كامل. صيانة موثقة بالكامل من مركز خدمة معتمد في ألمانيا، وجاهز للفحص قبل الشحن.',
      en: 'Factory-fitted executive van with leather captain seats, ambient lighting and full acoustic insulation. Complete service history from an authorised German service centre, ready for a pre-shipment inspection.',
      he: 'ואן ניהולי עם מושבי קפטן מעור, תאורת אווירה ובידוד אקוסטי מלא. היסטוריית טיפולים מלאה ממרכז שירות מוסמך בגרמניה.',
    },
    highlights: [
      { ar: 'مقاعد كابتن جلدية × 4', en: '4 leather captain seats', he: '4 מושבי קפטן מעור' },
      { ar: 'تكييف خلفي مستقل', en: 'Independent rear climate', he: 'מיזוג אחורי עצמאי' },
      { ar: 'كاميرا 360 درجة', en: '360° camera', he: 'מצלמת 360°' },
      { ar: 'صيانة موثقة بالكامل', en: 'Full documented service history', he: 'היסטוריית טיפולים מלאה' },
    ],
    specs: {
      engine: '2.0 CDI · 190 hp',
      transmission: auto,
      fuel: diesel,
      drivetrain: 'RWD',
      color: { ar: 'أبيض قطبي', en: 'Polar white', he: 'לבן פולארי' },
      seats: 7,
    },
    eta: { ar: '4 – 6 أسابيع', en: '4 – 6 weeks', he: '4 – 6 שבועות' },
  },
  {
    slug: 'luxury-suv-xdrive-40i',
    model: 'X7 xDrive40i',
    subtitle: {
      ar: 'دفع رباعي فاخر بسبعة مقاعد وتجهيز كامل',
      en: 'Fully-loaded seven-seat luxury SUV',
      he: 'רכב שטח יוקרתי שבע מקומות בגימור מלא',
    },
    bodyType: { ar: 'دفع رباعي', en: 'SUV', he: 'רכב שטח' },
    origin: 'germany',
    status: 'available',
    stage: 1,
    year: 2023,
    mileage: 24000,
    price: 465000,
    featured: true,
    image: '/images/import-luxury-suv.png',
    alt: {
      ar: 'سيارة دفع رباعي فاخرة كحلية في استوديو فاتح',
      en: 'Navy blue luxury SUV in a bright studio',
      he: 'רכב שטח יוקרתי כחול כהה בסטודיו בהיר',
    },
    gallery: [globalShot, inspectionShot],
    description: {
      ar: 'نسخة مجهزة بكل الإضافات: تعليق هوائي، نظام صوت فاخر، شاشة خلفية ترفيهية، وفتحة سقف بانورامية. مالك واحد وسجل خدمة كامل من الوكيل.',
      en: 'Every box ticked: air suspension, premium audio, rear entertainment screens and a panoramic roof. One owner with a complete main-dealer service record.',
      he: 'כל האפשרויות: מתלי אוויר, מערכת שמע פרימיום, מסכי בידור אחוריים וגג פנורמי. יד ראשונה עם רישום טיפולים מלא.',
    },
    highlights: [
      { ar: 'تعليق هوائي متكيّف', en: 'Adaptive air suspension', he: 'מתלי אוויר אדפטיביים' },
      { ar: 'سقف بانورامي', en: 'Panoramic roof', he: 'גג פנורמי' },
      { ar: 'نظام صوت فاخر', en: 'Premium surround audio', he: 'מערכת שמע פרימיום' },
      { ar: 'مالك واحد فقط', en: 'Single owner', he: 'יד ראשונה' },
    ],
    specs: {
      engine: '3.0 TwinPower · 380 hp',
      transmission: auto,
      fuel: petrol,
      drivetrain: 'AWD',
      color: { ar: 'كحلي معدني', en: 'Metallic navy', he: 'כחול כהה מטאלי' },
      seats: 7,
    },
    eta: { ar: '5 – 7 أسابيع', en: '5 – 7 weeks', he: '5 – 7 שבועות' },
  },
  {
    slug: 'land-cruiser-300-vxr',
    model: 'Land Cruiser 300 VXR',
    subtitle: {
      ar: 'مواصفات خليجية بتحمّل الطرق الوعرة',
      en: 'Gulf-spec, built for punishing terrain',
      he: 'מפרט מפרץ, בנוי לשטח קשה',
    },
    bodyType: { ar: 'دفع رباعي', en: 'SUV', he: 'רכב שטח' },
    origin: 'uae',
    status: 'inTransit',
    stage: 3,
    year: 2023,
    mileage: 41000,
    price: 398000,
    featured: true,
    image: '/images/import-landcruiser.png',
    alt: {
      ar: 'سيارة دفع رباعي بيضاء لؤلؤية للطرق الوعرة',
      en: 'Pearl white full-size off-road SUV',
      he: 'רכב שטח לבן פנינה',
    },
    gallery: [portShot, globalShot],
    description: {
      ar: 'مواصفات خليجية بتبريد معزّز وفلاتر غبار إضافية، مع نظام تعليق حركي متغير. حاليًا على الباخرة ووصولها المتوقع خلال أسبوعين.',
      en: 'Gulf specification with uprated cooling and extra dust filtration, plus the kinetic dynamic suspension system. Currently on the water with arrival expected within two weeks.',
      he: 'מפרט מפרץ עם קירור משופר וסינון אבק נוסף, כולל מערכת מתלים קינטית. כרגע בהפלגה, הגעה צפויה בתוך שבועיים.',
    },
    highlights: [
      { ar: 'نظام تعليق حركي KDSS', en: 'KDSS kinetic suspension', he: 'מתלים קינטיים KDSS' },
      { ar: 'تبريد معزّز للمناخ الحار', en: 'Uprated hot-climate cooling', he: 'קירור משופר לאקלים חם' },
      { ar: 'قفل تفاضلي خلفي', en: 'Rear differential lock', he: 'נעילת דיפרנציאל אחורי' },
      { ar: 'كاميرات محيطية للطرق الوعرة', en: 'Multi-terrain camera suite', he: 'מערך מצלמות שטח' },
    ],
    specs: {
      engine: '3.5 V6 Twin-Turbo · 415 hp',
      transmission: auto,
      fuel: petrol,
      drivetrain: '4WD',
      color: { ar: 'أبيض لؤلؤي', en: 'Pearl white', he: 'לבן פנינה' },
      seats: 7,
    },
    eta: { ar: '2 أسبوع', en: '2 weeks', he: 'שבועיים' },
  },
  {
    slug: 'electric-crew-cab-pickup',
    model: 'F-150 Lightning Lariat',
    subtitle: {
      ar: 'بيك أب كهربائي بكابينة مزدوجة',
      en: 'All-electric crew cab pickup',
      he: 'טנדר חשמלי בקבינה כפולה',
    },
    bodyType: { ar: 'بيك أب', en: 'Pickup', he: 'טנדר' },
    origin: 'usa',
    status: 'available',
    stage: 1,
    year: 2024,
    mileage: 12000,
    price: 372000,
    image: '/images/import-pickup.png',
    alt: {
      ar: 'بيك أب فضي بكابينة مزدوجة في استوديو فاتح',
      en: 'Silver crew cab pickup truck in a bright studio',
      he: 'טנדר כפול-קבינה בכסף בסטודיו בהיר',
    },
    gallery: [inspectionShot, globalShot],
    description: {
      ar: 'بيك أب كهربائي بمدى يصل إلى 515 كم وقدرة سحب عالية، مع نظام تغذية كهربائية للمواقع يحوّل السيارة إلى مولّد متنقل.',
      en: 'Electric pickup with up to 515 km of range, serious towing capacity, and an onboard power system that turns the truck into a mobile generator.',
      he: 'טנדר חשמלי עם טווח של עד 515 ק״מ, כושר גרירה גבוה ומערכת הספק שהופכת אותו לגנרטור נייד.',
    },
    highlights: [
      { ar: 'مدى حتى 515 كم', en: 'Up to 515 km range', he: 'טווח עד 515 ק״מ' },
      { ar: 'تغذية كهربائية 9.6 كيلوواط', en: '9.6 kW onboard power', he: 'הספק 9.6 קילוואט' },
      { ar: 'صندوق أمامي مبرّد', en: 'Lockable front trunk', he: 'תא מטען קדמי' },
      { ar: 'قدرة سحب 4.5 طن', en: '4.5 t towing capacity', he: 'כושר גרירה 4.5 טון' },
    ],
    specs: {
      engine: 'Dual motor · 580 hp',
      transmission: auto,
      fuel: electric,
      drivetrain: 'AWD',
      color: { ar: 'رمادي فضي', en: 'Iconic silver', he: 'כסף' },
      seats: 5,
    },
    eta: { ar: '6 – 8 أسابيع', en: '6 – 8 weeks', he: '6 – 8 שבועות' },
  },
  {
    slug: 'vip-hybrid-mpv',
    model: 'LM 350h VIP',
    subtitle: {
      ar: 'مقصورة خلفية VIP بأربعة مقاعد',
      en: 'Four-seat VIP rear cabin',
      he: 'קבינה אחורית VIP בארבעה מושבים',
    },
    bodyType: { ar: 'MPV فاخر', en: 'Luxury MPV', he: 'MPV יוקרתי' },
    origin: 'japan',
    status: 'reserved',
    stage: 2,
    year: 2024,
    mileage: 8500,
    price: null,
    image: '/images/import-vip-mpv.png',
    alt: {
      ar: 'فان تنفيذي أسود فاخر في استوديو فاتح',
      en: 'Black luxury executive MPV in a bright studio',
      he: 'MPV ניהולי שחור בסטודיו בהיר',
    },
    gallery: [globalShot, inspectionShot],
    description: {
      ar: 'أفخم ما يُنقل به الركاب: مقصورة خلفية مستقلة بشاشة 48 بوصة، مقاعد كهربائية بوضعية الاستلقاء، وحاجز زجاجي كهربائي بين المقصورتين.',
      en: 'The most refined way to move passengers: a separate rear cabin with a 48-inch screen, powered reclining seats and an electric glass partition.',
      he: 'הדרך המשובחת ביותר להסיע נוסעים: קבינה אחורית נפרדת עם מסך 48 אינץ׳, מושבים חשמליים נשכבים ומחיצת זכוכית חשמלית.',
    },
    highlights: [
      { ar: 'شاشة 48 بوصة للمقصورة الخلفية', en: '48-inch rear cabin screen', he: 'מסך 48 אינץ׳ מאחור' },
      { ar: 'حاجز زجاجي كهربائي', en: 'Electric glass partition', he: 'מחיצת זכוכית חשמלית' },
      { ar: 'مقاعد مساج كهربائية', en: 'Powered massage seats', he: 'מושבי מסאז׳ חשמליים' },
      { ar: 'عزل صوتي مزدوج الزجاج', en: 'Double-glazed acoustic glass', he: 'זכוכית אקוסטית כפולה' },
    ],
    specs: {
      engine: '2.5 Hybrid · 250 hp',
      transmission: auto,
      fuel: hybrid,
      drivetrain: 'AWD',
      color: { ar: 'أسود أونيكس', en: 'Onyx black', he: 'שחור אוניקס' },
      seats: 4,
    },
    eta: { ar: '7 – 9 أسابيع', en: '7 – 9 weeks', he: '7 – 9 שבועות' },
  },
  {
    slug: 'heavy-hauler-fh16-750',
    model: 'FH16 750 Globetrotter',
    subtitle: {
      ar: 'رأس قاطرة ثقيل بكابينة نوم كبيرة',
      en: 'Heavy tractor unit with a full sleeper cab',
      he: 'ראש טרקטור כבד עם קבינת שינה מלאה',
    },
    bodyType: { ar: 'شاحنة', en: 'Truck', he: 'משאית' },
    origin: 'belgium',
    status: 'available',
    stage: 2,
    year: 2021,
    mileage: 385000,
    price: 520000,
    image: '/images/import-heavy-truck.png',
    alt: {
      ar: 'رأس قاطرة أزرق ثقيل في استوديو فاتح',
      en: 'Blue heavy-duty semi truck tractor unit in a bright studio',
      he: 'ראש טרקטור כבד כחול בסטודיו בהיר',
    },
    gallery: [portShot, inspectionShot],
    description: {
      ar: 'رأس قاطرة بقوة 750 حصانًا وناقل حركة آلي 12 سرعة، كابينة Globetrotter بسريرين ومطبخ صغير. جاهز لخطوط النقل الطويلة من أول يوم.',
      en: '750 hp tractor unit with a 12-speed automated gearbox and a Globetrotter cab featuring twin bunks and a galley. Ready for long-haul routes from day one.',
      he: 'ראש טרקטור 750 כ״ס עם תמסורת אוטומטית 12 הילוכים וקבינת Globetrotter עם שתי דרגשים ומטבחון.',
    },
    highlights: [
      { ar: 'محرك 750 حصان', en: '750 hp engine', he: 'מנוע 750 כ״ס' },
      { ar: 'ناقل حركة آلي 12 سرعة', en: '12-speed automated gearbox', he: 'תמסורת אוטומטית 12 הילוכים' },
      { ar: 'كابينة نوم بسريرين', en: 'Twin-bunk sleeper cab', he: 'קבינת שינה כפולה' },
      { ar: 'معيار انبعاثات Euro 6', en: 'Euro 6 emissions', he: 'תקן זיהום Euro 6' },
    ],
    specs: {
      engine: 'D16K · 750 hp',
      transmission: auto,
      fuel: diesel,
      drivetrain: '6×2',
      color: { ar: 'أزرق داكن', en: 'Deep blue', he: 'כחול עמוק' },
      seats: 2,
    },
    eta: { ar: '3 – 5 أسابيع', en: '3 – 5 weeks', he: '3 – 5 שבועות' },
  },
  {
    slug: 'nine-seat-people-carrier',
    model: 'Staria Premium 9',
    subtitle: {
      ar: 'ميني فان تسعة مقاعد للنقل السياحي',
      en: 'Nine-seat carrier for passenger transport',
      he: 'מיניוואן תשע מקומות להסעות',
    },
    bodyType: { ar: 'ميني فان', en: 'Minivan', he: 'מיניוואן' },
    origin: 'korea',
    status: 'available',
    stage: 1,
    year: 2023,
    mileage: 52000,
    price: 198000,
    image: '/images/import-people-van.png',
    alt: {
      ar: 'ميني فان رمادي بتسعة مقاعد في استوديو فاتح',
      en: 'Grey nine-seat minivan in a bright studio',
      he: 'מיניוואן אפור תשע מקומות בסטודיו בהיר',
    },
    gallery: [inspectionShot, portShot],
    description: {
      ar: 'خيار اقتصادي وموثوق لخدمات النقل السياحي وشركات الفنادق: تسعة مقاعد بمساحة أرجل واسعة، تكييف ثلاثي المناطق، وباب جانبي كهربائي.',
      en: 'A dependable, economical choice for shuttle and hotel transfer work: nine seats with generous legroom, tri-zone climate and a powered sliding door.',
      he: 'בחירה אמינה וחסכונית להסעות ולמלונות: תשעה מושבים עם מרווח רגליים נדיב, מיזוג תלת-אזורי ודלת הזזה חשמלית.',
    },
    highlights: [
      { ar: 'تسعة مقاعد كاملة', en: 'Full nine seats', he: 'תשעה מושבים מלאים' },
      { ar: 'باب جانبي كهربائي', en: 'Powered sliding door', he: 'דלת הזזה חשמלית' },
      { ar: 'تكييف ثلاثي المناطق', en: 'Tri-zone climate control', he: 'מיזוג תלת-אזורי' },
      { ar: 'حزمة مساعدات السلامة', en: 'Full driver-assist package', he: 'חבילת עזרי בטיחות' },
    ],
    specs: {
      engine: '2.2 CRDi · 177 hp',
      transmission: auto,
      fuel: diesel,
      drivetrain: 'FWD',
      color: { ar: 'رمادي فاتح', en: 'Light grey', he: 'אפור בהיר' },
      seats: 9,
    },
    eta: { ar: '5 – 7 أسابيع', en: '5 – 7 weeks', he: '5 – 7 שבועות' },
  },
]

export function getImportCar(slug: string) {
  return importCars.find((c) => c.slug === slug)
}

export function similarCars(car: ImportCar, limit = 3) {
  return importCars
    .filter((c) => c.slug !== car.slug && c.bodyType.en === car.bodyType.en)
    .concat(importCars.filter((c) => c.slug !== car.slug && c.bodyType.en !== car.bodyType.en))
    .slice(0, limit)
}

export const carOrigins: CarOrigin[] = ['germany', 'uae', 'usa', 'japan', 'korea', 'belgium']
export const carStatuses: CarStatus[] = ['available', 'inTransit', 'reserved', 'sold']
