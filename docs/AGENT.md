# AGENT.md — الملف الوحيد للـ agent

> **لو انت agent:** الملف ده كل حاجة. الأوامر كلها جواه. **متفتحش أي ملف `.md` تاني** — مفيش داعي.
> ابدأ من **الجزء ب**. اقرأه لآخره قبل أول أمر.
>
> **لو انت المستخدم:** الجزء أ ده بتاعك — 4 خطوات وخلاص.

---
---

# الجزء أ — للمستخدم (4 خطوات)

## 1) اعمل اليوزر المؤقت

من جهازك:

```bash
scp wordpress/server/agent-user.sh wordpress/server/alifleet-agent.sudoers deploy@YOUR_SERVER_IP:/tmp/
```

على السيرفر:

```bash
ssh deploy@YOUR_SERVER_IP
cd /tmp && sudo bash agent-user.sh create
```

هيطبعلك في الآخر `ssh afagent@IP` + الباسورد. **انسخهم فورًا** — الباسورد بيتعرض مرة واحدة بس.

## 2) خُد نسخة احتياطية

```bash
cd /var/www/cms.alifleet.com
wp db export ~/backup-$(date +%F).sql
cp wp-config.php ~/wp-config.php.bak
```

## 3) دي اللي تقولها للـ agent

افتحله التيرمينال ومجلد المشروع، وقوله:

> بيانات الدخول: `ssh afagent@<IP>` باسورد `<الباسورد>`
> اقرأ `docs/AGENT.md` بالكامل ونفّذ المهام M0 → M8 بالترتيب. متخرجش عن حدود الملف.

## 4) وانت شغال

| عايز | الأمر |
|---|---|
| تشوف بيعمل إيه | `sudo bash /tmp/agent-user.sh status` |
| **تقطعه فورًا** | `sudo bash /tmp/agent-user.sh revoke` |
| تمسحه لما يخلّص | `sudo bash /tmp/agent-user.sh delete` |

**بعد `delete`:** غيّر باسورد قاعدة البيانات — الـ agent كان شايف `wp-config.php`.

---
---

# الجزء ب — للـ agent

## 1) المهمة والحدود

| بند | القيمة |
|---|---|
| **هدفك** | WordPress على `cms.alifleet.com` يبقى: الإضافات مفعّلة + ثوابت `wp-config` + mu-plugin + ACF (10 مجموعات) + الداتا مستوردة + WooCommerce مضبوط + GraphQL بيرجّع كل الحقول |
| **آخر حاجة مسموحة** | التحقق من GraphQL (M7) + كتابة قيم متغيرات البيئة في تقريرك (M8) |
| **الخط الأحمر** | ❌ ممنوع رفع/بناء/تشغيل مشروع Next.js على السيرفر — ❌ ممنوع nginx — ❌ ممنوع SSL/certbot — ❌ ممنوع تحويل الدومين |
| **مبدأك** | انت **بتنفّذ**، مش **بتخترع**. أي انحراف عن المكتوب هنا = وقوف وسؤال |
| **مسار العمل** | `/var/www/cms.alifleet.com` — لو مختلف: **قف وبلّغ**، متتصرّفش |
| **ملفات المشروع** | موجودة local على جهاز المستخدم وانت شايفها. الرفع للسيرفر بـ `scp` |

### الوضع الحالي المؤكَّد (مش افتراض)

| البند | الحالة | معناه ليك |
|---|---|---|
| VPS | ✅ شغال | متعملش `apt` / `ufw` / mysql / php — تحقق بس |
| WordPress | ✅ منصَّب | متعملش `wp core install` ولا `wp config create` |
| الإضافات | ⚠️ أكترها نازلة | M1 = جرد + إكمال الناقص، **مش** تنصيب من الصفر |
| قاعدة البيانات | ✅ فيها داتا | أي أمر يلمسها = محتاج إذن |
| ACF / الداتا | ❓ مجهول | تحقق في M0 قبل أي استيراد |
| nginx / SSL / الدومين | ❓ مجهول | **مش شغلك.** بلّغ بالحالة وبس |

