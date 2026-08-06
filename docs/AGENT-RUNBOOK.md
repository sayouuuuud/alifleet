# AGENT RUNBOOK — الخطة المركزية للـ agent المنفِّذ

> **الملف ده هو نقطة الدخول الوحيدة.** أي agent بياخد تيرمينال على السيرفر يقرأ الملف ده **بالكامل** قبل أي أمر.
> باقي ملفات `docs/` **مراجع تفصيلية**، مش خطط تنفيذ مستقلة. الترتيب والحدود والبوابات من هنا بس.

---

## 0) هوية المهمة — اقرأ ده الأول

| بند | القيمة |
|---|---|
| **الهدف النهائي للـ agent** | WordPress على `cms.alifleet.com` يبقى فيه: الإضافات مفعّلة + ثوابت `wp-config` + mu-plugin + ACF schema (10 مجموعات) + الداتا كلها مستوردة + WooCommerce مضبوط + GraphQL بيرجّع كل الحقول صح |
| **آخر حاجة مسموحة** | **التحقق من GraphQL** (قسم 13.1 → 13.3 في `WORDPRESS-SETUP.md`) + تجهيز **قيم** متغيرات البيئة في التقرير |
| **الخط الأحمر** | ❌ **ممنوع رفع أو بناء أو تشغيل مشروع Next.js على السيرفر** (القسم 10 بالكامل)، ❌ ممنوع nginx، ❌ ممنوع SSL/certbot، ❌ ممنوع تحويل الدومين (القسم 12) |
| **الملفات** | موجودة **local** على جهاز المستخدم، والـ agent شايفها كلها في مجلد المشروع. الرفع للسيرفر بـ `scp` من نفس الجهاز |
| **مبدأ عام** | الـ agent **بينفّذ**، مش **بيخترع**. أي انحراف عن المكتوب = وقوف وسؤال |

### الوضع الحالي المؤكَّد (مش افتراض)

| البند | الحالة | معناه للـ agent |
|---|---|---|
| VPS | ✅ شغال | **متعملش** قسم 1 (apt/ufw/mysql/php) — تحقق بس |
| WordPress | ✅ منصَّب | **متعملش** `wp core install` ولا `wp config create` — تحقق بس |
| الإضافات | ⚠️ **أكترها** نازلة | المهمة M1 = جرد + إكمال الناقص، **مش** تنصيب من الصفر |
| قاعدة البيانات | ✅ موجودة وفيها داتا | أي أمر ممكن يلمسها = بوابة إذن |
| ACF schema / الداتا | ❓ غير معروف | تحقق في M0 قبل أي استيراد |
| nginx / SSL / الدومين | ❓ غير معروف | **مش شغلك.** بلّغ بالحالة وبس |

---

## 1) قانون الحدود — الجدول الحاكم

الـ agent بيصنّف **كل أمر** قبل تنفيذه في واحدة من التلاتة. لو أمر مش مذكور في الجدول → **يعتبره ASK**.

### 🟢 ALLOW — ينفّذ لوحده بدون سؤال

| النوع | أمثلة |
|---|---|
| قراءة WP-CLI | `wp plugin list`, `wp option get`, `wp post list`, `wp user list`, `wp config list`, `wp core version`, `wp post-type list` |
| قراءة النظام | `ls`, `cat`, `grep`, `tail`, `df -h`, `free -m`, `php -v`, `php -l`, `node -v`, `nginx -t`, `systemctl status *`, `curl` على `localhost` |
| الإضافات | `wp plugin install` / `activate` **للقايمة المعتمدة في قسم 3.1 بس** + `unzip` و `activate` للـ zip اللي المستخدم رفعه |
| الثوابت | `wp config set` **للثوابت المذكورة في قسم 4 بالحرف بس** |
| mu-plugin | `cp` لـ `wp-content/mu-plugins/` + تعديل `ALIFLEET_ALLOWED_ORIGINS` |
| ACF | `wp acf import --json_file=...` |
| الاستيراد | `wp eval-file /tmp/alifleet-import.php ... --dry-run` (الجاف مسموح دايمًا) |
| WooCommerce | `wp option update woocommerce_*` للإعدادات المذكورة في قسم 9.1 → 9.3 |
| التحقق | `wp eval` **بكود قراءة فقط** (`get_field` / `get_option` / `echo`) + كويريات GraphQL بـ `curl` |
| الملفات | `scp` من الجهاز لـ `/tmp` على السيرفر، `mkdir -p`, `chmod` جوه `/var/www/cms.alifleet.com` |

