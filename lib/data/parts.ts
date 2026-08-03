import type { Localized, LocalizedOrPlain } from '@/lib/i18n/localized'

export type PartCategory =
  | 'brakes'
  | 'engine'
  | 'lighting'
  | 'wheels'
  | 'transmission'
  | 'filters'
  | 'suspension'
  | 'electrical'

export type Part = {
  slug: string
  /** WooCommerce product id — used to hand the cart over at checkout. */
  wooId: number
  sku: string
  category: PartCategory
  brand: string
  price: number
  inStock: boolean
  featured?: boolean
  image: string
  alt: Localized
  name: Localized
  description: Localized
  specs: { label: Localized; value: LocalizedOrPlain }[]
  compatibility: string[]
}

export const partCategories: PartCategory[] = [
  'brakes',
  'engine',
  'lighting',
  'wheels',
  'transmission',
  'filters',
  'suspension',
  'electrical',
]

const L = {
  material: { ar: 'المادة', en: 'Material', he: 'חומר' },
  diameter: { ar: 'القطر', en: 'Diameter', he: 'קוטר' },
  position: { ar: 'الموضع', en: 'Position', he: 'מיקום' },
  warranty: { ar: 'الضمان', en: 'Warranty', he: 'אחריות' },
  weight: { ar: 'الوزن', en: 'Weight', he: 'משקל' },
  origin: { ar: 'بلد المنشأ', en: 'Origin', he: 'ארץ מקור' },
  voltage: { ar: 'الجهد', en: 'Voltage', he: 'מתח' },
  output: { ar: 'القدرة', en: 'Output', he: 'הספק' },
  boost: { ar: 'ضغط الشحن', en: 'Boost pressure', he: 'לחץ הזנה' },
  set: { ar: 'محتوى العلبة', en: 'Kit contents', he: 'תכולת הערכה' },
  lumens: { ar: 'شدة الإضاءة', en: 'Light output', he: 'עוצמת אור' },
  size: { ar: 'المقاس', en: 'Size', he: 'מידה' },
  efficiency: { ar: 'كفاءة الترشيح', en: 'Filtration', he: 'סינון' },
  travel: { ar: 'شوط الامتصاص', en: 'Stroke', he: 'מהלך' },
  torque: { ar: 'عزم التحمل', en: 'Torque rating', he: 'דירוג מומנט' },
  months12: { ar: '12 شهرًا', en: '12 months', he: '12 חודשים' },
  months24: { ar: '24 شهرًا', en: '24 months', he: '24 חודשים' },
  germany: { ar: 'ألمانيا', en: 'Germany', he: 'גרמניה' },
  japan: { ar: 'اليابان', en: 'Japan', he: 'יפן' },
  italy: { ar: 'إيطاليا', en: 'Italy', he: 'איטליה' },
  front: { ar: 'أمامي', en: 'Front axle', he: 'סרן קדמי' },
  rear: { ar: 'خلفي', en: 'Rear axle', he: 'סרן אחורי' },
} satisfies Record<string, Localized>

