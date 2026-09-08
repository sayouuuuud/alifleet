import 'server-only'

import { CATALOG_REVALIDATE, WP_CACHE_TAG } from './config'
import { sanitizeWordPressHtml } from './sanitize-html'
import type { Locale } from '@/lib/i18n/config'

export type PolicyType = 'privacy' | 'terms' | 'return'

export type PolicyPageData = {
  databaseId: number
  title: string
  slug: string
  uri: string
  content: string
  date?: string | null
  modified?: string | null
}

export type MultilingualPolicy = {
  ar: PolicyPageData | null
  en: PolicyPageData | null
  he: PolicyPageData | null
}

/**
 * Dedicated live WordPress GraphQL endpoint for policy pages.
 * By requirement R3, policy pages connect directly to the live endpoint
 * at https://a-f.site/graphql without reading fallback or local URLs from .env.
 */
export const WP_POLICY_GRAPHQL_ENDPOINT = 'https://a-f.site/graphql'

export const POLICY_SLUGS: Record<PolicyType, Record<Locale, string>> = {
  privacy: {
    ar: 'privacy-policy-ar',
    en: 'privacy-policy-en',
    he: 'privacy-policy-he',
  },
  terms: {
    ar: 'terms-ar',
    en: 'terms-en',
    he: 'terms-he',
  },
  return: {
    ar: 'return-policy-ar',
    en: 'return-policy-en',
    he: 'return-policy-he',
  },
}

export const SINGLE_POLICY_QUERY = /* GraphQL */ `
  query AliFleetSinglePolicy($id: ID!) {
    page(id: $id, idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
  }
`

export const PRIVACY_PAGES_QUERY = /* GraphQL */ `
  query AliFleetPrivacyPolicy {
    ar: page(id: "privacy-policy-ar", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
    en: page(id: "privacy-policy-en", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
    he: page(id: "privacy-policy-he", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
  }
`

export const TERMS_PAGES_QUERY = /* GraphQL */ `
  query AliFleetTermsPolicy {
    ar: page(id: "terms-ar", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
    en: page(id: "terms-en", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
    he: page(id: "terms-he", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
  }
`

export const RETURN_PAGES_QUERY = /* GraphQL */ `
  query AliFleetReturnPolicy {
    ar: page(id: "return-policy-ar", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
    en: page(id: "return-policy-en", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
    he: page(id: "return-policy-he", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
  }
`

export const REFUND_RETURNS_QUERY = /* GraphQL */ `
  query AliFleetRefundReturns {
    page(id: "refund_returns", idType: URI) {
      databaseId
      title
      slug
      uri
      date
      modified
      content
    }
  }
`

type WireMultiPage = {
  ar: PolicyPageData | null
  en: PolicyPageData | null
  he: PolicyPageData | null
}

