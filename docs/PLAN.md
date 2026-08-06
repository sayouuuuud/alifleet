# خطة العمل — ربط ALI FLEET بـ WordPress + ACF

> الملف ده **سجل التحضير**: إيه المشاكل اللي اتلقت، وإيه اللي اتبنى، وليه. كل بند فيه: **إيه المشكلة → إيه اللي عملته → الملف الناتج**.
> ✅ **التحضير اكتمل.** الملف ده بقى **خلفية ومرجع قرارات** — مش خطة تنفيذ على السيرفر.

> ## 🗺️ خريطة الملفات — ابدأ من الصح
>
> | لو انت… | ابدأ من |
> |---|---|
> | 🤖 **agent** بياخد تيرمينال على السيرفر | **`AGENT.md`** ← الجزء ب. الملف الوحيد اللي بيقرأه — كل الأوامر جواه |
> | 👤 المستخدم وعايز تشغّل agent | **`AGENT.md`** ← الجزء أ. 4 خطوات وخلاص |
> | 👤 المستخدم وبتنفّذ بإيدك | **`WORDPRESS-SETUP.md`** ← الدليل الكامل بالأوامر |
> | 🔍 عايز تفهم ليه الـ schema بالشكل ده | الملف ده + `ACF-FREE-CONVERSION-PLAN.md` |
> | 🔌 عايز تربط الكود بـ ACF (بعد ما ووردبريس يشتغل) | `ACF-WIRING-PLAN.md` ← **مرحلة تانية، مش على السيرفر** |
>
> **الوضع الحالي على السيرفر:** VPS شغال ✅ / WordPress منصَّب ✅ / أكتر الإضافات نازلة ⚠️ / ACF + الداتا ❓ (يتحقق في مهمة M0).

---

## 0) الوضع الحالي (نتيجة الفحص)

فحصت الكود والملفات اللي بعتّهم، وده اللي لقيته بالظبط:

### الكود
| بند | القيمة |
|---|---|
| صفحات التطبيق | 16 صفحة (`app/**/page.tsx`) |
| مصدر المحتوى الحالي | `lib/data/*.ts` (1003 سطر) + `lib/i18n/dictionaries/*.ts` (1638 سطر) |
| قراءة من ACF | **صفر** — مفيش أي استعلام ACF في الكود |
| WPGraphQL | `lib/wp/` موجودة بس بتستخدم في auth (login/register/orders) بس |
| اللغات | 3 لغات (ar / en / he) + RTL |
| عربيات الاستيراد | 7 |
| قطع الغيار | 12 |
| مقالات المدونة | 6 |

> تصحيح: في أول رد قلت 9 عربيات و14 قطعة و8 مقالات — ده كان تقدير غلط من `grep`. العدد الفعلي بعد تحميل الملفات: **7 / 12 / 6**.

### ملفات ACF اللي بعتّها
| ملف | groups | حجم |
|---|---|---|
| `acf-import.json` | 8 | 51 KB |
| `acf-schema-multilingual.json` | 8 | 98 KB |

**نتيجة المقارنة الآلية:** الملف المتعدد اللغات **superset كامل** للملف الأول — مفيش حقل واحد في `acf-import.json` مش مغطى في `acf-schema-multilingual.json`. الفروق:

| group | acf-import | multilingual |
|---|---|---|
| `group_import_car_fields` | 16 حقل | 24 حقل |
| `group_spare_part_fields` | 11 حقل | 17 حقل |
| `group_blog_post_fields` | 5 حقول | 7 حقول |
| الباقي (5 groups) | متطابقين | متطابقين |

**يعني `acf-import.json` نسخة قديمة ملهاش لازمة — الدمج = ناخد المتعدد اللغات كأساس ونصلّح مشاكله.**

### ملف `content_fixed.csv`
| بند | القيمة |
|---|---|
| صفوف | 5 (+ header) |
| أعمدة | 537 |
| الصفوف | Home / Car Import / Spare Parts / Contact / **Site Settings** |

---

## 1) المشاكل اللي لقيتها ولازم تتصلّح

### 1.1 حقول لغوية على بيانات مش لغوية (خطأ تصميمي)
الحقول دي مترجمة 3 مرات في الـ schema، بس في الكود قيمتها **نص واحد محيّد** — يعني بتخلق 3 خانات في لوحة التحكم لنفس القيمة، والنتيجة اختلاف بيانات بين اللغات.