---

## 2) قانون الحدود — صنّف كل أمر قبل تنفيذه

**أمر مش مذكور في الجداول دي = 🟡 اسأل.** مفيش استثناء.

### 🟢 ALLOW — نفّذ لوحدك

- **قراءة WP-CLI:** `wp plugin list`, `wp option get`, `wp post list`, `wp user list`, `wp config list --fields=name`, `wp core version`, `wp post-type list`
- **قراءة النظام:** `ls`, `cat`, `grep`, `tail`, `df -h`, `php -v`, `php -l`, `node -v`, `nginx -t`, `systemctl status *`, `curl` على localhost
- **الإضافات:** `wp plugin install` / `activate` **للقايمة في M1 بس** + `unzip` للـ zip اللي المستخدم رفعه
- **الثوابت:** `wp config set` **للثوابت في M2 بالحرف بس**
- **mu-plugin:** `cp` لـ `wp-content/mu-plugins/`
- **ACF:** `wp acf import`
- **الاستيراد الجاف:** `wp eval-file ... --dry-run`
- **WooCommerce:** `wp option update woocommerce_*` **للمذكور في M6 بس**
- **التحقق:** `wp eval` **بكود قراءة فقط** (`get_field` / `get_option` / `echo`) + `curl` لـ GraphQL
- **الملفات:** `scp` لـ `/tmp`, `mkdir -p`, `chmod` جوه مسار العمل

### 🟡 ASK — قف واستنى موافقة

| الحاجة | ليه |
|---|---|
| **الاستيراد الحقيقي** (`eval-file` بدون `--dry-run`) | أول كتابة جماعية في DB |
| **أي `wp db *`** (`export`/`import`/`query`/`cli`) | لمس مباشر لقاعدة البيانات |
| **أي `wp eval` فيه كتابة** (`update_field`, `update_option`, `wp_insert_post`) | كتابة غير موثّقة |
| `apt install` / `apt upgrade` | تغيير بيئة شغالة |
| `wp core update` / `wp plugin update` / `delete` / `wp theme *` | ممكن يكسر توافق WPGraphQL |
| `wp user create` / `delete` / تغيير باسورد | حسابات وصلاحيات |
| `chown` / `chmod -R` بره مسار العمل | خروج عن النطاق |
| أي إضافة مش في قايمة M1 | مفيش إضافات باجتهاد شخصي |
| بوابات دفع WooCommerce أو أي مفتاح دفع | فلوس حقيقية |
| **أي حاجة انت مش متأكد منها 100%** | القاعدة الافتراضية |

**اسأل بالشكل ده بالحرف:**

```
⏸ محتاج إذن — [Mx: اسم الخطوة]
الأمر:      <الأمر بالحرف>
بيعمل إيه:  <سطر واحد>
لو غلط:     <أسوأ نتيجة>
مستني موافقتك.
```

### 🔴 DENY — ممنوع مطلقًا

**"كمّل" أو "اعمل اللي لازم" مش إذن هنا.** لازم المستخدم يقول اسم الحاجة صريح.

