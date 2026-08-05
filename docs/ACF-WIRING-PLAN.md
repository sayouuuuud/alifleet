# خطة ربط الكود بـ ACF — تُنفَّذ **بعد** ما الوردبريس يبقى شغال

> الملف ده مش دليل تنصيب. الدليل هو `docs/WORDPRESS-SETUP.md`.
> ده **خطة الشغل الجوّة الكود** اللي هننفّذها لما ترجع تقولّي "الوردبريس شغال والـ GraphQL بيرجّع داتا".
>
> **شرط البدء:** كل اختبارات القسم 13 في `WORDPRESS-SETUP.md` تنجح — يعني الكويريات بترجّع داتا فعلية مش `null`.

---

## 0) القاعدة الذهبية للخطة كلها

> **الموقع لازم ميقعش ولا مرة واحدة أثناء الربط.**

كل حقل هيتربط بالشكل ده:

```
قيمة من ACF موجودة؟  →  استخدمها
قيمة من ACF فاضية/null؟  →  ارجع لقيمة الكود الحالية (lib/data أو dictionaries)
الوردبريس واقع تمامًا؟  →  الموقع يشتغل بالكامل من الكود الحالي
```

معنى ده إن `lib/data/*.ts` و `lib/i18n/dictionaries/*.ts` **مش هنحذفهم** — هيتحوّلوا من "مصدر المحتوى" إلى **"طبقة fallback"**. ده مش تكرار زايد، ده شبكة أمان: أول 3 شهور بعد الربط هي أخطر فترة (حقل ناقص، صورة مش مرفوعة، حد غيّر حاجة في لوحة التحكم بالغلط).

---

## 1) ترتيب المراحل — من الأقل خطرًا للأكتر

الترتيب مقصود: كل مرحلة بتختبر جزء من الأنبوبة قبل ما نعتمد عليه في المرحلة اللي بعدها.

| # | المرحلة | ليه في الترتيب ده | مدى الخطر |
|---|---|---|---|
| 1 | **إعدادات الموقع** (`siteOptions`) | أصغر حجم داتا، وأسهل تحقق: لو الفوتر عرض التليفون من ACF يبقى الأنبوبة كلها شغالة (اتصال + auth + ACF + GraphQL) | منخفض |
| 2 | **صفحات المحتوى الثابتة** (Home / Import / Products / Blog / Cart / Contact) | 6 groups، كلها قراءة فقط، مفيش منطق تجاري | منخفض |
| 3 | **CPT عربيات الاستيراد** (`import_car`) | قوائم + صفحات تفصيل + فلترة + `generateStaticParams` | متوسط |
| 4 | **المدونة** (`post`) | نفس تعقيد الاستيراد + تصنيفات | متوسط |
| 5 | **قطع الغيار / WooCommerce** (`product`) | **أخطر مرحلة** — أسعار ومخزون وكارت. غلطة هنا = فلوس | عالي |

**قاعدة:** كل مرحلة تخلص وتتأكد وتشتغل يوم كامل على الأقل قبل بداية اللي بعدها. متعملش 2 و 3 في نفس الـ deploy.

---

## 2) شكل طبقة البيانات الجديدة

### 2.1 الملفات اللي هتتولد

```
lib/wp/
├── client.ts          موجود — بس محتاج تعديل (شوف 2.2)
├── config.ts          موجود — بس محتاج تعديل (شوف 2.2)
├── errors.ts          موجود — زي ما هو
├── operations.ts      موجود (auth) — زي ما هو
├── types.ts           موجود (auth) — زي ما هو
│
├── content.ts         ← جديد: نقطة الدخول الوحيدة لكل محتوى ACF
├── queries/           ← جديد: كويري لكل صفحة/نوع
│   ├── site-options.ts
│   ├── pages.ts
│   ├── import-cars.ts
│   ├── blog.ts
│   └── products.ts
├── map/               ← جديد: تحويل شكل ACF → شكل الكود الحالي
│   ├── localize.ts
│   ├── site-options.ts
│   ├── import-car.ts
│   ├── blog-post.ts
│   └── part.ts
└── fallback.ts        ← جديد: منطق "لو فاضي ارجع للكود"
```