| الحقل في ACF | نوعه في الكود | القيمة الفعلية | القرار |
|---|---|---|---|
| `car_model_ar/en/he` | `model: string` | `Sprinter 519 CDI` | ← حقل واحد `car_model` |
| `specs.engine_ar/en/he` | `engine: string` | `2.1L` | ← حقل واحد `engine` |
| `specs.drivetrain_ar/en/he` | `drivetrain: string` | `RWD` | ← حقل واحد `drivetrain` |
| `sku_ar/en/he` | `sku: string` | `AF-BRK-330V` | ← حقل واحد `sku` |
| `brand_ar/en/he` | `brand: string` | `Brembo` | ← حقل واحد `brand` |
| `compatibility.model_name_ar/en/he` | `compatibility: string[]` | `Actros 1845` | ← حقل واحد `model_name` |

**التوفير:** 18 حقل → 6 حقول. (12 خانة أقل في لوحة التحكم لكل عربية/قطعة).

### 1.2 المدونة ناقصة عنوان وملخص متعدد اللغات ← **دي أهم مشكلة**
`group_blog_post_fields` فيه 7 حقول: `reading_minutes`, `author_name_ar/en/he`, `author_avatar`, `featured_post`, `blog_category`.

**مفيش فيه `title` ولا `excerpt` خالص.** لكن الكود عنده:
```ts
titleEn, titleAr, titleHe, excerptEn, excerptAr, excerptHe
```
WordPress بيخزن `post_title` و `post_excerpt` بلغة **واحدة** بس. يعني بالـ schema الحالي المدونة هتشتغل بلغة واحدة والتانيتين هيبقوا فاضيين.

**الحل:** أضيف `title_ar/en/he` + `excerpt_ar/en/he` لمجموعة المدونة (6 حقول جديدة).

> ملاحظة: `author_name` مترجم 3 مرات وقيمته `ALI FLEET Team` — ده اسم شركة، محيّد. هخليه حقل واحد.

### 1.3 قطع الغيار بتضرب مع WooCommerce
`group_spare_part_fields` مربوط على `post_type == product` (منتجات ووكومرس)، وفيه حقول **بتكرر حقول ووكومرس الأصلية**:

| حقل ACF | حقل WooCommerce الأصلي | المشكلة |
|---|---|---|
| `price` (number) | `_regular_price` | سعرين مختلفين → الكارت بيحسب غلط |
| `in_stock` (true_false) | `_stock_status` | المخزون مش بيتحدث لما حد يشتري |
| `part_image` (image) | Featured image / gallery | صورتين مختلفتين |
| `woo_id` (number) | `databaseId` بتاع المنتج نفسه | تكرار لنفس الرقم |

**الحل:** أشيل الأربعة من ACF، والكود يقرأ من WooGraphQL (`price`, `stockStatus`, `image`, `databaseId`). ده بيخلي الأسعار والمخزون **صح تلقائيًا** مع كل عملية بيع.

### 1.4 صفحتين مالهمش ACF group خالص
| الصفحة | النصوص التسويقية | ACF group |
|---|---|---|
| `app/blog/page.tsx` | eyebrow, title, titleEm, lead | ❌ مفيش |
| `app/cart/page.tsx` | title, lead, empty, emptyLead, whatsappIntro… | ❌ مفيش |

**الحل:** أضيف `group_blog_page` و `group_cart_page`.

### 1.5 صف `Site Settings` في الـ CSV **مش قابل للاستيراد**
الصف الخامس نوعه `options-page`. ACF Options Page مش بتتخزن في جدول `wp_posts` — بتتخزن في `wp_options`. أي أداة استيراد CSV (WP All Import وغيرها) بتنشئ **posts** بس، فالصف ده هيعمل صفحة فاضية اسمها "Site Settings" والبيانات مش هتوصل لمكانها.

**الحل:** أطلّع إعدادات الموقع في ملف منفصل + سكربت PHP/WP-CLI يكتبها في مكانها الصح.