1. ❌ **رفع مشروع Next.js:** `git clone` للمشروع على السيرفر، `pnpm install`, `pnpm build`, `pm2`, كتابة `.env.production`, `ecosystem.config.cjs`. **انت بتكتب القيم في التقرير وخلاص.**
2. ❌ **nginx:** تعديل أي ملف في `/etc/nginx/`, `systemctl reload/restart nginx`. (`nginx -t` للفحص مسموح.)
3. ❌ **SSL:** `certbot` بأي شكل.
4. ❌ **تحويل الدومين:** `wp search-replace`, تغيير `siteurl` / `home`, أي حاجة في DNS. أخطر خطوة في المشروع كله.
5. ❌ `rm -rf` بأي شكل، و`rm` على أي حاجة بره `/tmp`.
6. ❌ `mysql` / `mysqldump` / `mariadb` مباشر، وأي `DROP` / `TRUNCATE` / `DELETE`.
7. ❌ `sudo su`, `su -`, `visudo`, تعديل `/etc/sudoers*`, إضافة يوزر, `authorized_keys`, `ufw`.
8. ❌ **تسريب أسرار:** `cat wp-config.php`, `wp config list --fields=name,value`, طبع `GRAPHQL_JWT_AUTH_SECRET_KEY` أو باسورد DB أو أي مفتاح. الأسرار تتولّد وتتحط في **نفس الأمر** من غير `echo`.
9. ❌ `git commit` / `git push`, أو تعديل `app/` أو `lib/` أو `components/` — الربط بالكود مرحلة تانية بتتعمل في v0، مش هنا.
10. ❌ تعديل `wordpress/acf/alifleet-acf-schema.json` أو `seed-data.json` أو أي ملف `docs/*.md`. لقيت غلط؟ **بلّغ وقف.**
11. ❌ حذف أو تعطيل إضافة شغالة. وممنوع أي إضافة كاش صفحات.
12. ❌ **الاستمرار بعد فشل تحقق.** الفشل = وقوف، مش محاولة تانية بأمر أقوى.

### صلاحياتك الفعلية

| البند | الوضع |
|---|---|
| مجموعة `sudo` | ❌ **مش** فيها. صلاحياتك من `/etc/sudoers.d/alifleet-agent` بس |
| أوامر sudo المتاحة | `systemctl status`, `nginx -t/-T/-v`, `tail` للوجات, `chown/chmod` جوه `wp-content`, `systemctl reload php8.2-fpm`. **بس.** |
| كتابة الملفات | `plugins` + `mu-plugins` + `uploads` (عبر مجموعة `www-data`). **مفيش** كتابة على ملفات الـ core |
| `wp-config.php` | 664 — تقدر تعدّل ثوابت M2. **ممنوع تطبع محتواه أو تستخدم بيانات DB اللي جواه** |
| انتهاء الحساب | تلقائي بعد 3 أيام |
| المراقبة | كل أمر `sudo` بيتسجّل في `/var/log/auth.log` والمستخدم شايفه لحظيًا وبيقدر يقطعك في أي لحظة |

**معظم شغلك مش محتاج `sudo` أصلًا** — `wp-*` و `unzip` و `cp` و `php -l` كلها بتشتغل من غيره. **لو احتجت `sudo` لأمر مش في القايمة → دي إشارة إنك خرجت عن نطاقك. قف واسأل، متدوّرش على طريقة تلف بيها.**

---

## 3) قواعد سلوك سارية في كل مهمة

1. **أمر واحد له غرض واحد.** ممنوع سلاسل `&&` طويلة تخبّي خطوة خطرة في وسطها.
2. **قبل أي أمر كتابة:** قول المهمة (`[M4]`) + الأمر + الناتج المتوقع. بعده: الناتج الفعلي.
3. **ممنوع `--force` و `--allow-root` و `--skip-*`** — أصلًا، مش بس عند الفشل.
4. **ممنوع الافتراض.** المسار مختلف؟ PHP مش 8.2؟ → بلّغ واستنى.
5. **سجّل:** كل أمر كتابة `>> ~/alifleet-agent.log` مع التاريخ. السجل مفيهوش أسرار.
6. **الملفات المؤقتة تفضل في `/tmp`** — سيبها، متنضّفش بـ `rm`.
7. **لو سر ظهر في ناتج أمر بالغلط:** قول "الناتج فيه سر — محجوب" وكمّل.
8. **تقرير بعد كل مهمة:**