const fallbackPrivacy: MultilingualPolicy = {
  ar: {
    databaseId: 849,
    title: 'سياسة الخصوصية',
    slug: 'privacy-policy-ar',
    uri: '/ar/privacy-policy-ar/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>سياسة الخصوصية لعلي فليت (AliFleet)</h2>
      <p>تلتزم شركة علي فليت بحماية خصوصية عملائها وزوار موقعها الإلكتروني. توضح هذه السياسة كيفية جمع البيانات واستخدامها وحمايتها عند استخدام خدماتنا لشراء قطع الغيار أو استيراد المركبات.</p>
      <h3>1. المعلومات التي نجمعها</h3>
      <p>نقوم بجمع المعلومات الشخصية مثل الاسم والبريد الإلكتروني ورقم الهاتف وعنوان التوصيل عند تسجيل حسابك أو تقديم طلب شراء أو التواصل مع فريقنا.</p>
      <h3>2. كيفية استخدام المعلومات</h3>
      <p>تُستخدم معلوماتك لمعالجة الطلبات، وتقديم خدمات التوصيل والشحن، وتحديث حالة طلباتك، والامتثال للأنظمة القانونية والجمركية.</p>
      <h3>3. حماية البيانات</h3>
      <p>نطبق معايير أمنية متقدمة وتشفيرًا للبيانات لضمان حماية معلوماتك الشخصية من الوصول غير المصرح به.</p>
    `,
  },
  en: {
    databaseId: 853,
    title: 'Privacy Policy',
    slug: 'privacy-policy-en',
    uri: '/en/privacy-policy-en/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>Privacy Policy for AliFleet</h2>
      <p>ALI FLEET is committed to protecting the privacy of our customers and visitors. This policy outlines how we collect, use, and safeguard personal data when you use our services for spare parts or vehicle imports.</p>
      <h3>1. Information We Collect</h3>
      <p>We collect personal details such as your name, email address, phone number, and delivery addresses when you create an account, place an order, or reach out to our team.</p>
      <h3>2. How We Use Information</h3>
      <p>Your data is used to process orders, arrange shipping and delivery, provide customer support, and meet legal and customs compliance obligations.</p>
      <h3>3. Data Protection</h3>
      <p>We apply high security standards, secure servers, and encryption protocols to protect your sensitive personal and transactional details.</p>
    `,
  },
  he: {
    databaseId: 848,
    title: 'מדיניות הפרטיות',
    slug: 'privacy-policy-he',
    uri: '/privacy-policy-he/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>מדיניות פרטיות לעלי פליט (AliFleet)</h2>
      <p>חברת עלי פליט מחויבת להגנה על פרטיות לקוחותיה ומבקרי האתר. מסמך זה מפרט כיצד אנו אוספים, משתמשים ומאבטחים מידע בעת רכישת חלקי חילוף או ייבוא רכבים.</p>
      <h3>1. מידע שאנו אוספים</h3>
      <p>אנו אוספים פרטים אישיים כגון שם, כתובת אימייל, מספר טלפון וכתובות משלוח בעת פתיחת חשבון, ביצוע הזמנה או פנייה לשירות הלקוחות.</p>
      <h3>2. השימוש במידע</h3>
      <p>המידע משמש לניהול וביצוע הזמנות, תיאום לוגיסטיקה ושילוח, עדכוני סטטוס ועמידה בדרישות החוק והמכס.</p>
      <h3>3. אבטחת מידע</h3>
      <p>אנו מיישמים אמצעי אבטחה מתקדמים והצפנת מידע כדי להבטיח הגנה מרבית על הנתונים האישיים של לקוחותינו.</p>
    `,
  },
}

const fallbackTerms: MultilingualPolicy = {
  ar: {
    databaseId: 858,
    title: 'شروط الاستخدام',
    slug: 'terms-ar',
    uri: '/terms-ar/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>الشروط والأحكام العامة — علي فليت</h2>
      <p>أهلاً بكم في علي فليت. تحدد هذه الشروط والأحكام القواعد واللوائح الخاصة باستخدام موقعنا الإلكتروني وخدماتنا المخصصة لشراء قطع الغيار واستيراد المركبات والشاحنات.</p>
      <h3>1. نطاق الخدمات</h3>
      <p>توفر علي فليت خدمات توريد واستيراد ا��مركبات التجارية وقطع الغيار الأصلية. جميع المعاملات تخضع للقوانين المعمول بها والاتفاقيات المبرمة مع العميل.</p>
      <h3>2. الأسعار والدفع</h3>
      <p>الأسعار المعروضة تشمل التفاصيل الموضحة في كل عرض. يتم تأكيد الطلبات فور إتمام الدفع أو استلام العربون المتفق عليه.</p>
    `,
  },
  en: {
    databaseId: 861,
    title: 'Terms & Conditions',
    slug: 'terms-en',
    uri: '/terms-en/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>General Terms & Conditions — AliFleet</h2>
      <p>Welcome to ALI FLEET. These terms and conditions outline the rules and regulations for the use of our website and services for spare parts procurement and commercial vehicle importation.</p>
      <h3>1. Scope of Services</h3>
      <p>ALI FLEET supplies commercial vehicles, trucks, and aftermarket truck spare parts across Israel. All transactions comply with applicable commercial regulations.</p>
      <h3>2. Pricing & Payments</h3>
      <p>All prices displayed are subject to confirmation upon order placement. Invoices and payment milestones must be settled in accordance with sales agreements.</p>
    `,
  },
  he: {
    databaseId: 856,
    title: 'תנאים והגבלות',
    slug: 'terms-he',
    uri: '/terms-he/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>תנאים והגבלות כלליים — עלי פליט</h2>
      <p>ברוכים הבאים לעלי פליט. תנאים אלו מסדירים את השימוש באתר ובשירותי רכישת חלקי חילוף וייבוא כלי רכב ומשאיות.</p>
      <h3>1. היקף השירות</h3>
      <p>עלי פליט מספקת שירותי ייבוא ושיווק של משאיות, רכבים מסחריים וחלקי חילוף מקוריים בהתאם להסכמים מול הלקוח.</p>
      <h3>2. מחירים ותשלומים</h3>
      <p>המחירים המפורטים כפופים לאישור בעת ביצוע ההזמנה. תנאי התשלום נקבעים בהתאם להסכם ההתקשרות.</p>
    `,
  },
}