### 2.2 التعديل المطلوب على `client.ts` و `config.ts` — **مهم**

`wpFetch` الحالي فيه سطر بيمنع الكاش تمامًا:

```ts
// lib/wp/client.ts — السلوك الحالي
cache: 'no-store',
```

ده **صح 100% للـ auth** (بيانات كل مستخدم لوحده)، بس **كارثة للمحتوى**: كل زيارة لصفحة الهوم = طلب GraphQL جديد على السيرفر. الموقع هيبقى بطيء والـ VPS هياكل CPU على الفاضي.

**التعديل:** `wpFetch` تقبل وضعين واضحين:

```ts
export type WpCacheMode =
  | { kind: 'private' }                    // auth — no-store، زي الحالي بالظبط
  | { kind: 'content'; revalidate: number; tags: string[] }

// private  → cache: 'no-store'
// content  → next: { revalidate, tags }
```

**قاعدة صارمة:** أي طلب فيه `authToken` لازم يكون `private`. لو حد كتب طلب فيه توكن و`content` هيكون تسريب بيانات مستخدم لمستخدم تاني — ده هيتحوّل لـ runtime error مقصود جوه `wpFetch` مش مجرد تعليق.

كذلك `config.ts` محتاج متغير جديد للـ endpoint العام (نفس القيمة، بس التوثيق بيفرّق):

```
WORDPRESS_GRAPHQL_ENDPOINT      # موجود — للاتنين
WP_CONTENT_REVALIDATE_SECONDS   # جديد — افتراضي 300
WP_REVALIDATE_SECRET            # جديد — للـ webhook (القسم 5)
```

### 2.3 `content.ts` — نقطة الدخول الوحيدة

كل صفحة بتنادي دالة واحدة بس، ومش شايفة GraphQL ولا ACF خالص:

```ts
// lib/wp/content.ts
export async function getSiteOptions(): Promise<SiteOptions>
export async function getHomeContent(): Promise<HomeContent>
export async function getImportPageContent(): Promise<ImportPageContent>
export async function getProductsPageContent(): Promise<ProductsPageContent>
export async function getBlogPageContent(): Promise<BlogPageContent>
export async function getCartPageContent(): Promise<CartPageContent>
export async function getContactPageContent(): Promise<ContactPageContent>

export async function getImportCars(): Promise<ImportCar[]>
export async function getImportCar(slug: string): Promise<ImportCar | null>

export async function getBlogPosts(): Promise<BlogPost[]>
export async function getBlogPost(slug: string): Promise<BlogPost | null>

export async function getParts(): Promise<Part[]>
export async function getPart(slug: string): Promise<Part | null>
```

**نقطة التصميم الأهم:** الأنواع المرجّعة (`ImportCar`, `Part`, `BlogPost`) هي **نفس الأنواع الموجودة حاليًا** في `lib/data/*.ts` — مش أنواع جديدة.

ليه؟ لأن كده كل صفحة وكل كمبوننت **مش محتاج يتغير أكتر من سطر واحد**:

```diff
- import { importCars } from '@/lib/data/import-cars'
+ import { getImportCars } from '@/lib/wp/content'
+ const importCars = await getImportCars()
```

يعني `components/import-car-card.tsx` و `import-browser.tsx` و `import-car-detail.tsx` — **مش بيتغيروا خالص**. ده اللي يخلي المرحلة رخيصة وقابلة للرجوع.

### 2.4 `localize.ts` — الترجمة العكسية

ACF بيرجّع `subtitle_ar`, `subtitle_en`, `subtitle_he` كـ 3 حقول مسطّحة. الكود عايز `Localized` واحد:

```ts
// lib/wp/map/localize.ts
// { car_subtitle_ar, car_subtitle_en, car_subtitle_he } → { ar, en, he }
export function loc(
  source: Record<string, unknown>,
  base: string,
  fallback: Localized
): Localized
```

قواعدها:
- أي لغة فاضية في ACF → تاخد قيمة `fallback` بتاعتها (مش تاخد الإنجليزي، عشان ميظهرش إنجليزي فجأة في نص عربي)
- الـ 3 لغات فاضيين → ترجّع `fallback` كامل
- بترجّع دايمًا الـ 3 لغات كاملة، فمفيش صفحة هتعرض نص فاضي