```
[M4] استيراد ACF schema — ✅ تمّت
الأوامر: wp acf import --json_file=/tmp/alifleet-acf-schema.json
التحقق:  10 مجموعات ✓
التالي:  M5 — محتاج إذنك عند خطوة 5.3
```

---

## 4) المهام — الترتيب إلزامي

```
M0  الجرد (قراءة فقط)   ──▶ 🚪 تقرير + موافقة
M1  الإضافات            ──▶ ✔ 6 مفعّلين
M2  ثوابت wp-config      ──▶ ✔ JWT key OK
M3  mu-plugin           ──▶ ✔ CPT OK
M4  ACF schema          ──▶ ✔ 10 مجموعات
M5  الداتا              ──▶ 🚪 dry-run ثم إذن ثم تنفيذ
M6  WooCommerce         ──▶ ✔ ILS + الصفحات
M7  تحقق GraphQL        ──▶ ✔ كل الكويريات بترجّع داتا
M8  التسليم             ──▶ ⛔ وقوف نهائي
```

**قاعدة الانتقال:** مفيش مهمة تبدأ قبل ما تحقق اللي قبلها يطلع **بالناتج المتوقع بالحرف**. مفيش "شكلها ماشية".

---

### M0 — الجرد (قراءة فقط) 🚪

مفيش أمر كتابة واحد هنا.

```bash
# على جهاز المستخدم
node wordpress/scripts/validate-content.mjs

# ارفع سكربت الجرد وشغّله
scp wordpress/server/agent-preflight.sh afagent@SERVER_IP:/tmp/
ssh afagent@SERVER_IP 'bash /tmp/agent-preflight.sh'
```

سلّم التقرير ده وقف:

| بند | المطلوب |
|---|---|
| مسار WordPress | المسار الفعلي |
| إصدارات | WP / PHP / MariaDB / WP-CLI |
| الإضافات | قايمة كاملة + إيه الناقص من الستة |
| ACF | مجموعات موجودة؟ العدد؟ |
| CPT | `import_car` موجود؟ |
| الداتا | عدد الصفحات / `import_car` / `product` / `post` |
| ثوابت | `GRAPHQL_JWT_AUTH_SECRET_KEY` موجود؟ (اكتب **موجود/مش موجود** — متطبعش القيمة) |
| nginx / SSL / DNS | الحالة **للعلم بس** |
| المدقّق المحلي | ناتج `validate-content.mjs` |
| مخاطر | أي حاجة مخالفة للمتوقع |

**بوابة:** أي `FAIL` من `validate-content.mjs` → **قف**. لقيت داتا مستوردة قبل كده → **قف واسأل**.

---

### M1 — الإضافات

**متعملش install لحاجة موجودة.** كمّل الناقص بس.

```bash
cd /var/www/cms.alifleet.com

# الناقص من دول بس (🟢)
wp plugin install woocommerce --activate
wp plugin install wp-graphql --activate
wp plugin install wp-graphql-jwt-authentication --activate
wp plugin install advanced-custom-fields --activate
```

**التنين دول مش في مستودع ووردبريس** (`wpgraphql-acf` + `wp-graphql-woocommerce`). لو الـ zip **مش** في `/tmp` → ⏸ **قف واطلب من المستخدم يرفعهم**. ممنوع تجيبهم من أي مصدر تاني أو `curl` من GitHub بدون إذن.

```bash
cd /var/www/cms.alifleet.com/wp-content/plugins
unzip /tmp/wpgraphql-acf.zip
unzip /tmp/wp-graphql-woocommerce.zip
cd /var/www/cms.alifleet.com
wp plugin activate wpgraphql-acf wp-graphql-woocommerce
```

**ترتيب التنشيط إلزامي:** `wpgraphql-acf` **بعد** WPGraphQL و ACF. لو كانت مفعّلة قبلهم → ⏸ اسأل قبل `deactivate && activate`.

**تحقق — لازم الستة:**

```bash
wp plugin list --status=active --field=name
```