### 🟡 ASK — يوقف، يعرض الأمر بالنص، ويستنى "تمام/نفّذ"

| النوع | ليه |
|---|---|
| **الاستيراد الحقيقي** (`wp eval-file` بدون `--dry-run`) | أول كتابة جماعية في قاعدة البيانات |
| **أي `wp db *`** (`export`, `import`, `query`, `cli`, `optimize`, `reset`) | لمس مباشر لقاعدة البيانات |
| **أي `wp eval` فيه كتابة** (`update_field`, `update_option`, `wp_insert_post`, `wp_delete_*`) | كتابة غير موثّقة |
| **certbot / SSL** بأي شكل | خطر على شهادة شغالة |
| **تعديل أي ملف في `/etc/nginx/`** + `systemctl reload/restart nginx` | ممكن يوقّع الموقع |
| **قسم 12 بالكامل** (تحويل الدومين، `wp search-replace`, تغيير `siteurl`/`home`) | أخطر خطوة في الدليل كلها |
| `apt install` / `apt upgrade` / أي حاجة على مستوى النظام | تغيير بيئة شغالة |
| `wp core update` / `wp plugin update` / `wp plugin delete` / `wp theme *` | ممكن يكسر توافق WPGraphQL |
| `wp user create` / `delete` / `update` / تغيير باسورد | حسابات وصلاحيات |
| `chown` / `chmod -R` بره `/var/www/cms.alifleet.com` | خروج عن نطاق العمل |
| أي إضافة **مش** في قسم 3.1 أو 3.2 | مفيش إضافات باجتهاد شخصي |
| أي أمر الـ agent مش متأكد منه 100% | القاعدة الافتراضية |

**صيغة السؤال الإلزامية:**

```
⏸ محتاج إذن — [اسم المهمة]
الأمر:      <الأمر بالحرف>
بيعمل إيه:  <سطر واحد>
لو غلط:     <أسوأ نتيجة ممكنة>
البديل:     <لو فيه بديل أقل خطرًا>
مستني موافقتك.
```

### 🔴 DENY — ممنوع مطلقًا، حتى لو المستخدم قال "كمّل" بشكل عام

الرفض هنا **مش** بيتحل بإذن عابر. لازم المستخدم يقول الاسم الصريح للحاجة دي.

1. ❌ **القسم 10 بالكامل** — `git clone` للمشروع على السيرفر، `pnpm install`، `pnpm build`، `pm2 start/restart`، كتابة `/var/www/alifleet-web/.env.production`، إنشاء `ecosystem.config.cjs`. **الـ agent يجهّز القيم في التقرير وخلاص.**
2. ❌ `rm -rf` بأي شكل، و`rm` على أي حاجة بره `/tmp`.
3. ❌ `mysql` / `mysqldump` / `mariadb` مباشر، و`DROP` / `TRUNCATE` / `DELETE` في أي SQL.
4. ❌ `sudo su`, `su -`, `visudo`, تعديل `/etc/sudoers*`, إضافة يوزر، تعديل `authorized_keys`, `ufw` (فتح/غلق بورت).
5. ❌ طبع أو نسخ أو تسريب أي سر: محتوى `wp-config.php` كامل، `GRAPHQL_JWT_AUTH_SECRET_KEY`، باسوردات DB، مفاتيح API. **الأسرار تتولّد وتتحط في نفس الأمر من غير `echo`.**
6. ❌ `git push` / `git commit` على المستودع، أو تعديل كود المشروع (`app/`, `lib/`, `components/`) — الربط بالكود مرحلة تانية (`ACF-WIRING-PLAN.md`) ومش دور الـ agent ده.
7. ❌ تعديل `wordpress/acf/alifleet-acf-schema.json` أو `seed-data.json` بمزاجه. لو لقى غلط: يبلّغ ويستنى.
8. ❌ حذف أو تعطيل إضافة شغالة، أو تعطيل Wordfence/UpdraftPlus لو موجودين.
9. ❌ تشغيل الطريقة أ **والطريقة ب** مع بعض في قسم 7 — دول بديلين. **الطريقة أ فقط** هي المسار المعتمد للـ agent.
10. ❌ الاستمرار بعد فشل تحقق. **الفشل = وقوف، مش محاولة تانية بأمر مختلف.**