نفس الفكرة لـ `plain()` للحقول المحيّدة (`car_model`, `sku`, `brand`, `engine`, `drivetrain`).

---

## 3) الكويريات — واحد لكل مرحلة

### 3.1 المرحلة 1 — إعدادات الموقع

```graphql
query SiteOptions {
  siteOptions {
    siteOptionsFields {
      companyInfo {
        companyNameAr companyNameEn companyNameHe
        phoneNumber phoneHref whatsappNumber emailAddress
        workingHours
        addressLines { lineAr lineEn lineHe }
      }
      socialLinks { instagram facebook linkedin }
      commerceSettings { currencySymbol storeBaseUrl cartPath }
      footerContent {
        taglineAr taglineEn taglineHe
        sloganAr sloganEn sloganHe
      }
    }
  }
}
```

**المستهلكين:** `lib/site-config.ts`، `components/site-footer.tsx`، `components/site-header.tsx`، `components/contact-details.tsx`، `lib/site-config.ts → whatsappLink()` و `wordpressCheckoutUrl()`.

**تعقيد مخفي هنا لازم أقوله:** `siteConfig` حاليًا `export const` — كائن ثابت بيتستورد في **كمبوننتس client** (زي `add-to-cart-button.tsx`). و `getSiteOptions()` دالة **async server-only**. مينفعش تستورد التانية جوه client component.

الحل: `siteConfig` تتحوّل من `const` لـ **React Context** يتغذّى من `app/layout.tsx` (اللي هو server component بيقدر ينادي `getSiteOptions()`)، بنفس أسلوب `lib/i18n/language-context.tsx` الموجود بالفعل. ده تعديل حقيقي في ~8 ملفات — مش سطر واحد. مقصود أنبّهك عليه من دلوقتي.

### 3.2 المرحلة 2 — صفحات المحتوى

مثال الهوم (الأكبر — 8 أقسام):

```graphql
query HomeContent {
  page(id: "/", idType: URI) {
    homePageFields {
      heroSection {
        heroLine1Ar heroLine1En heroLine1He
        heroLine2Ar heroLine2En heroLine2He
        heroLine3Ar heroLine3En heroLine3He
        heroLine4Ar heroLine4En heroLine4He
        heroAvatarImage { node { sourceUrl altText } }
        heroAvatarAltAr heroAvatarAltEn heroAvatarAltHe
        heroDescriptionAr heroDescriptionEn heroDescriptionHe
        heroSlides {
          slideImage { node { sourceUrl } }
          slideLabelAr slideLabelEn slideLabelHe
          slideAltAr   slideAltEn   slideAltHe
        }
      }
      statsSection {
        statsEyebrowAr statsEyebrowEn statsEyebrowHe
        statsItems {
          statValue
          statSuffixAr statSuffixEn statSuffixHe
          statLabelAr  statLabelEn  statLabelHe
        }
      }
      fleetShowcaseSection { ... }
      marqueeItems { itemTextAr itemTextEn itemTextHe }
      globalReachSection { ... }
      servicesSection { scene01 { ... } scene02 { ... } scene03 { ... } }
      ctaSection { ... }
    }
  }
}
```

الباقي بنفس النمط:

| الصفحة | الكويري | الـ ACF group |
|---|---|---|
| `app/page.tsx` | `page(id: "/", idType: URI)` | `homePageFields` |
| `app/import/page.tsx` | `page(id: "import", idType: URI)` | `importPageFields` |
| `app/products/page.tsx` | `page(id: "products", idType: URI)` | `sparePartsPageFields` |
| `app/blog/page.tsx` | `page(id: "blog", idType: URI)` | `blogPageFields` |
| `app/cart/page.tsx` | `page(id: "cart", idType: URI)` | `cartPageFields` |
| `app/contact/page.tsx` | `page(id: "contact", idType: URI)` | `contactPageFields` |