`advanced-custom-fields` (أو `-pro`) / `woocommerce` / `wp-graphql` / `wp-graphql-jwt-authentication` / `wp-graphql-woocommerce` / `wpgraphql-acf`

> **لو ACF المجانية:** شاشة Site Settings مش هتظهر — **ده طبيعي ومقبول**. الإعدادات بتتكتب في `wp_options` من سكربت M5 وGraphQL بيقراها عادي. **متقترحش ترقية ومتنزّلش PRO.** اكتبها في التقرير وبس.
>
> **Wordfence / UpdraftPlus / Redis:** 🟡 اسأل، متنصّبهاش من نفسك.

---

### M2 — ثوابت wp-config

**`GRAPHQL_JWT_AUTH_SECRET_KEY` موجود؟ متلمسوش** — تغييره بيلغي كل الجلسات المفتوحة. لو ناقص، نفّذ كده — من غير طبع القيمة:

```bash
cd /var/www/cms.alifleet.com
wp config set GRAPHQL_JWT_AUTH_SECRET_KEY "$(openssl rand -base64 64 | tr -d '\n')" --type=constant
```

باقي الثوابت بالحرف — **زيادة ولا نقصان ممنوع**:

```bash
wp config set WP_MEMORY_LIMIT '512M' --type=constant
wp config set WP_MAX_MEMORY_LIMIT '512M' --type=constant
wp config set DISALLOW_FILE_EDIT true --raw --type=constant
wp config set WP_AUTO_UPDATE_CORE 'minor' --type=constant
wp config set WP_ENVIRONMENT_TYPE 'production' --type=constant
```

**تحقق:**

```bash
wp eval 'echo defined("GRAPHQL_JWT_AUTH_SECRET_KEY") ? "JWT key OK\n" : "JWT KEY MISSING\n";'
wp config list --fields=name | grep -E 'MEMORY|ENVIRONMENT|DISALLOW'
```

> ⚠️ استخدم `--fields=name` **بس**. `--fields=name,value` بيطبع الأسرار = مخالفة. لو المستخدم عايز نسخة من المفتاح، هو يجيبها بنفسه.

---

### M3 — mu-plugin

**إلزامي قبل M4.** لو ACF اتستوردت قبله، 9 مجموعات من 10 هتضيّع قواعد موقعها.

```bash
scp wordpress/mu-plugin/alifleet-cms.php afagent@SERVER_IP:/tmp/
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

`CPT MISSING` → **قف**. الملف مش بيتحمّل (صلاحيات/مسار/خطأ PHP)، و M4 هتضيع لو كمّلت.

---

### M4 — ACF schema

```bash
scp wordpress/acf/alifleet-acf-schema.json afagent@SERVER_IP:/tmp/
# على السيرفر
cd /var/www/cms.alifleet.com
wp acf import --json_file=/tmp/alifleet-acf-schema.json
```

**تحقق:** لازم **10 مجموعات** وكلها `show_in_graphql`.
طلعوا 8 أو 9 → **قف**: يعني الملف قديم أو mu-plugin مش شغال (M3). **ممنوع** تعدّل الـ JSON عشان "يعدّي".

---

### M5 — الداتا 🚪

**5.1 الرفع + ترتيب الصور** (الترتيب ده إلزامي وإلا كل الصور هتفشل):

```bash
scp wordpress/scripts/alifleet-import.php afagent@SERVER_IP:/tmp/
scp wordpress/scripts/seed-data.json      afagent@SERVER_IP:/tmp/
scp -r public/images                      afagent@SERVER_IP:/tmp/nextjs-public-images
# على السيرفر
mkdir -p /tmp/nextpublic && mv /tmp/nextjs-public-images /tmp/nextpublic/images
```

**5.2 dry-run** (🟢):

```bash
cd /var/www/cms.alifleet.com
wp eval-file /tmp/alifleet-import.php --seed=/tmp/seed-data.json --images=/tmp/nextpublic --dry-run
```

**5.3 🚪 بوابة:** اعرض ملخص الجاف (كام create / كام update / كام `Image not found`) واستنى موافقة.
أي `Image not found` → **صلّح المسار وأعد الجاف**. متكمّلش على التنفيذ الحقيقي.

**5.4 التنفيذ** (بعد الموافقة بس): نفس الأمر بدون `--dry-run`.
المتوقع: `Success: created 31, updated 0, media uploaded 24, skipped 0`

**5.5 تحقق:**

```bash
wp post list --post_type=page       --fields=ID,post_name,post_status
wp post list --post_type=import_car --format=count   # 7
wp post list --post_type=product    --format=count   # 12
wp post list --post_type=post       --format=count   # 6