export const parts: Part[] = [
  {
    slug: 'ventilated-brake-disc-set',
    wooId: 1001,
    sku: 'AF-BRK-330V',
    category: 'brakes',
    brand: 'Brembo',
    price: 1290,
    inStock: true,
    featured: true,
    image: '/images/part-brake.png',
    alt: {
      ar: 'طقم أقراص فرامل مهوّاة على خلفية استوديو فاتحة',
      en: 'Set of ventilated brake discs on a light studio background',
      he: 'סט דיסקי בלם מאווררים על רקע סטודיו בהיר',
    },
    name: {
      ar: 'طقم أقراص فرامل مهوّاة 330 مم',
      en: 'Ventilated Brake Disc Set 330 mm',
      he: 'סט דיסקי בלם מאווררים 330 מ״מ',
    },
    description: {
      ar: 'أقراص فرامل مهوّاة عالية الأداء لمقاومة الحرارة على المنحدرات والأحمال الثقيلة. تصنيع من الحديد الزهر المرن مع طلاء مضاد للصدأ يحافظ على المظهر والأداء لفترة أطول.',
      en: 'High-performance ventilated discs engineered to resist heat fade on long descents and heavy loads. Cast from high-carbon iron with an anti-corrosion coating that keeps both looks and stopping power for longer.',
      he: 'דיסקים מאווררים בעלי ביצועים גבוהים שתוכננו לעמוד בהתחממות בירידות ארוכות ובעומסים כבדים. יצוקים מברזל עתיר פחמן עם ציפוי נגד קורוזיה.',
    },
    specs: [
      { label: L.diameter, value: '330 mm' },
      { label: L.material, value: { ar: 'حديد زهر عالي الكربون', en: 'High-carbon cast iron', he: 'ברזל יצוק עתיר פחמן' } },
      { label: L.position, value: L.front },
      { label: L.warranty, value: L.months24 },
      { label: L.origin, value: L.italy },
    ],
    compatibility: ['Sprinter 907', 'Crafter 2E', 'Transit V363', 'Daily 35S'],
  },
  {
    slug: 'heavy-duty-brake-pads',
    wooId: 1002,
    sku: 'AF-BRK-PD24',
    category: 'brakes',
    brand: 'Textar',
    price: 460,
    inStock: true,
    image: '/images/part-brake-pads.png',
    alt: {
      ar: 'طقم تيل فرامل للخدمة الشاقة',
      en: 'Set of heavy-duty brake pads',
      he: 'סט רפידות בלם לעבודה כבדה',
    },
    name: {
      ar: 'تيل فرامل للخدمة الشاقة',
      en: 'Heavy-Duty Brake Pad Set',
      he: 'סט רפידות בלם לעבודה כבדה',
    },
    description: {
      ar: 'خلطة احتكاك منخفضة الغبار وهادئة الصوت مع صفائح دعم مضادة للصرير، مخصصة للمركبات التجارية التي تعمل بحمولة كاملة يوميًا.',
      en: 'Low-dust, low-noise friction compound with anti-squeal backing shims, developed for commercial vehicles running at full payload every day.',
      he: 'תרכובת חיכוך שקטה ודלת אבק עם שימים נגד חריקות, שפותחה לרכבים מסחריים בעומס מלא.',
    },
    specs: [
      { label: L.set, value: { ar: '4 قطع + مسامير تثبيت', en: '4 pads + fitting hardware', he: '4 רפידות + חומרת התקנה' } },
      { label: L.position, value: L.front },
      { label: L.warranty, value: L.months12 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['Sprinter 907', 'Transit V363', 'Master III'],
  },
  {
    slug: 'turbocharger-assembly',
    wooId: 1003,
    sku: 'AF-ENG-TB19',
    category: 'engine',
    brand: 'Garrett',
    price: 6850,
    inStock: true,
    featured: true,
    image: '/images/part-turbo.png',
    alt: {
      ar: 'شاحن توربيني كامل على خلفية فاتحة',
      en: 'Complete turbocharger assembly on a light background',
      he: 'מגדש טורבו שלם על רקע בהיר',
    },
    name: {
      ar: 'شاحن توربيني كامل بهندسة متغيرة',
      en: 'Variable-Geometry Turbocharger',
      he: 'מגדש טורבו בגיאומטריה משתנה',
    },
    description: {
      ar: 'وحدة توربو أصلية بهندسة ريش متغيرة تعطي عزمًا مبكرًا واستجابة فورية. تأتي متوازنة ومختبرة على منصة قياس قبل الشحن.',
      en: 'Genuine variable-vane turbo unit delivering low-end torque and instant response. Every unit is balanced and flow-tested on a rig before it ships.',
      he: 'יחידת טורבו מקורית עם מדפים משתנים המספקת מומנט בסבבים נמוכים ותגובה מיידית. כל יחידה מאוזנת ונבדקת לפני המשלוח.',
    },
    specs: [
      { label: L.boost, value: '1.8 bar' },
      { label: L.material, value: { ar: 'سبيكة إنكونيل', en: 'Inconel alloy', he: 'סגסוגת אינקונל' } },
      { label: L.weight, value: '9.4 kg' },
      { label: L.warranty, value: L.months24 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['OM651', 'OM642', '2.0 EcoBlue', '2.3 dCi'],
  },
  {
    slug: 'piston-ring-kit',
    wooId: 1004,
    sku: 'AF-ENG-PR06',
    category: 'engine',
    brand: 'Mahle',
    price: 2340,
    inStock: true,
    image: '/images/part-piston.png',
    alt: {
      ar: 'طقم بساتم وحلقات محرك',
      en: 'Engine piston and ring kit',
      he: 'ערכת בוכנות וטבעות למנוע',
    },
    name: {
      ar: 'طقم بساتم وحلقات محرك',
      en: 'Piston & Ring Overhaul Kit',
      he: 'ערכת שיפוץ בוכנות וטבעות',
    },
    description: {
      ar: 'طقم عمرة كامل بمقاسات مصنعية دقيقة، مع بساتم مطلية بالجرافيت لتقليل الاحتكاك في أول ساعات التشغيل.',
      en: 'Complete overhaul kit machined to factory tolerances, with graphite-coated pistons that cut friction during the critical break-in hours.',
      he: 'ערכת שיפוץ מלאה בסבילות מקוריות, עם בוכנות מצופות גרפיט להפחתת חיכוך בשעות ההרצה.',
    },
    specs: [
      { label: L.set, value: { ar: '6 بساتم + حلقات + مسامير', en: '6 pistons + rings + pins', he: '6 בוכנות + טבעות + פינים' } },
      { label: L.diameter, value: '83 mm' },
      { label: L.warranty, value: L.months12 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['OM651', 'D4CB', '2.2 TDCi'],
  },
  {
    slug: 'led-headlight-unit',
    wooId: 1005,
    sku: 'AF-LGT-LED7',
    category: 'lighting',
    brand: 'Hella',
    price: 3180,
    inStock: true,
    featured: true,
    image: '/images/part-headlight.png',
    alt: {
      ar: 'وحدة إضاءة أمامية LED',
      en: 'LED headlight unit',
      he: 'יחידת פנס LED',
    },
    name: {
      ar: 'وحدة إضاءة أمامية LED مصفوفية',
      en: 'Matrix LED Headlight Unit',
      he: 'יחידת פנס LED מטריצה',
    },
    description: {
      ar: 'وحدة إضاءة كاملة بتقنية المصفوفة وإضاءة نهارية متكاملة، محكمة الغلق ضد الغبار والماء بمعيار IP68.',
      en: 'Complete matrix headlight with integrated daytime running light, sealed to IP68 against dust and water ingress.',
      he: 'פנס מטריצה מלא עם תאורת יום משולבת, אטום בתקן IP68 מפני אבק ומים.',
    },
    specs: [
      { label: L.lumens, value: '4 200 lm' },
      { label: L.voltage, value: '12 / 24 V' },
      { label: L.position, value: { ar: 'أمامي يسار / يمين', en: 'Front left / right', he: 'קדמי שמאל / ימין' } },
      { label: L.warranty, value: L.months24 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['Sprinter 907', 'Actros MP5', 'FH16', 'Transit V363'],
  },
  {
    slug: 'forged-alloy-wheel-22',
    wooId: 1006,
    sku: 'AF-WHL-F22',
    category: 'wheels',
    brand: 'BBS',
    price: 4450,
    inStock: true,
    image: '/images/part-wheel.png',
    alt: {
      ar: 'جنط ألمنيوم مطروق مقاس 22 بوصة',
      en: 'Forged 22-inch alloy wheel',
      he: 'חישוק סגסוגת מחושל 22 אינץ׳',
    },
    name: {
      ar: 'جنط ألمنيوم مطروق 22 بوصة',
      en: 'Forged Alloy Wheel 22"',
      he: 'חישוק סגסוגת מחושל 22"',
    },
    description: {
      ar: 'جنط مطروق خفيف الوزن بتشطيب ماسي مصقول، يقلل الوزن غير المعلق ويحسن الاستجابة والتبريد للفرامل.',
      en: 'Lightweight forged wheel with a diamond-cut finish. Less unsprung mass means sharper handling and better brake cooling.',
      he: 'חישוק מחושל קל משקל בגימור יהלום. פחות מסה בלתי מומטת — אחיזה חדה וקירור בלמים טוב יותר.',
    },
    specs: [
      { label: L.size, value: '22" × 9.5J' },
      { label: L.material, value: { ar: 'ألمنيوم مطروق', en: 'Forged aluminium', he: 'אלומיניום מחושל' } },
      { label: L.weight, value: '11.2 kg' },
      { label: L.warranty, value: L.months24 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['X7 G07', 'Land Cruiser 300', 'GLS X167'],
  },
  {
    slug: 'gearbox-synchro-set',
    wooId: 1007,
    sku: 'AF-TRN-SY12',
    category: 'transmission',
    brand: 'ZF',
    price: 3960,
    inStock: true,
    image: '/images/part-gear.png',
    alt: {
      ar: 'طقم تروس ومزامنات ناقل حركة',
      en: 'Gearbox gear and synchro set',
      he: 'סט גלגלי שיניים וסינכרון לתמסורת',
    },
    name: {
      ar: 'طقم تروس ومزامنات ناقل الحركة',
      en: 'Gearbox Synchro & Gear Set',
      he: 'סט סינכרון וגלגלי שיניים',
    },
    description: {
      ar: 'تروس مقواة ومزامنات جديدة لإعادة تأهيل ناقل الحركة اليدوي، تنهي مشاكل صعوبة الغيار والقفز من التروس العالية.',
      en: 'Hardened gears and fresh synchro rings to rebuild a manual gearbox — the fix for crunchy shifts and jumping out of the high gears.',
      he: 'גלגלי שיניים מוקשים וטבעות סינכרון חדשות לשיפוץ תמסורת ידנית — הפתרון להעברות קשות וניתוק הילוכים.',
    },
    specs: [
      { label: L.torque, value: '2 300 Nm' },
      { label: L.set, value: { ar: '12 سرعة كاملة', en: 'Full 12-speed set', he: 'סט מלא 12 הילוכים' } },
      { label: L.warranty, value: L.months12 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['ZF 12TX', 'Actros MP4', 'FH13'],
  },
  {
    slug: 'premium-oil-filter',
    wooId: 1008,
    sku: 'AF-FLT-OL33',
    category: 'filters',
    brand: 'Mann-Filter',
    price: 145,
    inStock: true,
    image: '/images/part-oil-filter.png',
    alt: {
      ar: 'فلتر زيت معدني على خلفية فاتحة',
      en: 'Metal spin-on oil filter on a light background',
      he: 'מסנן שמן מתכתי על רקע בהיר',
    },
    name: {
      ar: 'فلتر زيت أصلي',
      en: 'Premium Spin-On Oil Filter',
      he: 'מסנן שמן פרימיום',
    },
    description: {
      ar: 'وسط ترشيح صناعي متعدد الطبقات يحبس الجزيئات حتى 15 ميكرون، مع صمام مانع للرجوع يحافظ على ضغط الزيت عند التشغيل البارد.',
      en: 'Multi-layer synthetic media that traps particles down to 15 microns, with an anti-drainback valve that keeps oil pressure ready on cold starts.',
      he: 'מדיה סינתטית רבת-שכבות הלוכדת חלקיקים עד 15 מיקרון, עם שסתום אל-חוזר לשמירת לחץ שמן בהתנעה קרה.',
    },
    specs: [
      { label: L.efficiency, value: '15 µm' },
      { label: L.diameter, value: '93 mm' },
      { label: L.warranty, value: L.months12 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['OM651', 'OM642', 'D4CB', '2.0 EcoBlue'],
  },
  {
    slug: 'heavy-duty-air-filter',
    wooId: 1009,
    sku: 'AF-FLT-AR21',
    category: 'filters',
    brand: 'Donaldson',
    price: 320,
    inStock: true,
    image: '/images/part-air-filter.png',
    alt: {
      ar: 'فلتر هواء أسطواني للشاحنات',
      en: 'Cylindrical truck air filter element',
      he: 'מסנן אוויר גלילי למשאיות',
    },
    name: {
      ar: 'فلتر هواء للشاحنات الثقيلة',
      en: 'Heavy-Duty Air Filter Element',
      he: 'מסנן אוויר לעבודה כבדה',
    },
    description: {
      ar: 'عنصر ترشيح هواء بمساحة سطح كبيرة للعمل في البيئات المتربة والمواقع الترابية، يحمي التوربو والمحرك من التآكل.',
      en: 'High surface-area element built for dusty sites and unpaved routes, protecting the turbo and cylinders from abrasive wear.',
      he: 'אלמנט בעל שטח פנים גדול לאזורים מאובקים ודרכי עפר, מגן על הטורבו והמנוע משחיקה.',
    },
    specs: [
      { label: L.efficiency, value: '99.9 % @ 5 µm' },
      { label: L.size, value: '320 × 145 mm' },
      { label: L.warranty, value: L.months12 },
      { label: L.origin, value: { ar: 'الولايات المتحدة', en: 'USA', he: 'ארה״ב' } },
    ],
    compatibility: ['Actros MP5', 'FH16', 'Daily 70C'],
  },
  {
    slug: 'front-shock-absorber',
    wooId: 1010,
    sku: 'AF-SUS-SA48',
    category: 'suspension',
    brand: 'Bilstein',
    price: 1180,
    inStock: true,
    image: '/images/part-shock-absorber.png',
    alt: {
      ar: 'مساعد أمامي بأسطوانة مفردة',
      en: 'Front monotube shock absorber',
      he: 'בולם זעזועים קדמי חד-צינורי',
    },
    name: {
      ar: 'مساعد أمامي بأسطوانة مفردة',
      en: 'Front Monotube Shock Absorber',
      he: 'בולם זעזועים קדמי חד-צינורי',
    },
    description: {
      ar: 'مساعد بتقنية الغاز أحادي الأنبوب يمنع تكوّن الرغوة في الزيت، فيحفظ ثبات المركبة حتى بعد ساعات طويلة على الطرق الوعرة.',
      en: 'Gas-pressurised monotube design that resists oil foaming, so damping stays consistent hour after hour on rough roads.',
      he: 'תכנון חד-צינורי בלחץ גז שמונע הקצפת שמן, כך שהריסון נשאר עקבי גם בדרכים משובשות.',
    },
    specs: [
      { label: L.travel, value: '185 mm' },
      { label: L.position, value: L.front },
      { label: L.warranty, value: L.months24 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['Sprinter 907', 'Land Cruiser 300', 'Hilux GUN126'],
  },
  {
    slug: 'alternator-24v-150a',
    wooId: 1011,
    sku: 'AF-ELC-AL24',
    category: 'electrical',
    brand: 'Bosch',
    price: 2650,
    inStock: false,
    image: '/images/part-alternator.png',
    alt: {
      ar: 'دينامو 24 فولت للمركبات التجارية',
      en: '24V alternator for commercial vehicles',
      he: 'אלטרנטור 24V לרכבים מסחריים',
    },
    name: {
      ar: 'دينامو 24 فولت / 150 أمبير',
      en: 'Alternator 24V / 150A',
      he: 'אלטרנטור 24V / 150A',
    },
    description: {
      ar: 'دينامو مبرد بالهواء لأحمال كهربائية عالية مثل التبريد والرفع الهيدروليكي، مع منظم جهد ذكي يحمي البطاريات.',
      en: 'Air-cooled alternator sized for high electrical loads such as refrigeration and hydraulic lifts, with a smart regulator that protects the batteries.',
      he: 'אלטרנטור מקורר אוויר לעומסים חשמליים גבוהים כמו קירור ומעליות הידרוליות, עם מווסת חכם המגן על המצברים.',
    },
    specs: [
      { label: L.voltage, value: '24 V' },
      { label: L.output, value: '150 A' },
      { label: L.weight, value: '8.1 kg' },
      { label: L.warranty, value: L.months24 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['Actros MP5', 'FH16', 'Daily 70C'],
  },
  {
    slug: 'clutch-kit-complete',
    wooId: 1012,
    sku: 'AF-TRN-CL39',
    category: 'transmission',
    brand: 'Sachs',
    price: 2890,
    inStock: true,
    image: '/images/part-clutch.png',
    alt: {
      ar: 'طقم دبرياج كامل مع قاعدة وقرص',
      en: 'Complete clutch kit with pressure plate and disc',
      he: 'ערכת מצמד מלאה עם צלחת לחיצה ודיסק',
    },
    name: {
      ar: 'طقم دبرياج كامل',
      en: 'Complete Clutch Kit',
      he: 'ערכת מצמד מלאה',
    },
    description: {
      ar: 'طقم كامل يشمل القاعدة والقرص ورمان بلي الفصل، بمعامل احتكاك ثابت يتحمل الانطلاق المتكرر بحمولة كاملة.',
      en: 'Complete kit with pressure plate, friction disc and release bearing — a stable friction coefficient that survives repeated fully-laden pull-aways.',
      he: 'ערכה מלאה הכוללת צלחת לחיצה, דיסק חיכוך ומסב שחרור — מקדם חיכוך יציב שעומד בזינוקים חוזרים בעומס מלא.',
    },
    specs: [
      { label: L.diameter, value: '430 mm' },
      { label: L.torque, value: '2 100 Nm' },
      { label: L.set, value: { ar: '3 قطع', en: '3-piece kit', he: 'ערכת 3 חלקים' } },
      { label: L.warranty, value: L.months12 },
      { label: L.origin, value: L.germany },
    ],
    compatibility: ['Actros MP4', 'FH13', 'Stralis AS440'],
  },
]

export function getPart(slug: string) {
  return parts.find((p) => p.slug === slug)
}

export function relatedParts(part: Part, limit = 3) {
  return parts
    .filter((p) => p.slug !== part.slug && p.category === part.category)
    .concat(parts.filter((p) => p.slug !== part.slug && p.category !== part.category))
    .slice(0, limit)
}