> **ملاحظة على الهوم:** `group_home_page` شرطه `page_type == front_page` مش `page_slug`. يعني الكويري لازم يكون `id: "/"` مش `id: "home"` — والصفحة لازم تكون متظبّطة كـ front page في **Settings → Reading** (خطوة موجودة في الدليل، القسم 7).

### 3.3 المرحلة 3 — عربيات الاستيراد

```graphql
query ImportCars($first: Int = 100) {
  importCars(first: $first, where: { status: PUBLISH }) {
    nodes {
      slug
      importCarFields {
        carModel
        carSubtitleAr carSubtitleEn carSubtitleHe
        bodyType origin status stage
        year mileage price featured
        featuredImage { node { sourceUrl altText } }
        gallery { image { node { sourceUrl } } altTextAr altTextEn altTextHe }
        descriptionAr descriptionEn descriptionHe
        highlights { itemAr itemEn itemHe }
        specs {
          engine transmission fuel drivetrain
          colorAr colorEn colorHe
          seats
        }
        etaAr etaEn etaHe
      }
    }
  }
}
```

**نقطتين لازم يتحلّوا في الـ mapper:**

1. **`bodyType` في ACF هو `select`** بيرجّع مفتاح (`van`, `truck`…)، لكن `ImportCar.bodyType` في الكود من نوع `Localized` (`{ar:'فان', en:'Van', he:'ואן'}`). فالـ mapper بياخد المفتاح ويترجمه من جدول ثابت في الكود. **ده أحسن من الوضع القديم** — مصطلح "فان" يتترجم مرة واحدة مش كل عربية.
   نفس الكلام على `transmission` و `fuel`.

2. **`stage` و `status`** لازم يتحققوا: `stage` رقم من 1 لـ 4 و `status` من قايمة مقفولة. لو حد كتب 7 في لوحة التحكم، الكارت بيتكسر. فالـ mapper بيعمل `clamp` + validation ويرجّع للـ fallback لو القيمة غلط.

### 3.4 المرحلة 4 — المدونة

```graphql
query BlogPosts($first: Int = 50) {
  posts(first: $first, where: { status: PUBLISH }) {
    nodes {
      slug
      date
      featuredImage { node { sourceUrl altText } }
      blogPostFields {
        postTitleAr postTitleEn postTitleHe
        postExcerptAr postExcerptEn postExcerptHe
        readingMinutes
        authorName
        authorAvatar { node { sourceUrl } }
        featuredPost
        blogCategory
      }
    }
  }
}
```

> `BlogPost` في الكود شكله مسطّح (`titleEn`, `titleAr`, `titleHe`) مش `Localized`. الـ mapper بيحافظ على الشكل المسطّح ده زي ما هو — **متغيّرش نوع `BlogPost`**، وإلا `blog-card.tsx` و `blog-article.tsx` و `blog-browser.tsx` كلهم هيحتاجوا تعديل بلا فايدة.

> `publishedAt` بياخد من `date` بتاع الووردبريس نفسه (مش حقل ACF) — لأن ده تاريخ النشر الحقيقي وبيتظبّط تلقائي.

### 3.5 المرحلة 5 — قطع الغيار (الأخطر)

هنا **الداتا من مصدرين مقصودين**:

```graphql
query Parts($first: Int = 100) {
  products(first: $first, where: { status: "publish" }) {
    nodes {
      ... on SimpleProduct {
        databaseId              # ← wooId — من ووكومرس، مش ACF
        slug
        name
        price(format: RAW)      # ← السعر — من ووكومرس
        stockStatus             # ← المخزون — من ووكومرس
        image { sourceUrl altText }   # ← الصورة — من ووكومرس
        sparePartFields {
          sku                   # ← من ACF
          partCategory
          brand
          featured
          descriptionAr descriptionEn descriptionHe
          specs { labelAr labelEn labelHe valueAr valueEn valueHe }
          compatibility { modelName }
        }
      }
    }
  }
}
```