# حقول الهوم
wp eval '
$id = (int) get_option("page_on_front");
$hero = get_field("hero_section", $id);
echo "front page: $id\n";
echo "line1 en: " . ($hero["hero_line1_en"] ?? "EMPTY") . "\n";
$filled = 0;
for ($i = 1; $i <= 5; $i++) { if (!empty($hero["hero_slide_$i"]["slide_label_en"])) $filled++; }
echo "slides filled: $filled / 5\n";'

# إعدادات الموقع
wp eval '
$c = get_field("company_info","option");
$lines = 0;
for ($i = 1; $i <= 3; $i++) { if (!empty($c["address_line_$i"]["line_en"])) $lines++; }
echo ($c["company_name_en"] ?? "EMPTY") . " | address lines: $lines / 3\n";'

# أسماء المنتجات بالـ3 لغات — لازم مفيش ولا EMPTY
wp eval '
foreach (get_posts(["post_type" => "product", "numberposts" => -1]) as $p) {
  printf("%-34s ar:%-3s en:%-3s he:%-3s\n", $p->post_name,
    get_field("name_ar", $p->ID) ? "ok" : "EMPTY",
    get_field("name_en", $p->ID) ? "ok" : "EMPTY",
    get_field("name_he", $p->ID) ? "ok" : "EMPTY");
}'
```

**أي `EMPTY` في الأمر الأخير = فشل** → قف وبلّغ. (السبب: schema قديمة. الحل إعادة `wp acf import` ثم إعادة السكربت — **بإذن**.)

> السكربت idempotent وبيحمي `post_content`، فالإعادة آمنة — ومع ذلك تفضل 🟡 ASK.
> **ممنوع** تستخدم طريقة CSV / WP All Import. المسار ده بس.

---

### M6 — WooCommerce

```bash
cd /var/www/cms.alifleet.com

wp option update woocommerce_store_address "Industrial Zone, Building 12"
wp option update woocommerce_store_city "Haifa"
wp option update woocommerce_default_country "IL"
wp option update woocommerce_currency "ILS"
wp option update woocommerce_currency_pos "right"
wp option update woocommerce_price_decimal_sep "."
wp option update woocommerce_price_thousand_sep ","
wp option update woocommerce_price_num_decimals 2
wp option update woocommerce_weight_unit "kg"
wp option update woocommerce_dimension_unit "cm"

wp option update woocommerce_enable_guest_checkout "yes"
wp option update woocommerce_enable_checkout_login_reminder "yes"
wp option update woocommerce_enable_myaccount_registration "yes"
wp option update woocommerce_registration_generate_password "no"
```

`ILS` لازم تطابق `₪` في `commerce_settings.currency_symbol` — لو مختلفين، بطاقة القطعة هتعرض رمز والسلة رمز تاني.

**بره صلاحيتك:** الشحن (محتاج لوحة تحكم — اكتبها في التقرير للمستخدم)، بوابات الدفع 🟡 إذن، onboarding wizard ❌، إضافات Woo إضافية ❌.

**تحقق:**

```bash
wp option get woocommerce_currency          # ILS
wp post list --post_type=page --fields=post_name | grep -E 'cart|checkout|account'
```

---

### M7 — تحقق GraphQL

```bash
curl -s -X POST https://cms.alifleet.com/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ generalSettings { title url } }"}'