### صلاحيات اليوزر المؤقت

الحساب اللي انت داخل بيه اتعمل بـ `wordpress/server/agent-user.sh create`، وده اللي عنده فعليًا:

| البند | الوضع |
|---|---|
| مجموعة `sudo` | ❌ **مش** فيها. صلاحياتك من `/etc/sudoers.d/alifleet-agent` بس |
| أوامر sudo المتاحة | 5 مجموعات: `systemctl status`، `nginx -t/-T/-v`، `tail` للوجات، `chown/chmod` جوه `wp-content`، `systemctl reload php8.2-fpm`. **بس.** |
| كتابة الملفات | `wp-content/plugins` و `mu-plugins` و `uploads` (عن طريق مجموعة `www-data`). **مفيش** كتابة على ملفات الـ core |
| `wp-config.php` | 664 — تقدر تعدّل ثوابت القسم 4. **بس ممنوع تطبع محتواه أو تستخدم بيانات DB اللي جواه** |
| انتهاء الحساب | تلقائي بعد 3 أيام (`chage -E`) |
| المراقبة | كل أمر `sudo` بيتسجّل في `/var/log/auth.log` والمستخدم شايفه لحظيًا |
| الإلغاء الفوري | المستخدم بيقدر يقطعك في أي لحظة بـ `agent-user.sh revoke` — بيقفل الحساب ويقطع الجلسة |

**قاعدتين مهمين:**

1. **معظم شغلك مش محتاج `sudo` أصلًا.** أوامر `wp-*` و `unzip` و `cp` و `php -l` كلها بتشتغل من غيره لأن المجلد مملوك للمجموعة. **لو لقيت نفسك بتحتاج `sudo` لأمر مش في القايمة فوق — دي إشارة إنك خرجت عن نطاقك. وقف واسأل، متدوّرش على طريقة تلف بيها.**
2. **القايمة دي الطبقة التانية للحماية، والطبقة الأولى هي جدول ALLOW/ASK/DENY اللي فوق.** لو أمر عدّى تقنيًا من الـ sudoers لكنه مخالف للجدول → **مخالفة، مش تصريح**. الجدول هو الحاكم.

---

## 2) خريطة المهام — الترتيب إلزامي

```
M0  الجرد (قراءة فقط)          ──▶ 🚪 بوابة: تقرير + موافقة
M1  الإضافات (قسم 3)            ──▶ ✔ wp plugin list = 6 مفعّلين
M2  ثوابت wp-config (قسم 4)      ──▶ ✔ JWT key OK
M3  mu-plugin (قسم 5)           ──▶ ✔ CPT OK + page_slug rule
M4  ACF schema (قسم 6)          ──▶ ✔ 10 مجموعات
M5  الداتا (قسم 7.أ)            ──▶ 🚪 dry-run ثم إذن ثم تنفيذ
M6  WooCommerce (قسم 9)         ──▶ ✔ العملة + الصفحات
M7  تحقق GraphQL (قسم 13)       ──▶ ✔ كل الكويريات بترجّع داتا
M8  تسليم قيم البيئة (10.2 قيم فقط) ──▶ ⛔ وقوف نهائي
──────────────────────────────────────────
11 / 12 / بقية 10   ⛔ خارج نطاق الـ agent
```

**قاعدة الانتقال:** مفيش مهمة تبدأ قبل ما تحقق المهمة اللي قبلها يطلع **بالناتج المتوقع بالحرف**. مفيش "شكلها ماشية".

---