| حقل `Part` في الكود | المصدر | ليه |
|---|---|---|
| `wooId` | `databaseId` | لازم يكون رقم المنتج الحقيقي، وإلا الكارت بيوديك لمنتج غلط |
| `price` | `price(format: RAW)` | ووكومرس هو صاحب السعر — عروض وضرايب وكله |
| `inStock` | `stockStatus == IN_STOCK` | بيتحدّث تلقائي مع كل بيعة |
| `image` / `alt` | `image` | الـ featured image بتاعت المنتج |
| `name` | `name` | ⚠️ **مشكلة مفتوحة — شوف تحت** |
| `sku`, `brand`, `category`, `specs`, `compatibility`, `description` | ACF | مش موجودين في ووكومرس بالشكل اللي نحتاجه |

**⚠️ مشكلة مفتوحة لازم نتفق عليها قبل المرحلة 5:**
`Part.name` من نوع `Localized` (3 لغات)، لكن `product.name` بتاع ووكومرس **لغة واحدة**. عندنا 3 اختيارات:

| الاختيار | الميزة | العيب |
|---|---|---|
| **أ)** نضيف `name_ar/en/he` لـ ACF | حل نظيف، الاسم مترجم صح | تكرار: الاسم في مكانين، وأي حد يعدّل اسم المنتج في ووكومرس مش هيتغير في الموقع |
| **ب)** اسم واحد من ووكومرس لكل اللغات | مفيش تكرار خالص | العربي والعبري هيشوفوا اسم إنجليزي |
| **ج)** إضافة ترجمة (WPML / Polylang) | الحل الصح على المدى الطويل | تعقيد كبير + WPML مدفوع + الـ schema كله هيتغير |

**توصيتي: (أ)** دلوقتي — 3 حقول زيادة أرخص بكتير من إدارة إضافة ترجمة كاملة، وأسماء المنتجات بتتغير نادرًا. لو وافقت، هزوّد الـ 3 حقول على الـ schema قبل ما تبدأ الاستيراد (أرخص وقت للتغيير هو **قبل** ما تدخل الداتا).

---

## 4) مصفوفة: كل ACF group → الملفات اللي بتستخدمه

الجدول ده هو "خريطة العمل" — لما نيجي ننفّذ، ده اللي هنمشي عليه.

الأرقام دي مولّدة من الـ schema نفسه (بتشمل حقول المجموعات والـ repeaters نفسها، مش الأوراق بس) — المجموع **453 حقل** في **10 groups**.

| ACF group | حقول | المستهلك الأساسي | الكمبوننتس المتأثرة | fallback |
|---|---|---|---|---|
| `siteOptionsFields` | 28 | `lib/site-config.ts` | `site-footer`, `site-header`, `contact-details`, `add-to-cart-button`, `cart-view` | `siteConfig` + `footer` في dictionaries |
| `homePageFields` | 220 | `app/page.tsx` | `hero`, `stats-strip`, `fleet-showcase`, `marquee-strip`, `global-reach`, `services`, `cta-section` | `dict.home` |
| `importPageFields` | 56 | `app/import/page.tsx` | `import-hero`, `import-steps`, `import-browser`, `import-custom-cta` | `dict.import` |
| `sparePartsPageFields` | 23 | `app/products/page.tsx` | `page-hero`, `products-browser` | `dict.products` |
| `blogPageFields` | 20 | `app/blog/page.tsx` | `blog-hero`, `blog-browser` | `dict.blog` |
| `cartPageFields` | 24 | `app/cart/page.tsx` | `cart-view` | `dict.cart` |
| `contactPageFields` | 23 | `app/contact/page.tsx` | `page-hero`, `contact-form`, `contact-section` | `dict.contact` |
| `importCarFields` | 37 | `lib/wp/content.ts` | `import-car-card`, `import-car-detail`, `import-browser` | `lib/data/import-cars.ts` |
| `sparePartFields` | 16 + Woo | `lib/wp/content.ts` | `product-card`, `product-detail`, `products-browser` | `lib/data/parts.ts` |
| `blogPostFields` | 11 | `lib/wp/content.ts` | `blog-card`, `blog-article`, `blog-browser` | `lib/data/blog.ts` |

### اللي **مش** بيتربط بـ ACF ولا مرة (متفق عليه)