curl -s -X POST https://cms.alifleet.com/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ importCars(first: 3) { nodes { slug title } } }"}'

curl -s -X POST https://cms.alifleet.com/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ siteOptions { siteOptionsFields { companyInfo { companyNameEn phoneNumber } commerceSettings { currencySymbol } } } }"}'

curl -s -X POST https://cms.alifleet.com/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ page(id: \"home\", idType: URI) { title homePageFields { heroSection { heroLine1Ar heroLine1En } } } }"}'
```

| الناتج | معناه |
|---|---|
| `Cannot query field "importCars"` | mu-plugin مش متحمّلة → ارجع لـ M3 |
| حقول ACF بترجّع `null` | `wpgraphql-acf` مش مفعّلة أو ترتيبها غلط → M1 |
| أسماء حقول مختلفة | WPGraphQL بيحوّل لـ camelCase وشكل التعشيش يختلف بحسب النسخة. **أكّد الأسماء من GraphiQL IDE في لوحة التحكم** قبل ما تقول فشل |

**لو SSL/DNS لسه مش جاهزين:** اختبر محليًا:

```bash
curl -s -X POST http://127.0.0.1/graphql -H 'Host: cms.alifleet.com' -H 'Content-Type: application/json' \
  -d '{"query":"{ generalSettings { title } }"}'
```

**ممنوع** تلمس nginx أو certbot عشان تخلّي الاختبار يمشي. الفشل من بره = بلّغ وبس.

اختبار المصادقة محتاج يوزر تجريبي → 🟡 **إذن**. لو اتوافق: الاسم يبدأ بـ `agenttest_`، والحذف بعدها إذن تاني.
اختبار الفرونت → **مش شغلك** (الفرونت مش مرفوع بقرار).

---

### M8 — التسليم ⛔ وقوف نهائي

سلّم ده وقف. **متعملش ولا خطوة من رفع Next.js.**

```
✅ اكتمل: M1 … M7
📋 قيم متغيرات البيئة (للمستخدم ينفّذها بنفسه):
   WORDPRESS_GRAPHQL_ENDPOINT=https://cms.alifleet.com/graphql
   NEXT_PUBLIC_SITE_URL=https://alifleet.com
⛔ خارج نطاقي بقرار منك: رفع/بناء Next.js — nginx — SSL — تحويل الدومين
🔍 حالة nginx/SSL/DNS كما رصدتها: <معلومة فقط>
📌 محتاج لوحة تحكم: مناطق الشحن في WooCommerce
⚠️ ملاحظات ومخاطر مفتوحة: <...>
🔑 أسرار: مفيش سر واحد اتطبع في أي رسالة
```

---

## 5) جدول القرار السريع (لو اتحيّرت)

| الحالة | القرار |
|---|---|
| الأمر بيقرأ بس | 🟢 نفّذ |
| الأمر بيكتب وموجود بالحرف في الملف ده | 🟢 نفّذ + تحقق |
| الأمر بيكتب ومش موجود في الملف ده | 🟡 اسأل |
| الأمر بيلمس DB / nginx / SSL / دومين / يوزرات | 🟡 اسأل |
| الأمر جزء من رفع Next.js أو nginx أو SSL أو تحويل الدومين | 🔴 ارفض واذكر إنه خارج نطاقك |
| تحقق فشل | ⛔ قف، بلّغ، متجرّبش تاني |
| الحقيقة على السيرفر مخالفة للمكتوب هنا | ⛔ قف وبلّغ بالفرق |
| المستخدم طلب حاجة في منطقة 🔴 | نبّه إنها خارج النطاق واطلب تأكيد صريح بالاسم |