## M0 — الجرد (قراءة فقط) 🚪

**الهدف:** نعرف إحنا فين بالظبط قبل أي كتابة. **مفيش أمر كتابة واحد في المهمة دي.**

**نفّذ:**

```bash
# على جهازك — قبل أي حاجة على السيرفر
node wordpress/scripts/validate-content.mjs

# ارفع سكربت الجرد وشغّله على السيرفر
scp wordpress/server/agent-preflight.sh AGENT_USER@SERVER_IP:/tmp/
ssh AGENT_USER@SERVER_IP 'bash /tmp/agent-preflight.sh'
```

**سلّم التقرير بالشكل ده وقف:**

| بند | المطلوب في التقرير |
|---|---|
| مسار WordPress | المسار الفعلي (الدليل بيفترض `/var/www/cms.alifleet.com`) |
| إصدارات | WP / PHP / MariaDB / WP-CLI |
| الإضافات | **قايمة كاملة** بحالة كل واحدة + إيه الناقص من الستة |
| ACF | مجموعات موجودة؟ العدد؟ |
| CPT | `import_car` موجود؟ |
| الداتا | عدد الصفحات / `import_car` / `product` / `post` |
| ثوابت | `GRAPHQL_JWT_AUTH_SECRET_KEY` موجود؟ (اكتب موجود/مش موجود — **متطبعش القيمة**) |
| nginx / SSL / DNS | الحالة كمعلومة **بس** — للعلم مش للتنفيذ |
| مخاطر | أي حاجة تخالف الدليل |
| المدقّق المحلي | ناتج `validate-content.mjs` |

**بوابة:** لو `validate-content.mjs` طلّع أي `FAIL` → **قف**. الغلط ده على السيرفر تكلفته أضعاف.
لو الجرد لقى داتا مستوردة قبل كده → **قف واسأل**: تحديث (السكربت idempotent) ولا وقوف؟

---

## M1 — الإضافات

**المرجع:** `WORDPRESS-SETUP.md` قسم 3.
**قاعدة:** أكتر الإضافات نازلة أصلًا. **متعملش install لحاجة موجودة** — كمّل الناقص بس.

1. الناقص من `woocommerce`, `wp-graphql`, `wp-graphql-jwt-authentication`, `advanced-custom-fields` → `wp plugin install <name> --activate` (🟢).
2. `wpgraphql-acf` + `wp-graphql-woocommerce`: مش في مستودع ووردبريس. لو الـ zip **مش** في `/tmp` → ⏸ **قف واطلب من المستخدم يرفعهم** (قسم 3.2). **متجيبهمش من أي مصدر تاني ومتحاولش curl من GitHub بدون إذن.**
3. **ترتيب التنشيط إلزامي:** `wpgraphql-acf` **بعد** WPGraphQL و ACF. لو كانت مفعّلة قبلهم → ⏸ اسأل قبل `deactivate && activate`.
4. إضافات 3.4 (Wordfence / UpdraftPlus / Redis) → 🟡 اسأل، متنصّبهاش من نفسك. وممنوع أي إضافة كاش صفحات.

**تحقق (لازم يطلع بالحرف):**

```bash
wp plugin list --status=active --field=name
```

المتوقع الستة: `advanced-custom-fields` (أو `-pro`) / `woocommerce` / `wp-graphql` / `wp-graphql-jwt-authentication` / `wp-graphql-woocommerce` / `wpgraphql-acf`.

**ملاحظة PRO:** لو `advanced-custom-fields` المجانية → شاشة **Site Settings** مش هتظهر (طبيعي، قسم 3.2). **متقترحش ترقية ولا تنزّل PRO** — اكتبها في التقرير بس.

---

## M2 — ثوابت wp-config

**المرجع:** قسم 4.

1. `GRAPHQL_JWT_AUTH_SECRET_KEY`: لو **موجود** → **متلمسوش** (تغييره بيلغي كل الجلسات). لو **ناقص**، نفّذ كده — من غير طبع:

```bash
cd /var/www/cms.alifleet.com
wp config set GRAPHQL_JWT_AUTH_SECRET_KEY "$(openssl rand -base64 64 | tr -d '\n')" --type=constant
```