const fallbackReturn: MultilingualPolicy = {
  ar: {
    databaseId: 1030,
    title: 'سياسة الإرجاع والاستبدال',
    slug: 'return-policy-ar',
    uri: '/return-policy-ar/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>سياسة الإرجاع والاستبدال — علي فليت</h2>
      <p>نحرص في علي فليت على رضا عملائنا وتقديم أفضل تجربة شراء لقطع الغيار والمعدات. توضح هذه السياسة شروط وإجراءات إرجاع المنتجات أو استبدالها.</p>
      <h3>1. شروط الإرجاع</h3>
      <p>يمكن إرجاع قطع الغيار غير المستخدمة وفي عبوتها الأصلية خلال 14 يومًا من تاريخ الاستلام مع إرفاق فاتورة الشراء الأصلية.</p>
      <h3>2. القطع المستثناة</h3>
      <p>لا تشمل سياسة الإرجاع القطع الكهربائية التي تم تركيبها أو المنتجات المصنعة أو المطلوبة بمواصفات خاصة بناءً على طلب العميل.</p>
    `,
  },
  en: {
    databaseId: 1033,
    title: 'Return and exchange policy',
    slug: 'return-policy-en',
    uri: '/return-policy-en/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>Return and Exchange Policy — AliFleet</h2>
      <p>At ALI FLEET, we prioritize customer satisfaction. This policy details the terms, eligibility, and process for returns and exchanges of spare parts and equipment.</p>
      <h3>1. Eligibility for Returns</h3>
      <p>Unused spare parts in their original packaging may be returned within 14 days of receipt, accompanied by the original receipt or proof of purchase.</p>
      <h3>2. Non-returnable Items</h3>
      <p>Electrical components that have been installed and custom-ordered or specially imported parts are non-refundable.</p>
    `,
  },
  he: {
    databaseId: 1029,
    title: 'מדיניות החזרה והחלפה',
    slug: 'return-policy-he',
    uri: '/return-policy-he/',
    modified: '2026-01-01T00:00:00',
    content: `
      <h2>מדיניות החזרה והחלפה — עלי פליט</h2>
      <p>בעלי פליט אנו מקפידים על שביעות רצון לקוחותינו. מסמך זה מפרט את הנהלים והתנאים להחזרת מוצרים וחלקי חילוף.</p>
      <h3>1. תנאי החזרה</h3>
      <p>ניתן להחזיר חלקי חילוף שלא נעשה בהם שימוש ובאריזתם המקורית תוך 14 יום מקבלת המשלוח, בצירוף חשבונית מקורית.</p>
      <h3>2. פריטים שאינם ניתנים להחזרה</h3>
      <p>רכיבים חשמליים שהותקנו או מוצרים שהוזמנו בהתאמה אישית אינם ניתנים להחזרה או להחלפה.</p>
    `,
  },
}

/**
 * Executes a GraphQL query against the live WordPress endpoint (https://a-f.site/graphql).
 * Does not use fallback or local URLs from .env.
 */
export async function fetchLivePolicyGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(WP_POLICY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: CATALOG_REVALIDATE, tags: [WP_CACHE_TAG] },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`Policy GraphQL request failed with HTTP ${response.status}`)
  }

  const payload = await response.json()
  if (payload.errors?.length) {
    const messages = payload.errors.map((e: { message: string }) => e.message).join(', ')
    throw new Error(`Policy GraphQL returned errors: ${messages}`)
  }

  if (!payload.data) {
    throw new Error('Policy GraphQL response contained no data')
  }

  return sanitizePolicyPayload(payload.data) as T
}

function sanitizePolicyPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizePolicyPayload)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      key === 'content' && typeof nestedValue === 'string'
        ? sanitizeWordPressHtml(nestedValue)
        : sanitizePolicyPayload(nestedValue),
    ])
  )
}

/**
 * Fetches a single policy page dynamically based on active language and policy type
 * from the live WordPress GraphQL endpoint.
 */
export async function getPolicyByLocale(
  policyType: PolicyType,
  locale: Locale
): Promise<PolicyPageData | null> {
  const slug = POLICY_SLUGS[policyType]?.[locale]
  if (!slug) return null

  try {
    const data = await fetchLivePolicyGraphQL<{ page: PolicyPageData | null }>(
      SINGLE_POLICY_QUERY,
      { id: slug }
    )
    return data.page ?? null
  } catch (error) {
    console.warn(
      `[AliFleet] Failed to dynamically fetch ${policyType} (${locale}) from live WordPress GraphQL:`,
      error
    )
    if (policyType === 'privacy') return fallbackPrivacy[locale]
    if (policyType === 'terms') return fallbackTerms[locale]
    if (policyType === 'return') return fallbackReturn[locale]
    return null
  }
}

/**
 * Reads all 3 language versions of the Privacy Policy from live WordPress GraphQL.
 * If active locale is specified, dynamically ensures that language is populated.
 */