| القسم في dictionaries | نصوص | ليه بيفضل في الكود |
|---|---|---|
| `account.*` | ~120 | رسايل خطأ، labels، validation — نصوص وظيفية مش محتوى تسويقي. تعديلها من لوحة التحكم بيكسر الـ UX ومش بيضيف قيمة |
| `nav.*` | 8 | روابط التنقل مربوطة بمسارات الكود (`app/**`) — تغييرها من ACF بيوّدي لروابط ميتة |
| `common.*` | ~33 | كلمات واجهة (Loading, Close, Next…) — نفس السبب |
| `productDetail.*`, `importDetail.*` | ~25 | labels تفاصيل (Engine, Mileage…) — قايمة مقفولة بتقابل حقول ثابتة |

**المجموع: ~186 نص وظيفي بيفضل في الكود.** ده قرار مقصود اتفقنا عليه، مش نسيان.

---

## 5) الكاش و ISR

### 5.1 الاستراتيجية

| نوع الداتا | الطريقة | المدة | السبب |
|---|---|---|---|
| إعدادات الموقع | `revalidate` + tag `site-options` | 1 ساعة | بتتغير مرة كل شهور |
| صفحات المحتوى | `revalidate` + tag `page:<slug>` | 5 دقايق | تعديلات تسويقية |
| عربيات الاستيراد | `revalidate` + tag `import-cars` | 5 دقايق | حالة العربية بتتغير |
| المدونة | `revalidate` + tag `blog` | 5 دقايق | نشر مقالات |
| **الأسعار والمخزون** | `revalidate` قصير + tag `products` | **60 ثانية** | سعر قديم = مشكلة فلوس |
| بيانات الحساب والأوردرات | `no-store` | — | داتا كل مستخدم لوحده |

### 5.2 التحديث الفوري (webhook)

الوقت الافتراضي بيخلّي المحرّر يستنى. الحل: route handler في Next بيستقبل نداء من الوردبريس ويفرّغ الكاش على طول.

```
app/api/revalidate/route.ts
```

- بياخد `secret` (من `WP_REVALIDATE_SECRET`) و `tag`
- بينادي `revalidateTag(tag, 'max')`
- ⚠️ **أمان:** الـ route ده لازم يرفض أي طلب بسر غلط، ولازم يكون rate-limited. غير كده يبقى وسيلة DoS مجانية على الـ VPS.
- من ناحية الوردبريس: hook على `save_post` + `acf/save_post` + `updated_option` يبعت الطلب. الكود ده هيتضاف على `wordpress/mu-plugin/alifleet-cms.php` في نفس المرحلة.

### 5.3 صفحات التفصيل

`app/import/[slug]/page.tsx`، `app/blog/[slug]/page.tsx`، `app/products/[slug]/page.tsx` عندهم `generateStaticParams` بيقرأ من `lib/data`. هيتحوّل لقراءة من `content.ts`.

⚠️ **مصيدة:** لو الوردبريس واقع وقت الـ build، `generateStaticParams` هترجّع قائمة الـ fallback بس، والعربيات الجديدة اللي في الوردبريس هتطلع 404. الحل: `dynamicParams = true` عشان أي slug مش في القائمة يتولّد on-demand.

---

## 6) الاختبار — إزاي نتأكد إن الربط صح مش بالعين

### 6.1 سكربت مقارنة (يتكتب في المرحلة 1)

```
wordpress/scripts/compare-content.mjs
```

بيجيب المحتوى من WPGraphQL، يجيب المحتوى من `lib/data` + dictionaries، ويطبع الفروق. الهدف: كل حقل يوصل من ACF **بنفس** قيمة الكود بالظبط. أي فرق = إما استيراد ناقص أو mapper غلط.

ده أهم أداة في الخطة كلها: بتحوّل "أظن الربط شغال" لـ "**متأكد** إن 100% من الحقول وصلت".

### 6.2 قائمة تحقق لكل مرحلة

قبل أي مرحلة تتعدّي:

- [ ] `compare-content.mjs` مفيش فروق
- [ ] الـ 3 لغات معروضة صح (ar / en / he) والاتجاه RTL سليم
- [ ] كل الصور بتحمّل (مفيش 404 على `sourceUrl`)
- [ ] بإطفاء الوردبريس تمامًا: الصفحة لسه بتفتح بالـ fallback
- [ ] بإفراغ حقل واحد في ACF: الصفحة بترجع للقيمة الافتراضية مش نص فاضي
- [ ] `pnpm build` ينجح
- [ ] Lighthouse مش نزل أكتر من 5 نقط عن قبل الربط