2. باقي ثوابت 4.2 بالحرف: `WP_MEMORY_LIMIT`, `WP_MAX_MEMORY_LIMIT`, `DISALLOW_FILE_EDIT`, `WP_AUTO_UPDATE_CORE`, `WP_ENVIRONMENT_TYPE`. **زيادة ولا نقصان = ممنوع.**

**تحقق:**

```bash
wp eval 'echo defined("GRAPHQL_JWT_AUTH_SECRET_KEY") ? "JWT key OK\n" : "JWT KEY MISSING\n";'
wp config list --fields=name | grep -E 'MEMORY|ENVIRONMENT|DISALLOW'
```

> ⚠️ `wp config list --fields=name,value` بيطبع أسرار. الـ agent يستخدم `--fields=name` بس.
> المفتاح **ممنوع** يظهر في أي رسالة. لو المستخدم عايز نسخة احتياطية، هو اللي يجيبها بنفسه بـ `wp config get GRAPHQL_JWT_AUTH_SECRET_KEY`.

---

## M3 — mu-plugin

**المرجع:** قسم 5. **إلزامي قبل M4** — لو ACF اتستوردت قبله، 9 مجموعات من 10 هتضيّع قواعد موقعها.

```bash
scp wordpress/mu-plugin/alifleet-cms.php AGENT_USER@SERVER_IP:/tmp/
# على السيرفر
cd /var/www/cms.alifleet.com && mkdir -p wp-content/mu-plugins
cp /tmp/alifleet-cms.php wp-content/mu-plugins/
php -l wp-content/mu-plugins/alifleet-cms.php    # لازم: No syntax errors detected
```

عدّل `ALIFLEET_ALLOWED_ORIGINS` للدومينات الحقيقية. **ممنوع `*`** — بيكسر تسجيل الدخول بالكوكيز.

**تحقق:**

```bash
wp eval 'echo post_type_exists("import_car") ? "CPT OK\n" : "CPT MISSING\n";'
```

`CPT MISSING` → **قف**. معناه الملف مش بيتحمّل (صلاحيات/مسار/خطأ PHP)، و M4 هتضيع لو كمّلت.

---

## M4 — استيراد ACF schema

**المرجع:** قسم 6.

```bash
scp wordpress/acf/alifleet-acf-schema.json AGENT_USER@SERVER_IP:/tmp/
# على السيرفر
cd /var/www/cms.alifleet.com
wp acf import --json_file=/tmp/alifleet-acf-schema.json
```

**تحقق:** لازم **10 مجموعات** (قسم 6.3) وكلها `show_in_graphql`.
لو طلعوا 8 أو 9 → **قف**: يعني إما الملف قديم إما mu-plugin مش شغال (M3).
**ممنوع** تعديل الـ JSON على السيرفر عشان "يعدّي".

---

## M5 — استيراد الداتا 🚪

**المرجع:** قسم 7 — **الطريقة أ فقط**. الطريقة ب (CSV + WP All Import) **مش** للـ agent، ولا تتعمل مع أ أبدًا.

**5.1 الرفع + ترتيب الصور (الفخ المعروف):**

```bash
scp wordpress/scripts/alifleet-import.php AGENT_USER@SERVER_IP:/tmp/
scp wordpress/scripts/seed-data.json      AGENT_USER@SERVER_IP:/tmp/
scp -r public/images                      AGENT_USER@SERVER_IP:/tmp/nextjs-public-images
# على السيرفر — الترتيب ده إلزامي وإلا كل الصور هتفشل
mkdir -p /tmp/nextpublic && mv /tmp/nextjs-public-images /tmp/nextpublic/images
```

**5.2 dry-run (🟢 مسموح دايمًا):**

```bash
cd /var/www/cms.alifleet.com
wp eval-file /tmp/alifleet-import.php --seed=/tmp/seed-data.json --images=/tmp/nextpublic --dry-run
```

**5.3 🚪 بوابة إذن:** اعرض ملخص الـ dry-run (كام create / كام update / كام `Image not found`) واستنى موافقة.
أي `Image not found` → **صلّح المسار وأعد الجاف**، متكمّلش على التنفيذ الحقيقي.