### 1.6 الـ CSV مخلوط (5 أنواع في ملف واحد)
537 عمود في ملف واحد فيه أعمدة الهوم + الاستيراد + القطع + الاتصال. كل صف بيستخدم ~20% من الأعمدة والباقي فاضي. أدوات الاستيراد بتتعامل مع **نوع واحد لكل ملف**.

**الحل:** أفصلهم — ملف لكل نوع.

### 1.7 الـ repeaters محتاجة ACF PRO من الأصل
حقول زي `gallery`, `highlights`, `specs`, `compatibility`, `address_lines`, `steps_list` كانت كلها **repeaters** — ونوع الـ `repeater` **مش موجود في ACF المجانية**، وكمان استيراده من CSV محتاج **WP All Import Pro + ACF Add-on** (مدفوع).

**الحل:** كل repeater اتحوّل لـ **عدد ثابت من المجموعات المرقّمة** (`hero_slide_1` … `hero_slide_5`)، والـ `group` متاح في ACF المجانية. الـ schema بقت **مفيهاش ولا repeater** — يعني مفيش ACF PRO ولا WP All Import Pro. التفاصيل والمقايضات في **قسم 8** في `WORDPRESS-SETUP.md`.

> فاضل استخدام واحد لـ PRO مش متعلق بالحقول: `acf_add_options_page` لشاشة **Site Settings**. على المجانية القيم بتتكتب وتتقرأ من `wp_options` عادي، بس التعديل بيبقى من WP-CLI مش من شاشة (القسم 3.2).

وسكربت الـ WP-CLI بيفضل هو الطريقة الموصى بها — بيكتب كل المجموعات من JSON في مرة واحدة، والـ CSV بديل يدوي.

---

## 2) اللي هعمله بالظبط (المخرجات)

### أ) ملف ACF واح�� مدمج ومصلَّح
**`wordpress/acf/alifleet-acf-schema.json`**

- الأساس: `acf-schema-multilingual.json`
- تصليح 1.1 → 18 حقل بقوا 6
- تصليح 1.2 → +6 حقول للمدونة (title/excerpt × 3 لغات)، و `author_name` بقى حقل واحد
- تصليح 1.3 → شيل `price`, `in_stock`, `part_image`, `woo_id`
- تصليح 1.4 → +2 groups (`group_blog_page`, `group_cart_page`)
- كل الـ groups عليها `show_in_graphql: 1` + `graphql_field_name` صح
- **النتيجة: 10 groups** (كانوا 8)

### ب) ملفات الاستيراد — ملف لكل نوع
```
wordpress/import/
├── pages.csv              6 ����فوف  (Home / Import / Products / Blog / Cart / Contact)
├── import-cars.csv        7 صفوف  ← مولّدة من lib/data/import-cars.ts
├── spare-parts.csv       12 صف   ← مولّدة من lib/data/parts.ts
├── blog-posts.csv         6 صفوف  ← مولّدة من lib/data/blog.ts
└── site-settings.json     إعدادات الموقع (مش CSV — سبب البند 1.5)
```
كل الملفات UTF-8 with BOM (عشان العربي والعبري ميتكسروش في Excel).

### ج) سكربت الاستيراد المجاني (الطريقة الموصى بها)
```
wordpress/scripts/
├── alifleet-import.php    سكربت WP-CLI — يقرأ JSON ويكتب كل مجموعات ACF
└── seed-data.json         كل الداتا (صفحات + عربيات + قطع + مقالات + إعدادات)
```

### د) mu-plugin للتسجيل الصحيح
**`wordpress/mu-plugin/alifleet-cms.php`** — يسجّل:
- CPT `import_car` مع `show_in_graphql` + `graphql_single_name` / `graphql_plural_name`
- ACF Options Page `site-settings` مع اسم GraphQL
- تعريض إعدادات الموقع في WPGraphQL
- إضافة `post_excerpt` و taxonomies للمدونة في GraphQL

> ليه mu-plugin مش من واجهة ACF؟ لأن تسجيل CPT من ACF UI مش بيضمن إعدادات GraphQL، وبيضيع لو حد غيّر حاجة في الواجهة.

### هـ) الدليل التفصيلي
**`docs/WORDPRESS-SETUP.md`** — من أول SSH على الـ VPS لحد الموقع شغال:

