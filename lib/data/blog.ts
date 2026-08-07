export type BlogCategory = 'news' | 'import' | 'fleet' | 'parts' | 'tips'
export const blogCategories: BlogCategory[] = ['news', 'import', 'fleet', 'parts', 'tips']

export interface BlogPost {
  slug: string
  titleEn: string
  titleAr: string
  titleHe: string
  excerptEn: string
  excerptAr: string
  excerptHe: string
  category: BlogCategory
  coverImage: string
  authorName: string
  authorAvatar: string
  publishedAt: string // ISO date string
  readingMinutes: number
  featured?: boolean
  /** Full HTML body — populated on the detail page only, not in listing queries. */
  content?: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'top-heavy-trucks-2026',
    titleEn: 'Top Heavy-Duty Trucks to Watch in 2026',
    titleAr: 'أبرز الشاحنات الثقيلة لعام 2026',
    titleHe: 'המשאיות הכבדות המובילות לצפייה ב-2026',
    excerptEn:
      'From next-generation Mercedes-Benz Actros to the all-electric Volvo FH, we break down the commercial trucks reshaping global logistics this year.',
    excerptAr:
      'من مرسيدس-بنز أكتروس الجيل الجديد إلى فولفو FH الكهربائي بالكامل، نستعرض الشاحنات التجارية التي تُعيد تشكيل اللوجستيات العالمية هذا العام.',
    excerptHe:
      'ממרצדס-בנץ אקטרוס הדור הבא ועד לוולוו FH החשמלי, אנו סוקרים את המשאיות המסחריות שמעצבות מחדש את הלוגיסטיקה העולמית השנה.',
    category: 'fleet',
    coverImage: '/images/fleet-truck.png',
    authorName: 'ALI FLEET Team',
    authorAvatar: '/images/hero-avatars.png',
    publishedAt: '2026-07-15',
    readingMinutes: 6,
    featured: true,
  },
  {
    slug: 'importing-from-germany-guide',
    titleEn: 'Complete Guide: Importing Vehicles from Germany',
    titleAr: 'الدليل الكامل: استيراد السيارات من ألمانيا',
    titleHe: 'מדריך מלא: ייבוא רכבים מגרמניה',
    excerptEn:
      'Everything you need to know about sourcing, inspecting, and clearing a German vehicle — from export plates to destination port paperwork.',
    excerptAr:
      'كل ما تحتاج معرفته حول البحث والفحص والتخليص الجمركي لمركبة ألمانية — من لوحات التصدير إلى أوراق ميناء الوصول.',
    excerptHe:
      'כל מה שצריך לדעת על איתור, בדיקה ושחרור רכב גרמני — מלוחיות יצוא ועד תיעוד נמל היעד.',
    category: 'import',
    coverImage: '/images/import-luxury-suv.png',
    authorName: 'ALI FLEET Team',
    authorAvatar: '/images/hero-avatars.png',
    publishedAt: '2026-07-02',
    readingMinutes: 9,
  },
  {
    slug: 'genuine-vs-oem-spare-parts',
    titleEn: 'Genuine vs OEM Spare Parts: What You Need to Know',
    titleAr: 'قطع الغيار الأصلية مقابل OEM: ما تحتاج معرفته',
    titleHe: 'חלפים מקוריים לעומת OEM: מה שחשוב לדעת',
    excerptEn:
      'Understanding the real difference between manufacturer-original and OEM-grade parts helps you make smarter purchasing decisions for your fleet.',
    excerptAr:
      'فهم الفرق الحقيقي بين قطع الغيار الأصلية من الشركة المصنعة وقطع OEM يساعدك على اتخاذ قرارات شراء أذكى لأسطولك.',
    excerptHe:
      'הבנת ההבדל האמיתי בין חלפים מקוריים מהיצרן לחלפי OEM עוזרת לכם לקבל החלטות רכישה חכמות יותר לצי שלכם.',
    category: 'parts',
    coverImage: '/images/spare-parts.png',
    authorName: 'ALI FLEET Team',
    authorAvatar: '/images/hero-avatars.png',
    publishedAt: '2026-06-18',
    readingMinutes: 5,
  },
  {
    slug: 'fleet-management-tips-2026',
    titleEn: '7 Fleet Management Tips That Cut Costs in 2026',
    titleAr: '7 نصائح لإدارة الأسطول تخفض التكاليف في 2026',
    titleHe: '7 טיפים לניהול צי שמפחיתים עלויות ב-2026',
    excerptEn:
      'From predictive maintenance schedules to route optimisation, these seven strategies are helping fleet owners reduce downtime and running costs this year.',
    excerptAr:
      'من جداول الصيانة التنبؤية إلى تحسين المسارات، هذه الاستراتيجيات السبع تساعد أصحاب الأساطيل على تقليل وقت التوقف وتكاليف التشغيل هذا العام.',
    excerptHe:
      'מלוחות תחזוקה חזויה ועד אופטימיזציית מסלולים, שבע האסטרטגיות הללו עוזרות לבעלי צי להפחית זמן השבתה ועלויות תפעול השנה.',
    category: 'tips',
    coverImage: '/images/fleet-van.png',
    authorName: 'ALI FLEET Team',
    authorAvatar: '/images/hero-avatars.png',
    publishedAt: '2026-06-05',
    readingMinutes: 7,
  },
  {
    slug: 'alifleet-expands-to-gulf-markets',
    titleEn: 'ALI FLEET Expands Import Operations to Gulf Markets',
    titleAr: 'علي فليت تُوسّع عمليات الاستيراد إلى أسواق الخليج',
    titleHe: 'ALI FLEET מרחיבה פעילות ייבוא לשווקי המפרץ',
    excerptEn:
      'We are thrilled to announce our expanded sourcing network across the UAE, Saudi Arabia, and Kuwait — bringing more inventory options to our clients.',
    excerptAr:
      'يسعدنا الإعلان عن توسيع شبكة الحصول على المركبات عبر الإمارات والسعودية والكويت، مما يوفر المزيد من الخيارات لعملائنا.',
    excerptHe:
      'אנו שמחים להכריז על הרחבת רשת האיתור שלנו ברחבי האמירויות, ערב הסעודית וכווית — מה שמביא יותר אפשרויות מלאי ללקוחותינו.',
    category: 'news',
    coverImage: '/images/import-global.png',
    authorName: 'ALI FLEET Team',
    authorAvatar: '/images/hero-avatars.png',
    publishedAt: '2026-05-20',
    readingMinutes: 4,
  },
  {
    slug: 'executive-van-buyer-guide',
    titleEn: 'Executive Van Buyer\'s Guide: Mercedes vs Ford vs Volkswagen',
    titleAr: 'دليل المشتري للفانات التنفيذية: مرسيدس مقابل فورد مقابل فولكسفاغن',
    titleHe: 'מדריך קונה לואנים ניהוליים: מרצדס מול פורד מול פולקסווגן',
    excerptEn:
      'An in-depth comparison of the three most popular executive van platforms to help you choose the right model for your VIP transport or logistics operation.',
    excerptAr:
      'مقارنة معمّقة بين أكثر ثلاثة منصات فانات تنفيذية شيوعًا لمساعدتك في اختيار الطراز المناسب لنقل الشخصيات المهمة أو عملياتك اللوجستية.',
    excerptHe:
      'השוואה מעמיקה בין שלוש פלטפורמות הואן הניהוליות הפופולריות ביותר כדי לעזור לכם לבחור את הדגם המתאים להסעות VIP או ללוגיסטיקה שלכם.',
    category: 'fleet',
    coverImage: '/images/fleet-van.png',
    authorName: 'ALI FLEET Team',
    authorAvatar: '/images/hero-avatars.png',
    publishedAt: '2026-05-08',
    readingMinutes: 8,
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function getBlogPostsByCategory(category: BlogCategory): BlogPost[] {
  return blogPosts.filter((p) => p.category === category)
}

export function getFeaturedPost(): BlogPost | undefined {
  return blogPosts.find((p) => p.featured)
}