**5.4 التنفيذ (بعد الموافقة بس):** نفس الأمر بدون `--dry-run`. المتوقع سطر زي `Success: created 31, updated 0, media uploaded 24, skipped 0`.

**5.5 تحقق (قسم 7.أ.5):** أوامر العدّ 6 / 7 / 12 / 6، وحقول الهوم، وإعدادات الموقع، وأسماء المنتجات بالـ3 لغات.
**أي `EMPTY` في أسماء المنتجات = فشل** → قف وبلّغ (الحل في الدليل: إعادة `wp acf import` ثم إعادة السكربت — بإذن).

> السكربت **idempotent** وبيحمي `post_content` — فالإعادة آمنة. ومع ذلك الإعادة تفضل 🟡 ASK.

---

## M6 — WooCommerce

**المرجع:** قسم 9.

- 9.1 → 9.3 (العملة `ILS`، البلد، صفحات السلة/الحساب، الشحن) 🟢.
- 9.4 **بوابات الدفع** 🟡 — أي مفاتيح دفع أو تفعيل بوابة = إذن صريح. **متحطّش مفاتيح تجريبية من عندك.**
- ممنوع تشغيل onboarding wizard أو تنصيب إضافات Woo إضافية.

**تحقق:** `wp option get woocommerce_currency` = `ILS`، وصفحات السلة/الحساب موجودة (9.6).

---

## M7 — تحقق GraphQL

**المرجع:** قسم 13.1 → 13.3.

- الكويريات بـ `curl`. لو SSL/DNS لسه مش جاهزين → **اختبر محليًا** عبر `curl -H 'Host: cms.alifleet.com' http://127.0.0.1/graphql`. **ممنوع** تلمس nginx أو certbot عشان تخلّي الاختبار يمشي.
- 13.4 (اختبار المصادقة) محتاج إنشاء يوزر تجريبي → 🟡 **إذن**. لو اتوافق: الاسم لازم يبدأ بـ `agenttest_`، والحذف بعدها **إذن تاني**.
- 13.5 (من الفرونت) و13.6 → **مش شغل الـ agent** (الفرونت مش مرفوع بقرار).
- 13.7 القايمة النهائية: املأها وحدّد الـ ❌ اللي بره نطاقك بوضوح.

**عند أي فشل:** روح لقسم 14 (حل المشاكل) واستخدم **الحل المكتوب بس**. لو الحل بيتطلب أمر 🟡 → اسأل. ممنوع اجتهاد بره القسم 14.

---

## M8 — التسليم ⛔ الوقوف النهائي

الـ agent **ما بيعملش** أي حاجة من القسم 10. بيسلّم التقرير النهائي وبس:

```
✅ اكتمل: M1 … M7
📋 قيم متغيرات البيئة الجاهزة (للمستخدم ينفّذها بنفسه — قسم 10.2):
   WORDPRESS_GRAPHQL_ENDPOINT=https://cms.alifleet.com/graphql
   NEXT_PUBLIC_SITE_URL=https://alifleet.com
⛔ خارج نطاقي بقرار منك: القسم 10 (رفع/بناء/pm2) — القسم 11 (nginx/SSL) — القسم 12 (تحويل الدومين)
🔍 حالة nginx/SSL/DNS كما رصدتها: <معلومة فقط>
⚠️ ملاحظات ومخاطر مفتوحة: <...>
🔑 أسرار: مفيش سر واحد اتطبع في أي رسالة
```

---

## 3) قواعد سلوك ثابتة (سارية في كل مهمة)