export async function getPrivacyPolicy(locale?: Locale): Promise<MultilingualPolicy> {
  try {
    const data = await fetchLivePolicyGraphQL<WireMultiPage>(PRIVACY_PAGES_QUERY)

    let dynamicCurrent: PolicyPageData | null = null
    if (locale && (!data[locale] || !data[locale]?.content)) {
      dynamicCurrent = await getPolicyByLocale('privacy', locale)
    }

    return {
      ar: (locale === 'ar' && dynamicCurrent) ? dynamicCurrent : (data.ar ?? fallbackPrivacy.ar),
      en: (locale === 'en' && dynamicCurrent) ? dynamicCurrent : (data.en ?? fallbackPrivacy.en),
      he: (locale === 'he' && dynamicCurrent) ? dynamicCurrent : (data.he ?? fallbackPrivacy.he),
    }
  } catch (error) {
    console.warn('[AliFleet] Failed to fetch privacy policy from live WordPress GraphQL, using fallback:', error)
    if (locale) {
      const dynamicSingle = await getPolicyByLocale('privacy', locale)
      if (dynamicSingle) {
        return {
          ar: locale === 'ar' ? dynamicSingle : fallbackPrivacy.ar,
          en: locale === 'en' ? dynamicSingle : fallbackPrivacy.en,
          he: locale === 'he' ? dynamicSingle : fallbackPrivacy.he,
        }
      }
    }
    return fallbackPrivacy
  }
}

/**
 * Reads all 3 language versions of the Terms & Conditions from live WordPress GraphQL.
 * If active locale is specified, dynamically ensures that language is populated.
 */
export async function getTermsPolicy(locale?: Locale): Promise<MultilingualPolicy> {
  try {
    const data = await fetchLivePolicyGraphQL<WireMultiPage>(TERMS_PAGES_QUERY)

    let dynamicCurrent: PolicyPageData | null = null
    if (locale && (!data[locale] || !data[locale]?.content)) {
      dynamicCurrent = await getPolicyByLocale('terms', locale)
    }

    return {
      ar: (locale === 'ar' && dynamicCurrent) ? dynamicCurrent : (data.ar ?? fallbackTerms.ar),
      en: (locale === 'en' && dynamicCurrent) ? dynamicCurrent : (data.en ?? fallbackTerms.en),
      he: (locale === 'he' && dynamicCurrent) ? dynamicCurrent : (data.he ?? fallbackTerms.he),
    }
  } catch (error) {
    console.warn('[AliFleet] Failed to fetch terms policy from live WordPress GraphQL, using fallback:', error)
    if (locale) {
      const dynamicSingle = await getPolicyByLocale('terms', locale)
      if (dynamicSingle) {
        return {
          ar: locale === 'ar' ? dynamicSingle : fallbackTerms.ar,
          en: locale === 'en' ? dynamicSingle : fallbackTerms.en,
          he: locale === 'he' ? dynamicSingle : fallbackTerms.he,
        }
      }
    }
    return fallbackTerms
  }
}

/**
 * Reads all 3 language versions of the Return Policy from live WordPress GraphQL.
 * If active locale is specified, dynamically ensures that language is populated.
 */
export async function getReturnPolicy(locale?: Locale): Promise<MultilingualPolicy> {
  try {
    const data = await fetchLivePolicyGraphQL<WireMultiPage>(RETURN_PAGES_QUERY)

    let dynamicCurrent: PolicyPageData | null = null
    if (locale && (!data[locale] || !data[locale]?.content)) {
      dynamicCurrent = await getPolicyByLocale('return', locale)
    }

    const fallbackHe = data.he ?? (await getRefundReturnsPage()) ?? fallbackReturn.he

    return {
      ar: (locale === 'ar' && dynamicCurrent) ? dynamicCurrent : (data.ar ?? fallbackReturn.ar),
      en: (locale === 'en' && dynamicCurrent) ? dynamicCurrent : (data.en ?? fallbackReturn.en),
      he: (locale === 'he' && dynamicCurrent) ? dynamicCurrent : fallbackHe,
    }
  } catch (error) {
    console.warn('[AliFleet] Failed to fetch return policy from live WordPress GraphQL, using fallback:', error)
    if (locale) {
      const dynamicSingle = await getPolicyByLocale('return', locale)
      if (dynamicSingle) {
        return {
          ar: locale === 'ar' ? dynamicSingle : fallbackReturn.ar,
          en: locale === 'en' ? dynamicSingle : fallbackReturn.en,
          he: locale === 'he' ? dynamicSingle : fallbackReturn.he,
        }
      }
    }
    return fallbackReturn
  }
}

/**
 * Reads the WooCommerce default refund & returns page from live WordPress GraphQL.
 */
export async function getRefundReturnsPage(): Promise<PolicyPageData | null> {
  try {
    const data = await fetchLivePolicyGraphQL<{ page: PolicyPageData | null }>(
      REFUND_RETURNS_QUERY
    )
    return data.page ?? null
  } catch (error) {
    console.warn('[AliFleet] Failed to fetch refund_returns from live WordPress GraphQL:', error)
    return null
  }
}