1. تجهيز الـ VPS (Nginx, PHP-FPM, MySQL, Node, pm2)
2. تنصيب WordPress على `cms.alifleet.com`
3. قائمة الإضافات المطلوبة + إصدارات + ليه كل واحدة
4. `wp-config.php` — مفتاح JWT + إعدادات
5. استيراد ACF schema (خطوة بخطوة بالصور الوصفية)
6. تسجيل CPT + Options Page
7. استيراد الداتا (الطريقتين: WP-CLI و CSV)
8. **شرح تركيب المجموعات المرقّمة جوه ACF بالتفصيل** (اللي بدّلت الـ repeaters)
9. إعداد WooCommerce (عملة، شحن، دفع، صلاحيات)
10. ربط Next.js — كل متغير بيئة وقيمته
11. Nginx + SSL للاتنين
12. تحويل الدومين: `alifleet.com` → Next, `cms.alifleet.com` → WordPress
13. اختبارات التحقق (كويريات GraphQL جاهزة للنسخ)
14. حل المشاكل الشائعة

### و) خطة الربط المستقبلية
**`docs/ACF-WIRING-PLAN.md`** — الخطة اللي هنفّذها **بعد** ما تتأكد إن الوردبريس شغال:
- ترتيب المراحل (site options → صفحات → CPTs → WooCommerce)
- شكل طبقة البيانات الجديدة (`lib/wp/content.ts`)
- استعلامات GraphQL جاهزة لكل صفحة
- استراتيجية fallback: لو ACF فاضي → يرجع للداتا الحالية (الموقع ميقعش أبدًا)
- استراتيجية الكاش و ISR
- مصفوفة: كل حقل ACF → الملف والسطر اللي بيستخدمه

### ز) طبقة تشغيل الـ agent (اتضافت بعد قرار تشغيل agent على السيرفر)

| الملف | دوره |
|---|---|
| `docs/AGENT.md` | **الملف الوحيد.** الجزء أ = 4 خطوات للمستخدم. الجزء ب = خطة الـ agent: 9 مهام (M0→M8) بالأوامر كاملة inline + جدول ALLOW/ASK/DENY + بوابات تحقق |
| `wordpress/server/alifleet-agent.sudoers` | قايمة sudo محدودة لليوزر المؤقت (5 مجموعات أوامر بس) |
| `wordpress/server/agent-preflight.sh` | سكربت جرد M0 — **قراءة فقط**، مفيش أمر كتابة واحد فيه |

**الحدود المتفق عليها:** الـ agent يشتغل من الإضافات لحد التحقق من GraphQL. القسم 10 (رفع Next) والقسم 11 (nginx/SSL) والقسم 12 (تحويل الدومين) وأي `wp db` — كلها بره نطاقه أو محتاجة إذن صريح.

---

## 3) اللي **مش** هعمله دلوقتي (وليه)

| البند | السبب |
|---|---|
| تعديل `lib/data/*.ts` أو الـ dictionaries | اتفقنا: الربط مرحلة تانية بعد التأكد إن الوردبريس شغال. وبقرار الربط رقم 4 دول **مش هيتحذفوا خالص** — هيتحوّلوا لطبقة fallback دائمة |
| نصوص صفحات الحساب في ACF | اتفقنا تفضل في الكود — رسايل خطأ و validation مش محتوى تسويقي |
| تعديل كود الصفحات | نفس السبب الأول |
| حذف `.v0/acf/` | ملفات تحليل مؤقتة — هحذفها آخر الشغل |

---

## 4) الترتيب التنفيذي — ✅ اكتمل

| # | المخرج | الحالة |
|---|---|---|
| 1 | `wordpress/acf/alifleet-acf-schema.json` — 10 groups / 906 حقل، صفر repeater | ✅ |
| 2 | `wordpress/mu-plugin/alifleet-cms.php` — CPT + Options Page + GraphQL + CORS | ✅ |
| 3 | `wordpress/scripts/seed-data.json` — كل الداتا مستخرجة من الكود | ✅ |
| 4 | `wordpress/scripts/alifleet-import.php` — سكربت WP-CLI | ✅ |
| 5 | `wordpress/import/*.csv` + `site-settings.json` | ✅ |
| 6 | `docs/WORDPRESS-SETUP.md` — الدليل الكامل | ✅ |
| 7 | `docs/ACF-WIRING-PLAN.md` — خطة الربط | ✅ |
| 8 | `wordpress/scripts/validate-content.mjs` — سكربت التحقق | ✅ |
| 9 | تنضيف `.v0/acf/` | ✅ |