### 6.3 اختبارات إضافية خاصة بالمرحلة 5

- [ ] السعر المعروض == السعر في لوحة ووكومرس (اختبر 3 منتجات)
- [ ] منتج مخزونه صفر بيظهر "غير متوفر" ومش بيتضاف للكارت
- [ ] الكارت بيروح لـ `?add-to-cart=` بالـ `databaseId` الصح
- [ ] بعد بيعة كاملة: المخزون نزل، والموقع عرض العدد الجديد بعد 60 ثانية

---

## 7) تقدير الحجم

| المرحلة | ملفات جديدة | ملفات معدّلة | ملاحظة |
|---|---|---|---|
| 1 — إعدادات | 4 | ~8 | تحويل `siteConfig` لـ Context (شوف 3.1) |
| 2 — صفحات | 3 | 6 | الهوم أكبرهم (220 حقل) |
| 3 — عربيات | 2 | 3 | الكمبوننتس مش بتتغير |
| 4 — مدونة | 2 | 3 | نفس الكلام |
| 5 — قطع | 2 | 4 | يحتاج قرار `name` الأول |
| الكاش/webhook | 2 | 2 | + كود في mu-plugin |

---

## 8) قرارات مطلوبة منك قبل ما نبدأ

| # | القرار | خيارات | توصيتي |
|---|---|---|---|
| 1 | اسم المنتج متعدد اللغات (القسم 3.5) | أ / ب / ج | **أ** — 3 حقول ACF |
| 2 | نحوّل `siteConfig` لـ Context؟ (القسم 3.1) | آه / نخلي الإعدادات في الكود | **آه** — وإلا نص الفايدة ضايعة |
| 3 | webhook التحديث الفوري | نعمله في المرحلة 1 / نأجّله للآخر | **المرحلة 1** — بيوفّر وقت في كل مرحلة بعدها |
| 4 | نحذف `lib/data` بعد ما كله يستقر؟ | نحذف / نخلّيه fallback للأبد | **fallback للأبد** — تكلفته صفر وقيمته عالية |

---

## 9) الحاجات اللي عرفت إنها هتوجع — بصراحة

مش عايز أفاجئك بيهم وسط الشغل:

1. **`siteConfig` كـ Context** — أنضف على الورق، بس بيلمس 8 ملفات وبعضهم client components. أطول جزء في المرحلة 1 رغم إن الداتا أصغر جزء.

2. **صفحة الهوم 220 حقل** — أكبر كويري في المشروع. لو بقى بطيء، نقسّمه لكويريين (fold أول + الباقي).

3. **`select` fields** — ACF بيرجّع المفتاح، والكود عايز نص مترجم. جدول تحويل ثابت في الكود، ومحتاج يتحدّث لو زوّدت خيار جديد في لوحة التحكم. **دي أكتر حاجة هتنسيها** وتلاقي نص فاضي — فالـ mapper هيسجّل `console.warn` بمفتاح غير معروف بدل ما يفضل ساكت.

4. **الصور** — الكود بيستخدم مسارات محلية (`/images/hero-avatars.png`)، ACF بيرجّع URLs من الوردبريس. لازم `remotePatterns` في `next.config.mjs` لدومين الـ CMS، وإلا `next/image` هيرفض. (موجود في الدليل، القسم 10.)

5. **اللغة الافتراضية في ووكومرس** — الكارت والدفع كلهم جوه الوردبريس. يعني المستخدم العربي هيروح لصفحة checkout بلغة الوردبريس. مشكلة UX حقيقية مالهاش حل جوه الخطة دي — تحتاج قرار منفصل (إضافة ترجمة لووكومرس أو checkout جوه Next).

---

*هذه الخطة تُنفَّذ بعد تأكيدك أن WPGraphQL يرجّع بيانات فعلية. لا تبدأ أي مرحلة منها قبل ذلك.*