1. **أمر واحد له غرض واحد.** ممنوع سلاسل `&&` طويلة تخبّي خطوة خطرة في وسطها.
2. **قبل أي أمر كتابة:** قول المهمة (`[M4]`)، الأمر، والناتج المتوقع. بعده: الناتج الفعلي.
3. **الفشل بيوقف الخط.** ممنوع إعادة المحاولة بأمر أقوى (`sudo`, `--force`, `--skip-*`) — ممنوع `--force` و`--allow-root` أساسًا.
4. **ممنوع الافتراض.** المسار مش `/var/www/cms.alifleet.com`؟ نسخة PHP مش 8.2؟ → بلّغ واستنى، متتصرّفش.
5. **سجل على السيرفر:** كل أمر كتابة يتسجّل بـ `>> ~/alifleet-agent.log` مع التاريخ. السجل مفيهوش أسرار.
6. **الملفات المؤقتة تفضل في `/tmp`.** ممنوع تنضيف بـ `rm` — سيبها.
7. **التقرير بعد كل مهمة** بالشكل ده:

```
[M4] استيراد ACF schema — ✅ تمّت
الأوامر: wp acf import --json_file=/tmp/alifleet-acf-schema.json
التحقق:  10 مجموعات ✓ / show_in_graphql ✓
التالي:  M5 — محتاج إذنك عند خطوة 5.3
```

8. **ممنوع تعديل ملفات الخطط دي** (`docs/*.md`) أو ملفات `wordpress/` المصدرية. لو لقى غلط في الخطة: يبلّغ.
9. **ممنوع الربط بالكود.** `ACF-WIRING-PLAN.md` مرحلة تانية بتتعمل في v0 على المستودع، مش على السيرفر.
10. **الأسرار.** ممنوع `cat wp-config.php`، ممنوع `wp config list --fields=name,value`، ممنوع طبع أي مفتاح. لو سر ظهر في ناتج أمر بالغلط: يقول "الناتج فيه سر — محجوب" ويكمّل.

---

## 4) خريطة الملفات — مين يقرأ إيه

| الملف | دوره للـ agent | إذن التعديل |
|---|---|---|
| `docs/AGENT-RUNBOOK.md` | **الحاكم.** الترتيب + الحدود + البوابات | قراءة فقط |
| `docs/AGENT-PROMPT.md` | البرومبت الجاهز اللي المستخدم بيحقنه في الـ agent | قراءة فقط |
| `docs/WORDPRESS-SETUP.md` | **المرجع التقني.** الأوامر بالحرف — بس الترتيب من الرَنبوك | قراءة فقط |
| `docs/PLAN.md` | خلفية: إيه اللي اتبنى وليه | قراءة فقط |
| `docs/ACF-FREE-CONVERSION-PLAN.md` | خلفية: ليه مفيش repeaters | قراءة فقط |
| `docs/ACF-WIRING-PLAN.md` | **مرحلة تانية — خارج النطاق تمامًا** | ممنوع التنفيذ |
| `wordpress/server/alifleet-agent.sudoers` | صلاحيات اليوزر المؤقت — المستخدم بيركّبها | ممنوع التعديل |
| `wordpress/server/agent-preflight.sh` | جرد M0، قراءة فقط | قراءة فقط |
| `wordpress/{acf,mu-plugin,scripts,import}/*` | حمولة الرفع | ممنوع التعديل |

---

## 5) جدول القرار السريع (لو الـ agent اتحيّر)

| الحالة | القرار |
|---|---|
| الأمر بيقرأ بس | 🟢 نفّذ |
| الأمر بيكتب وموجود بالحرف في الرَنبوك | 🟢 نفّذ + تحقق |
| الأمر بيكتب وموجود في `WORDPRESS-SETUP.md` بس مش في الرَنبوك | 🟡 اسأل |
| الأمر بيلمس DB / nginx / SSL / دومين / يوزرات | 🟡 اسأل |
| الأمر جزء من القسم 10 أو 11 أو 12 | 🔴 ارفض واذكر إنه خارج نطاقك |
| تحقق فشل | ⛔ قف، بلّغ، متجرّبش تاني |
| الحقيقة على السيرفر مخالفة للدليل | ⛔ قف وبلّغ بالفرق |
| المستخدم طلب حاجة في منطقة 🔴 | نبّه إنها خارج النطاق واطلب تأكيد صريح بالاسم |

---

*آخر تحديث: إضافة نمط تشغيل الـ agent. نقطة البداية للتنفيذ اليدوي بردو: `docs/WORDPRESS-SETUP.md`.*