**سكربت التحقق (خطوة 8)** بيتأكد إن كل عمود في كل CSV له حقل مطابق في الـ schema، وإن مفيش مفتاح `field_*` مكرر، وإن مفيش نوع حقل بيحتاج ACF PRO (`repeater` / `flexible_content` / `clone` / `gallery`)، وإن مفيش داتا بتتعدّى سقف المجموعات المرقّمة، وإن الـ seed data متطابقة مع الـ CSV. شغّله بـ:

```bash
node wordpress/scripts/validate-content.mjs
```

النتيجة الحالية: **كل الفحوصات ناجحة** — 6 صفحات / 7 عربيات / 12 قطعة / 6 مقالات.

### مشاكل إضافية اتكشفت وقت التنفيذ واتصلّحت

| المشكلة | التصليح |
|---|---|
| مفاتيح ACF مكرّرة (`field_title_ar` وغيره) بين `group_blog_page` و `group_cart_page` — ACF بيدمج الحقول المتشابهة في المفاتيح ويضيّع بيانات | المفاتيح بقت `field_blog_title_ar` / `field_cart_title_ar` |
| سطر العنوان في إعدادات الموقع كان إنجليزي في اللغات الـ 3 | اتترجم للعربي والعبري في `seed-data.json` و `site-settings.json` |

### قرارات الربط الأربعة — اتحددت (التفاصيل في `ACF-WIRING-PLAN.md` القسم 8)

| القرار | الاختيار | أثره على الملفات دلوقتي |
|---|---|---|
| اسم المنتج متعدد اللغات | 3 حقول ACF | ✅ **اتنفّذ** — `name_ar/en/he` مضافين في `group_spare_part_fields` + 3 أعمدة في `spare-parts.csv` (54 عمود) + `acf.name_*` في الـ12 قطعة في الـ seed |
| `siteConfig` | يتحوّل لـ React Context | مرحلة الربط — مفيش تغيير في ملفات الاستيراد |
| webhook التحديث الفوري | في المرحلة 1 | مرحلة الربط — مفيش تغيير في ملفات الاستيراد |
| `lib/data` | fallback للأبد، مش هيتحذف | يأكّد البند التاني في القسم 3 تحت |

القرار الأول كان الوحيد اللي بيلمس الـ schema، وده السبب إنه اتنفّذ فورًا: أرخص وقت لتغيير الـ schema هو **قبل** الاستيراد. لو كنت استوردت قبل التغيير ده، أعد `wp acf import` ثم أعد استيراد القطع.

---

## 5) حاجات محتاج أعرفها منك (مش موقفة ��لشغل)

هكمّل بافتراضات معقولة، وقولّي لو حاجة غلط:

| # | السؤال | افتراضي |
|---|---|---|
| 1 | الدومين الفعلي | `alifleet.com` + `cms.alifleet.com` |
| 2 | العملة | شيكل `₪` (`ILS`) — الموقع فيه عبري |
| 3 | رقم واتساب | placeholder واضح تغيّره |
| 4 | نسخة PHP | 8.2 |
| 5 | خانة "رقم الهاتف" في التسجيل | لسه مش بتتبعت لوردبريس — هوثّقها في الدليل كبند مفتوح |

---

## 6) تحذير أمني مهم لازم أقوله

الكود الحالي بيخزن JWT في cookies. لما تحوّل الدومين:
- WordPress على `cms.alifleet.com` و Next على `alifleet.com` = **نطاقين مختلفين**
- لازم إعداد CORS صح في WordPress، وإلا كل عمليات تسجيل الدخول هتفشل

ده مغطّى بالتفصيل في قسم 10 و 11 من الدليل، وفيه إعداد Nginx جاهز.

---

*آخر تحديث: إضافة طبقة تشغيل الـ agent — ابدأ من `docs/AGENT.md` لو agent، أو `docs/WORDPRESS-SETUP.md` لو بتنفّذ بإيدك.*
