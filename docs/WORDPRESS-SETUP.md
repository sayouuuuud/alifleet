# دليل التشغيل الكامل — ALI FLEET على VPS

> من أول `ssh` على السيرفر لحد الموقع شغال والـ Next.js بيقرأ من WordPress.
> اتبع الأقسام بالترتيب. كل أمر مكتوب جاهز للنسخ.

> ## 🤖 لو انت agent بتشتغل على السيرفر — اقرأ ده قبل أي أمر
>
> الملف ده **مرجع تقني للأوامر**، مش خطة تنفيذك. خطتك واقتصار صلاحياتك في **`docs/AGENT-RUNBOOK.md`** — اقرأها بالكامل الأول. عند أي تعارض: **الرَنبوك أولًا**.
>
> **الوضع الحالي:** الـ VPS شغال، WordPress منصَّب، وأكتر الإضافات نازلة → **القسم 1 والقسم 2 = تحقق فقط، مش تنفيذ.**
>
> | القسم | صلاحية الـ agent |
> |---|---|
> | 1 — تجهيز الـ VPS | 🔵 تحقق فقط. أي `apt` / `ufw` / MariaDB / إنشاء يوزر = 🟡 إذن |
> | 2 — تنصيب WordPress | 🔵 تحقق فقط. `wp core install` / `wp config create` = ممنوع (متعمل خلاص) |
> | 3 — الإضافات | 🟢 إكمال الناقص من 3.1. الـ zip في 3.2 لو مش مرفوع → 🟡 اطلبه. 3.4 = 🟡 إذن |
> | 4 — wp-config | 🟢 الثوابت المذكورة بالحرف. ممنوع طبع أي قيمة سر |
> | 5 — mu-plugin | 🟢 |
> | 6 — ACF schema | 🟢 |
> | 7 — الداتا | 🟢 الطريقة أ + `--dry-run` / 🟡 التنفيذ الحقيقي بإذن / 🔴 الطريقة ب ممنوعة للـ agent |
> | 8 — المجموعات المرقّمة | 📖 مرجع للفهم — مفيش تنفيذ |
> | 9 — WooCommerce | 🟢 من 9.1 لـ 9.3 / 🟡 بوابات الدفع 9.4 |
> | **10 — رفع Next.js** | 🔴 **ممنوع بالكامل.** الـ agent يجهّز **قيم** 10.2 في تقريره وبس — مفيش clone/install/build/pm2 |
> | **11 — Nginx + SSL** | 🔴 **ممنوع.** `nginx -t` للفحص بس |
> | **12 — تحويل الدومين** | 🔴 **ممنوع.** أخطر قسم في الملف |
> | 13 — الاختبارات | 🟢 من 13.1 لـ 13.3 / 🟡 13.4 (يوزر تجريبي) / ⛔ 13.5 و13.6 بره النطاق |
> | 14 — حل المشاكل | 🟢 الحلول المكتوبة بس. ممنوع اجتهاد بره القسم |
> | النسخ الاحتياطي | 🔴 `wp db` ممنوع على الـ agent. المستخدم بياخد النسخة بنفسه قبل التسليم |

**الشكل النهائي:**

| الدومين | إيه اللي عليه | البورت |
|---|---|---|
| `alifleet.com` + `www` | Next.js (pm2) | 3000 داخليًا |
| `cms.alifleet.com` | WordPress + WooCommerce + لوحة التحكم | PHP-FPM |

**نقطة الاتصال الوحيدة:** `https://cms.alifleet.com/graphql`

---

## فهرس

1. [تجهيز الـ VPS](#1-تجهيز-الـ-vps)
2. [تنصيب WordPress على cms.alifleet.com](#2-تنصيب-wordpress)
3. [الإضافات المطلوبة](#3-الإضافات-المطلوبة)
4. [إعدادات wp-config.php](#4-إعدادات-wp-configphp)
5. [تركيب mu-plugin (لازم قبل ACF)](#5-تركيب-mu-plugin)
6. [استيراد ACF schema](#6-استيراد-acf-schema)
7. [استيراد الداتا](#7-استيراد-الداتا)
8. [فهم المجموعات المرقّمة جوه ACF](#8-فهم-المجموعات-المرقّمة-جوه-acf)
9. [إعداد WooCommerce](#9-إعداد-woocommerce)
10. [رفع Next.js وربطه](#10-رفع-nextjs-وربطه)
11. [Nginx + SSL](#11-nginx--ssl)
12. [تحويل الدومين](#12-تحويل-الدومين)
13. [اختبارات التحقق](#13-اختبارات-التحقق)
14. [حل المشاكل](#14-حل-المشاكل)

---

## قبل ما تبدأ — تحقق محليًا

في مجلد المشروع على جهازك، اشغّل المدقّق. بيتأكد إن كل عمود في ملفات الاستيراد له حقل مطابق في الـ schema، وإن مفيش مفاتيح مكررة، وإن قيم الـ `select` كلها من الاختيارات المسموحة:

```bash
node wordpress/scripts/validate-content.mjs
```

المفروض تشوف:

```
Schema: 10 groups, 456 fields
  ok   pages.csv: 478 columns, 6 rows — OK
  ok   import-cars.csv: 53 columns, 7 rows — OK
  ok   spare-parts.csv: 54 columns, 12 rows — OK
  ok   blog-posts.csv: 17 columns, 6 rows — OK
  ...
All checks passed. Safe to import.
```

لو طلع أي `FAIL` — **متكمّلش**. صلّحه الأول، لأن نفس الغلطة على السيرفر هتاخد وقت أطول بكتير لحد ما تكتشفها.

### خريطة مجلد `wordpress/` — كل ملف وإزاي يتشغّل

مجلد `wordpress/` فيه **١٣ ملف**. الجدول ده بيقول لكل واحد فيهم: بيتحمّل إزاي، وفي أنهي قسم. (آخر ٣ سطور خاصة بتشغيل agent — تجاهلهم لو بتنفّذ بإيدك.)

| الملف | بيوصل للسيرفر إزاي | الأمر اللي بيشغّله | القسم |
|---|---|---|---|
| `acf/alifleet-acf-schema.json` | `scp` لـ `/tmp` | `wp acf import --json_file=...` | **6** |
| `mu-plugin/alifleet-cms.php` | `scp` لـ `/tmp` ثم `cp` لـ `wp-content/mu-plugins/` | بتتحمّل تلقائيًا — مفيش تنشيط | **5** |
| `scripts/alifleet-import.php` | `scp` لـ `/tmp` | `wp eval-file /tmp/alifleet-import.php` | **7.أ** |
| `scripts/seed-data.json` | `scp` لـ `/tmp` | بيتقرأ بـ `--seed=` من السكربت اللي فوق | **7.أ** |
| `scripts/validate-content.mjs` | ❌ **مبيتنسخش خالص** | `node wordpress/scripts/validate-content.mjs` — **على جهازك** | فوق + **13** |
| `import/pages.csv` | رفع من المتصفح (WP All Import) | شاشة All Import → Pages | **7.ب** |
| `import/import-cars.csv` | رفع من المتصفح | شاشة All Import → Import Vehicles | **7.ب** |
| `import/spare-parts.csv` | رفع من المتصفح | شاشة All Import → Products | **7.ب** |
| `import/blog-posts.csv` | رفع من المتصفح | شاشة All Import → Posts | **7.ب** |
| `import/site-settings.json` | `scp` لـ `/tmp` | `wp eval` (أمر جاهز في القسم) | **7.ب.3** |
| `server/agent-preflight.sh` | `scp` لـ `/tmp` | `bash /tmp/agent-preflight.sh` — **قراءة فقط** | جرد M0 في `AGENT-RUNBOOK.md` |
| `server/agent-user.sh` | `scp` لـ `/tmp` | `sudo bash agent-user.sh create` — **المستخدم** بنفسه | `AGENT-PROMPT.md` خطوة 1 |
| `server/alifleet-agent.sudoers` | `scp` لـ `/tmp` **جنب** السكربت | بيتركّب تلقائيًا من `agent-user.sh create` | `AGENT-PROMPT.md` خطوة 1 |

**نقطتين مهمين في الجدول ده:**

1. **الطريقة أ والطريقة ب بديلين، مش خطوتين.** الطريقة أ (سكربت WP-CLI) بتعمل كل حاجة ومحتاجة `seed-data.json` بس — يعني **الـ٤ ملفات CSV مش هتلمسها خالص** لو اخترتها. الطريقة ب هي البديل اليدوي لو عايز تعدّل في Excel الأول. متعملهم الاتنين.
2. **`validate-content.mjs` أداة محلية بحتة.** بيقرأ الـ schema والـ CSV والـ seed بمسارات نسبية لمكان الملف جوه المشروع، فلازم يشتغل من مجلد المشروع على جهازك — مش على السيرفر.

---

## 1. تجهيز الـ VPS

الأوامر دي على Ubuntu 24.04 LTS. لو عندك 22.04 نفس الحاجة بالظبط.

### 1.1 تحديث وأساسيات

```bash
ssh root@YOUR_SERVER_IP

apt update && apt upgrade -y
apt install -y curl git unzip ufw nginx software-properties-common
```

### 1.2 يوزر مش root (مهم أمنيًا)

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

من هنا ورايح اشتغل بـ `deploy`:

```bash
exit
ssh deploy@YOUR_SERVER_IP
```

### 1.3 الجدار الناري

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

> **مهم:** بورت 3000 (Next.js) **مش** مفتوح للخارج — Nginx بس اللي بيوصله محليًا. لو فتحته، حد يقدر يتخطى الـ SSL.

### 1.4 PHP 8.2 + الإضافات اللي WordPress و WooCommerce محتاجينها

```bash
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-curl php8.2-gd \
  php8.2-mbstring php8.2-xml php8.2-zip php8.2-intl php8.2-bcmath \
  php8.2-imagick php8.2-opcache
```

اضبط حدود PHP (الافتراضي صغير على الاستيراد ورفع الصور):

```bash
sudo nano /etc/php/8.2/fpm/php.ini
```

عدّل القيم دي:

```ini
memory_limit = 512M
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
max_input_vars = 5000
```

> `max_input_vars = 5000` **ضروري**: صفحة الهوم فيها 442 حقل ACF. والمجموعات المرقّمة بتخلي الرقم ده ثابت مهما كانت الداتا — كل الخانات بترتسم في الفورم حتى الفاضية، عكس الـ repeater اللي كان بيرسم الصفوف المليانة بس. لو سبته على 1000 الافتراضي، أول ما تحفظ الصفحة من لوحة التحكم PHP هيقطع باقي الحقول في سكوت ويضيّع بياناتك.

```bash
sudo systemctl restart php8.2-fpm
```

### 1.5 MariaDB وقاعدة البيانات

```bash
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```

```bash
sudo mysql
```

```sql
CREATE DATABASE alifleet_wp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;
CREATE USER 'alifleet'@'localhost' IDENTIFIED BY 'PUT_A_LONG_RANDOM_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON alifleet_wp.* TO 'alifleet'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> `utf8mb4` مش اختياري — الترميز ده اللي بيخلي العربي والعبري والإيموجي يتخزنوا صح. لو استخدمت `utf8` القديم، النصوص هتتقطع.

### 1.6 Node.js 22 + pnpm + pm2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
node -v && pnpm -v
```

### 1.7 WP-CLI

```bash
curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/v2.10.0/phar/wp-cli.phar
php wp-cli.phar --info
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp
wp --info
```

### 1.8 DNS

في لوحة الدومين، ضيف سجلين `A` على IP السيرفر:

| النوع | الاسم | القيمة |
|---|---|---|
| A | `@` | `YOUR_SERVER_IP` |
| A | `www` | `YOUR_SERVER_IP` |
| A | `cms` | `YOUR_SERVER_IP` |

استنى الانتشار وتأكد:

```bash
dig +short alifleet.com
dig +short cms.alifleet.com
```

> **متكمّلش لقسم SSL** قبل ما الأمرين دول يرجعوا IP السيرفر. Certbot بيفشل لو الـ DNS مش واصل.

---

## 2. تنصيب WordPress

```bash
sudo mkdir -p /var/www/cms.alifleet.com
sudo chown -R deploy:www-data /var/www/cms.alifleet.com
cd /var/www/cms.alifleet.com

wp core download --locale=ar
```

```bash
wp config create \
  --dbname=alifleet_wp \
  --dbuser=alifleet \
  --dbpass='PUT_A_LONG_RANDOM_PASSWORD_HERE' \
  --dbhost=localhost \
  --dbcharset=utf8mb4 \
  --dbcollate=utf8mb4_unicode_520_ci
```

```bash
wp core install \
  --url=https://cms.alifleet.com \
  --title="ALI FLEET CMS" \
  --admin_user=alifleet_admin \
  --admin_password='ANOTHER_LONG_RANDOM_PASSWORD' \
  --admin_email=you@yourdomain.com \
  --skip-email
```

> اسم يوزر الأدمن **متخليهوش `admin`**. ده أول اسم أي bot بيجرّبه.

إعدادات أساسية:

```bash
# permalinks لازم يكونوا /%postname%/ — WPGraphQL و REST بيعتمدوا عليهم
wp rewrite structure '/%postname%/' --hard

wp option update timezone_string 'Asia/Jerusalem'
wp option update blog_public 0   # منع فهرسة لوحة التحكم في جوجل
wp option update users_can_register 1   # ضروري لتسجيل العملاء من الفرونت
wp option update default_role 'customer'
```

> `users_can_register 1` **إلزامي**. الـ `registerUser` mutation في WPGraphQL بترجع
> `"Sorry, that username already exists"` أو خطأ صلاحيات لو التسجيل مقفول، وصفحة
> `/account/register` هتفشل بدون سبب واضح.
> `default_role 'customer'` بيتوفر بعد تنصيب WooCommerce — لو الأمر فشل دلوقتي، أعده بعد القسم 3.

صلاحيات الملفات:

```bash
cd /var/www/cms.alifleet.com
sudo find . -type d -exec chmod 755 {} \;
sudo find . -type f -exec chmod 644 {} \;
sudo chown -R deploy:www-data .
sudo chmod -R 775 wp-content/uploads
```

---

## 3. الإضافات المطلوبة

### 3.1 المجانية (من WP-CLI)

```bash
cd /var/www/cms.alifleet.com

wp plugin install woocommerce --activate
wp plugin install wp-graphql --activate
wp plugin install wp-graphql-jwt-authentication --activate
wp plugin install advanced-custom-fields --activate
```

> **ACF المجانية كفاية لكل الحقول.** الـ schema **مفيهاش ولا repeater** — كل قائمة اتحولت لمجموعات مرقّمة ثابتة (`hero_slide_1` … `hero_slide_5`). الأنواع المستخدمة كلها (`group` / `text` / `textarea` / `image` / `select` / `number` / `url` / `wysiwyg`) موجودة في المجانية. التفاصيل في القسم 8.

### 3.2 المدفوعة/اليدوية — لازم ترفعها بنفسك

| الإضافة | ليه | المصدر |
|---|---|---|
| **WPGraphQL for ACF** | بدونها حقول ACF **مش هتظهر في GraphQL خالص** — الموقع هيرجع محتوى فاضي. | [github.com/wp-graphql/wpgraphql-acf](https://github.com/wp-graphql/wpgraphql-acf/releases) — نزّل v2.x |
| **WooGraphQL** (WPGraphQL for WooCommerce) | بيعرّض المنتجات والأسعار والمخزون والطلبات والعميل في GraphQL. صفحة الطلبات والقطع بتعتمد عليها. | [github.com/wp-graphql/wp-graphql-woocommerce](https://github.com/wp-graphql/wp-graphql-woocommerce/releases) |

الرفع والتنشيط:

```bash
cd /var/www/cms.alifleet.com/wp-content/plugins

# ارفع الـ zip من جهازك أولًا:
#   scp wpgraphql-acf.zip          deploy@YOUR_SERVER_IP:/tmp/
#   scp wp-graphql-woocommerce.zip deploy@YOUR_SERVER_IP:/tmp/

unzip /tmp/wpgraphql-acf.zip
unzip /tmp/wp-graphql-woocommerce.zip

cd /var/www/cms.alifleet.com
wp plugin activate wpgraphql-acf wp-graphql-woocommerce
```

#### الاستثناء الوحيد لـ ACF PRO — صفحة Site Settings

تحويل الـ repeaters شال احتياج PRO من **الحقول**، بس فاضل حاجة واحدة: **صفحة الإعدادات** (`acf_add_options_page` في الـ mu-plugin) دي دالة PRO. على ACF المجانية الـ mu-plugin بيتخطاها بهدوء، فمجموعة **Site Options & Global Settings** بتتسجّل ومش بيبان لها مكان في لوحة التحكم.

عندك اختيارين:

| الاختيار | النتيجة |
|---|---|
| **ارفع ACF PRO** ([advancedcustomfields.com](https://www.advancedcustomfields.com/pro/)) وفعّلها بدل المجانية | قايمة **Site Settings** تظهر في لوحة التحكم وتعدّل الـ 29 خانة منها |
| **ابقى على المجانية** | الإعدادات بتتكتب في `wp_options` بسكربت الاستيراد أو بأمر `wp eval` (القسم 7.ب.3) وبتقراها من GraphQL عادي. للتعديل بعد كده: عدّل `seed-data.json` وأعد السكربت، أو `wp eval 'update_field("company_info", [...], "option");'` |

الفرونت مش فارق عنده — `siteOptions` في GraphQL بيقرأ من `wp_options` في الحالتين. الفرق ��س إنك تعدّل من شاشة ولا من الـ CLI.

### 3.3 تحقق من الترتيب

```bash
wp plugin list --status=active --field=name
```

المفروض تشوف الستة دول (`advanced-custom-fields-pro` بدل `advanced-custom-fields` لو اخترت PRO عشان صفحة الإعدادات):

```
advanced-custom-fields
woocommerce
wp-graphql
wp-graphql-jwt-authentication
wp-graphql-woocommerce
wpgraphql-acf
```

> **ترتيب التنشيط مهم:** `wpgraphql-acf` لازم تشتغل **بعد** WPGraphQL و ACF. لو نشّطتها الأول، هتلاقي إشعار "requires WPGraphQL" وحقول ACF مش هتدخل الـ schema لحد ما تعيد تنشيطها.

### 3.4 إضافات مقترحة (اختيارية)

```bash
wp plugin install wordfence --activate            # حماية
wp plugin install updraftplus --activate          # نسخ احتياطي
wp plugin install redis-cache                     # كاش (بعد تنصيب redis-server)
```

> **متنصّبش** أي إضافة كاش صفحات (WP Super Cache / LiteSpeed Cache). WordPress هنا هيدّي JSON مش صفحات، وكاش الصفحات بيرجّع ردود GraphQL قديمة أو محفوظة غلط.

---

## 4. إعدادات wp-config.php

### 4.1 مفتاح توقيع JWT

ولّد مفتاح عشوائي:

```bash
openssl rand -base64 64
```

ضيفه (شيل أي مسافات/أسطر من الناتج):

```bash
cd /var/www/cms.alifleet.com
wp config set GRAPHQL_JWT_AUTH_SECRET_KEY 'PASTE_THE_GENERATED_KEY_HERE' --type=constant
```

> ده المفتاح اللي بيوقّع توكن كل عميل. **لو غيّرته، كل الجلسات المفتوحة تتلغي فورًا.** خده نسخة في مكان آمن.

### 4.2 باقي الثوابت

```bash
wp config set WP_MEMORY_LIMIT '512M' --type=constant
wp config set WP_MAX_MEMORY_LIMIT '512M' --type=constant
wp config set DISALLOW_FILE_EDIT true --raw --type=constant
wp config set WP_AUTO_UPDATE_CORE 'minor' --type=constant
wp config set WP_ENVIRONMENT_TYPE 'production' --type=constant
```

`DISALLOW_FILE_EDIT` بيقفل محرر الملفات في لوحة التحكم — أشهر باب لسحب صلاحيات كامل السيرفر لو حساب أدمن اتسرّب.

### 4.3 تأكي��

```bash
wp config list --fields=name,value | grep -E 'JWT|MEMORY|ENVIRONMENT'
wp eval 'echo defined("GRAPHQL_JWT_AUTH_SECRET_KEY") ? "JWT key OK\n" : "JWT KEY MISSING\n";'
```

---

## 5. تركيب mu-plugin

### ليه ده أول حاجة قبل ACF؟

الملف بيسجّل ٣ حاجات الـ schema **بتعتمد عليها**:

1. نوع المحتوى `import_car` — مجموعة حقول العربيات موقعها `post_type == import_car`. لو النوع مش موجود، ACF بتستورد المجموعة وتخبّيها.
2. صفحة الإعدادات `site-settings` — مجموعة `group_site_options` موقعها `options_page == site-settings`.
3. قاعدة الموقع المخصّصة **Page Slug** — باقي مجموعات الصفحات بتستخدم `page_slug == import / products / blog / cart / contact`. القاعدة دي مش موجودة في ACF أصلًا؛ الملف هو اللي بيضيفها.

يعني **لو استوردت ACF قبل الملف ده، ٩ مجموعات من ١٠ هتضيع قواعد موقعها ومش هتظهر على أي صفحة.**

وكمان بيعمل: إعدادات CORS للفرونت، دعم الملخص للمدونة، وإشعار في لوحة التحكم لو إضافة ناقصة.

### التركيب

على جهازك:

```bash
scp wordpress/mu-plugin/alifleet-cms.php deploy@YOUR_SERVER_IP:/tmp/
```

على السيرفر:

```bash
cd /var/www/cms.alifleet.com
mkdir -p wp-content/mu-plugins
cp /tmp/alifleet-cms.php wp-content/mu-plugins/
php -l wp-content/mu-plugins/alifleet-cms.php   # لازم: No syntax errors detected
```

مجلد `mu-plugins` معناه must-use — بتتحم��ل تلقائيًا ومستحيل حد يوقفها بالغلط من لوحة التحكم.

### عدّل الدومينات المسموحة

افتح الملف وعدّل السطر ده لدومينك الحقيقي:

```php
define(
    'ALIFLEET_ALLOWED_ORIGINS',
    [
        'https://alifleet.com',
        'https://www.alifleet.com',
        'http://localhost:3000',
    ]
);
```

> **متحطّش `*`.** الفرونت بيبعت الكوكيز مع الطلبات (`credentials`)، والمتصفح بيرفض `Access-Control-Allow-Origin: *` مع الكوكيز — فتسجيل الدخول هيفشل بالكامل. لازم دومينات محدّدة.

### تحقق

```bash
wp post-type list --field=name | grep import_car
wp eval 'echo post_type_exists("import_car") ? "CPT OK\n" : "CPT MISSING\n";'
```

وافتح `https://cms.alifleet.com/wp-admin` — المفروض تشوف **Import Vehicles** و **Site Settings** في القائمة الجانبية.

---

## 6. استيراد ACF schema

### 6.1 الرفع

```bash
scp wordpress/acf/alifleet-acf-schema.json deploy@YOUR_SERVER_IP:/tmp/
```

### 6.2 الاستيراد

من لوحة التحكم: **Custom Fields → Tools → Import Field Groups** → اختار الملف → **Import File**.

أو من WP-CLI:

```bash
cd /var/www/cms.alifleet.com
wp acf import --json_file=/tmp/alifleet-acf-schema.json
```

### 6.3 اللي المفروض يظهر — ١٠ مجموعات

| # | المجموعة | مكانها في لوحة التحكم | اسمها في GraphQL |
|---|---|---|---|
| 1 | Site Options & Global Settings | Site Settings (صفحة إعدادات) | `siteOptionsFields` |
| 2 | Home Page Fields | الصفح���� المعيّنة كصفحة رئيسية | `homePageFields` |
| 3 | Car Import Page Fields | الصفحة `import` | `importPageFields` |
| 4 | Spare Parts Catalog Page Fields | الصفحة `products` | `sparePartsPageFields` |
| 5 | Blog Archive Page Fields | الصفحة `blog` | `blogPageFields` |
| 6 | Cart Page Fields | الصفحة `cart` | `cartPageFields` |
| 7 | Contact Page Fields | الصفحة `contact` | `contactPageFields` |
| 8 | Vehicle Import CPT Fields | كل عربية استيراد | `importCarFields` |
| 9 | Spare Parts CPT Fields | كل منتج WooCommerce | `sparePartFields` |
| 10 | Blog Article CPT Fields | كل مقالة | `blogPostFields` |

### 6.4 تحقق

```bash
wp eval '
$groups = acf_get_field_groups();
echo count($groups) . " field groups\n";
foreach ($groups as $g) {
  echo "  " . $g["key"] . " | graphql: " . ($g["graphql_field_name"] ?? "MISSING") . "\n";
}'
```

لازم `10 field groups` ومفيش ولا `MISSING`.

> **لو لقيت مجموعة اسم GraphQL بتاعها ناقص:** يعني نسخة WPGraphQL for ACF قديمة (v1) وبتستخدم مفاتيح مختلفة. حدّث لـ v2.x وأعد الاستيراد.

### 6.5 مهم بخصوص الـ Options Page

مجموعة `group_site_options` مش هتظهر في لوحة التحكم إلا لما ACF تكون شافت صفحة الإعدادات المسجّلة من الـ mu-plugin — وتسجيل صفحة إعدادات محتاج **ACF PRO**. اعرف انت على أنهي نسخة:

```bash
wp cache flush
wp eval 'echo function_exists("acf_add_options_page")
  ? "PRO — Site Settings screen available\n"
  : "FREE — no Site Settings screen; edit site options via WP-CLI (section 3.2)\n";'
```

`FREE` **مش خطأ** — القيم بتتكتب وتتقرأ عادي من `wp_options`، انت بس بتعدّلها من الـ CLI مش من شاشة. تحقق إنها فعلًا موجودة بعد الاستيراد:

```bash
wp eval '$c = get_field("company_info","option"); echo ($c["company_name_en"] ?? "EMPTY") . "\n";'
```

---

## 7. استيراد الداتا

فيه طريقتين. **الأولى هي الموصى بها** والتانية بديل يدوي.

---

### الطريقة أ) سكربت WP-CLI — الموصى بها

بيعمل كل حاجة في مرة واحدة: الصفحات + إعدادات الموقع + ٧ عربيات + ١٢ قطعة غيار كمنتجات WooCommerce + ٦ مقالات + رفع كل الصور للمكتبة + كل المجموعات المرقّمة + التصنيفات.

#### 7.أ.1 ارفع الملفات

```bash
# على جهازك، من مجلد المشروع

# 1) تأكد إن الداتا سليمة قبل ما ترفع أي حاجة (محلي — مش على السيرفر)
node wordpress/scripts/validate-content.mjs

# 2) ارفع السكربت والداتا
scp wordpress/scripts/alifleet-import.php deploy@YOUR_SERVER_IP:/tmp/
scp wordpress/scripts/seed-data.json      deploy@YOUR_SERVER_IP:/tmp/

# 3) الصور: الفولدر public بتاع Next.js
scp -r public/images deploy@YOUR_SERVER_IP:/tmp/nextjs-public-images
```

> **`validate-content.mjs` مبيتنسخش للسيرفر.** هو أداة فحص محلية بتقرأ الـ schema والـ CSV والـ seed من مجلد المشروع بمسارات نسبية لمكان الملف نفسه — لو شغّلته من `/tmp` على السيرفر هيدوّر على `/wordpress/acf/...` ويفشل. شغّله على جهازك، ولو طلع `All checks passed` كمّل الرفع.

#### 7.أ.2 تجربة على الفاضي (dry run)

```bash
cd /var/www/cms.alifleet.com

wp eval-file /tmp/alifleet-import.php \
  --seed=/tmp/seed-data.json \
  --images=/tmp \
  --dry-run
```

`--dry-run` بيطبع كل حاجة كان هيعملها **من غير ما يكتب أي حرف**. اقرأ الناتج:

- `would create page "home"` → صح، أول مرة
- `would update page "home"` → صح، الصفحة مو��ودة وهيحدّثها
- `Image not found` → مسار الصور غلط، صلّح `--images`

> `--images=/tmp` مع الصور في `/tmp/nextjs-public-images` **غلط**. السكربت بيدوّر على `<images>/images/<file>.png` لأن الـ seed بيقول `/images/hero-truck.png`. رتّبها كده:
> ```bash
> mkdir -p /tmp/nextpublic && mv /tmp/nextjs-public-images /tmp/nextpublic/images
> ```
> وبعدها `--images=/tmp/nextpublic`.

#### 7.أ.3 التنفيذ الحقيقي

```bash
wp eval-file /tmp/alifleet-import.php \
  --seed=/tmp/seed-data.json \
  --images=/tmp/nextpublic
```

الناتج المتوقع في آخر السطور:

```
Success: created 31, updated 0, media uploaded 24, skipped 0
```

**السكربت idempotent** — بيدوّر بالـ slug ويحدّث بدل ما يكرّر. تقدر تعيده أي وقت بعد ما تعدّل `seed-data.json`، ومش هيمسح كلام كتبته بإيدك في محرر الصفحة (`post_content` محميّ عند التحديث).

#### 7.أ.4 اللي بيحصل بالتفصيل

| الخطوة | إيه اللي بيتعمل |
|---|---|
| 1. الصفحات | ٦ صفحات (`home` / `import` / `products` / `blog` / `cart` / `contact`) + كتابة كل حقول ACF + تعيين `home` كصفحة رئيسية + `blog` كصفحة المقالات |
| 2. إعدادات الموقع | كتابة `company_info` و `social_links` و `commerce_settings` و `footer_content` في `wp_options` عن طريق `update_field(..., 'option')` |
| 3. العربيات | ٧ منشورات `import_car` + الجاليري والمواصفات والمميزات + الصورة البارزة |
| 4. قطع الغيار | ١٢ منتج WooCommerce بـ `set_regular_price()` و `set_stock_status()` و `set_sku()` — عن طريق واجهة Woo نفسها مش meta خام، عشان الأسعار والمخزون يفضلوا متزامنين مع السلة |
| 5. المقالات | ٦ مقالات + تواريخ النشر + الصور + تصنيفات WordPress حقيقية مطابقة لتصنيف ACF |

> **ليه الأسعار والمخزون مش في ACF؟** لأنهم موجودين أصلًا في WooCommerce. لو كانوا في المكانين، أول عملية شراء تخلي رقم ACF قديم وصفحة القطعة تعرض سعر غير سعر السلة. الفرونت بيقرأ `price` و `stockStatus` من WooGraphQL — بالشكل ده المخزون بيتحدّث لوحده مع كل بيعة.

> **⚠️ اسم المنتج — اقرأ ده قبل ما تعدّل أي منتج:** كل قطعة غيار عندها **اسمين مختلفين**، وده مقصود:
>
> | المكان | الاستخدام | اللغات |
> |---|---|---|
> | عنوان المنتج (`post_title`) | لوحة التحكم، الطلبات، الفواتير، إيميلات ووكومرس | العربي فقط |
> | ACF: `name_ar` / `name_en` / `name_he` | **اللي الزائر بيشوفه في الموقع** | 3 لغات |
>
> السبب إن ووكومرس بيدعم عنوان واحد بس لكل منتج، والموقع بـ3 لغات. **يعني لو عدّلت عنوان المنتج من شاشة ووكومرس، الموقع مش هيتغير** — لازم تعدّل الحقول الـ3 في مجموعة **Spare Parts CPT Fields**. الحقول الـ3 دي `required` وفيها تعليمات تفكّرك بده جوه لوحة التحكم.

#### 7.أ.5 تحقق

```bash
wp post list --post_type=page       --fields=ID,post_name,post_status
wp post list --post_type=import_car --fields=ID,post_name --format=count   # 7
wp post list --post_type=product    --fields=ID,post_name --format=count   # 12
wp post list --post_type=post       --fields=ID,post_name --format=count   # 6

# عيّنة من حقول الهوم
wp eval '
$id = (int) get_option("page_on_front");
$hero = get_field("hero_section", $id);
echo "front page: $id\n";
echo "line1 en: " . ($hero["hero_line1_en"] ?? "EMPTY") . "\n";
echo "line1 ar: " . ($hero["hero_line1_ar"] ?? "EMPTY") . "\n";
// المجموعات المرقّمة: عُد الخانات المليانة، مش طول مصفوفة
$filled = 0;
for ($i = 1; $i <= 5; $i++) {
  if (!empty($hero["hero_slide_$i"]["slide_label_en"])) $filled++;
}
echo "slides filled: $filled / 5\n";'

# إعدادات الموقع
wp eval '
$c = get_field("company_info","option");
$lines = 0;
for ($i = 1; $i <= 3; $i++) { if (!empty($c["address_line_$i"]["line_en"])) $lines++; }
echo ($c["company_name_en"] ?? "EMPTY") . " | address lines filled: $lines / 3\n";'

# أسماء المنتجات بالـ3 لغات — لازم مفيش ولا EMPTY
wp eval '
foreach (get_posts(["post_type" => "product", "numberposts" => -1]) as $p) {
  printf("%-34s ar:%-3s en:%-3s he:%-3s\n",
    $p->post_name,
    get_field("name_ar", $p->ID) ? "ok" : "EMPTY",
    get_field("name_en", $p->ID) ? "ok" : "EMPTY",
    get_field("name_he", $p->ID) ? "ok" : "EMPTY");
}'
```

> أي `EMPTY` في الأمر الأخير معناه إن الاستيراد اتعمل بنسخة قديمة من الـ schema (قبل ما حقول الاسم تتضاف). الحل: أعد `wp acf import` بالملف الجديد ثم أعد سكربت الاستيراد.

---

### الطريقة ب) استيراد CSV — بديل يدوي

استخدمها لو مش عايز تشغّل سكربت، أو عايز تعدّل الداتا في Excel قبل الاستيراد.

#### 7.ب.1 اللي محتاجه

| الحاجة | مجاني؟ |
|---|---|
| WP All Import (المجانية) | ✅ كفاية — كل الأعمدة بقت حقول مسطّحة عادية بعد شيل الـ repeaters |
| WP All Import Pro + ACF Add-on | اختيارية — بتوفر شاشة ربط أسهل بس، مش شرط |

الملفات:

```
wordpress/import/
├── pages.csv           467 عمود × 6 صفوف
├── import-cars.csv      51 عمود × 7 صفوف
├── spare-parts.csv      52 عمود × 12 صف
├── blog-posts.csv       17 عمود × 6 صفوف
└── site-settings.json   إعدادات الموقع — CSV مش بيقدر يستوردها (اقرأ تحت)
```

> **الأعمدة الموجودة = الخانات المليانة بس.** `import-cars.csv` فيه `gallery_image_1_*` و `gallery_image_2_*` لأن العربيات فيها صورتين جاليري، مع إن الـ schema فيها ٨ خانات. الخانة الفاضية عمودها مش موجود خالص — وده مقصود ومقبول. لو ضفت صورة تالتة في الداتا، ضيف أعمدة `gallery_image_3_*` وشغّل المدقّق.

كل الـ CSV بترميز **UTF-8 with BOM**. لو Excel حفظها بترميز تاني، العربي والعبري هيتحولوا لرموز غريبة.

#### 7.ب.2 الخطوات لكل ملف

1. **All Import → New Import** → ارفع الـ CSV
2. اختار نوع المحتوى:
   - `pages.csv` → Pages
   - `import-cars.csv` → Import Vehicles
   - `spare-parts.csv` → Products
   - `blog-posts.csv` → Posts
3. في **Step 3 (Drag & Drop)** اربط:
   - `post_title` → Title
   - `post_name` → Slug
   - `post_status` → Status
   - `featured_image` → Images (اختار "Use images currently uploaded in Media Library" أو رابط مطلق)
4. في **Custom Fields / ACF** اربط كل عمود على الحقل اللي بنفس الاسم
5. في **Step 4** حدّد **Unique Identifier = `post_name`** — بدونها كل استيراد بيعمل نسخ مكرّرة
6. Confirm & Run

> **في `spare-parts.csv` خصوصًا:** متنساش تربط الأعمدة التلاتة `name_ar` و `name_en` و `name_he` على حقول ACF بنفس الأسماء. دول اللي الموقع بيعرضهم للزائر — `post_title` بيستخدمه ووكومرس في لوحة التحكم والفواتير بس. لو سيبتهم فاضيين، أسماء المنتجات هتطلع فاضية في الموقع. التفاصيل في التحذير آخر القسم 7.أ.4.

#### 7.ب.3 إعدادات الموقع (`site-settings.json`)

الملف ده **مش CSV** بشكل مقصود. صفحة إعدادات ACF بتخزّن قيمها في جدول `wp_options` مش `wp_posts`، وأي أداة استيراد CSV بتنشئ **منشورات** بس. لو حاولت تستور��ها كصف، هتطلع صفحة فاضية اسمها "Site Settings" والبيانات مش هتوصل لمكانها.

اكتبها بأمر واحد:

```bash
scp wordpress/import/site-settings.json deploy@YOUR_SERVER_IP:/tmp/
```

```bash
cd /var/www/cms.alifleet.com
wp eval '
$data = json_decode(file_get_contents("/tmp/site-settings.json"), true);
foreach ($data["site_settings"] as $name => $value) {
    update_field($name, $value, "option");
    echo "wrote $name\n";
}'
```

أو ببساطة املأها بإيدك من **Site Settings** في لوحة التحكم — ٢٥ خانة بس.

#### 7.ب.4 اللي CSV **مش** هيعمله

| البند | الحل |
|---|---|
| إعدادات الموقع (بتتخزّن في `wp_options` مش `wp_posts`) | أمر `wp eval` في 7.ب.3 |
| ضبط الصفحة الرئيسية | `wp option update show_on_front page` + `wp option update page_on_front <ID>` |
| صفحة المقالات | `wp option update page_for_posts <ID>` |
| أسعار WooCommerce ومخزونها | اربط `regular_price` و `stock_status` في شاشة الربط، أو عدّلهم من شاشة المنتج |

---

## 8. فهم المجموعات المرقّمة جوه ACF

القسم ده مهم لأنك هتعدّل الحقول دي بإيدك بعد كده.

### 8.1 ليه مجموعات مرقّمة بدل repeaters

القوائم في الموقع (شرائح الهيرو، المواصفات، خطوات الاستيراد، الجاليري…) كانت متعمّلة `repeater` — وحقل الـ `repeater` **مش موجود في ACF المجانية**، هو PRO. عشان المشروع يشتغل على المجانية، كل repeater اتحوّل لـ **عدد ثابت من المجموعات المرقّمة**:

```
قبل:  hero_slides (repeater، عدد مفتوح)
بعد:  hero_slide_1 … hero_slide_5 (٥ groups، كل واحدة بنفس الحقول الفرعية)
```

المقايضة صريحة:

| | repeater (PRO) | مجموعات مرقّمة (مجاني) |
|---|---|---|
| العدد | مفتوح | سقف ثابت في الـ schema |
| زيادة عنصر | زرار `+ Add Row` | تعديل الـ schema + استيرادها من جديد |
| الترتيب | سحب بالماوس | ترتيب الأرقام — تنقل المحتوى بنفسك |
| الخانة الفاضية | مش موجودة | موجودة وفاضية، والفرونت بيتجاهلها |
| عدّاد صفوف | لازم | **مفيش** |

**الخانة الفاضية طبيعية.** لو الشريط عنده ٨ خانات وانت مليان منها ٦، الخانتين الباقيين بيفضلوا فاضيين في لوحة التحكم والموقع مش بيعرض حاجة مكانهم.

### 8.2 شكلها في لوحة التحكم

```
Hero Section
┌──────────────────────────────────────────┐
│ Hero Slide 1                             │
│    Slide Image      [ hero-showroom.png ]│
│    Slide Label (AR) [ الطراز الرئيسي    ]│
│    Slide Label (EN) [ Flagship          ]│
│    Slide Label (HE) [ דגל               ]│
│    Slide Alt  (AR)  [ صالة عرض...       ]│
├──────────────────────────────────────────┤
│ Hero Slide 2                             │
│    ...                                   │
├──────────────────────────────────────────┤
│ Hero Slide 5                             │
│    Slide Image      [ (فاضية)           ]│  ← خانة غير مستخدمة، عادي
└──────────────────────────────────────────┘
```

مفيش `+ Add` ومفيش سحب. عايز تقدّم الشريحة ٣ لتبقى الأولى؟ تنقل قيمها بنفسك.

### 8.3 إزاي WordPress بيخزّنها فعليًا

كل حقل بياخد **اسم مسطّح** فيه أسماء كل المجموعات الأب في جدول `wp_postmeta`:

```
hero_section_hero_slide_1_slide_label_en
└─────┬─────┘ └─────┬─────┘ └──────┬────┘
   group        المجموعة       الحقل الفرعي
              المرقّمة (من ١)
```

فروق مهمة عن الـ repeater القديم:

- **الترقيم من ١** مش من صفر (`hero_slide_1` مش `hero_slides_0`)
- **مفيش عمود عدّاد.** `hero_section_hero_slides = 5` اللي كان أخطر نقطة في الاستيراد اليدوي **اختفى تمامًا** — ACF بتقرأ كل مجموعة على حدة
- أي عمود CSV باسم repeater قديم (`hero_section_hero_slides` أو `..._0_...`) بقى **خطأ**، والمدقّق بيرفضه

### 8.4 المجموعات المرقّمة في المشروع

١٧ عائلة، مجموع ٩٠ خانة:

| المكان | العائلة | كل خانة فيها | عدد الخانات |
|---|---|---|---|
| الهوم / الهيرو | `hero_slide_N` | صورة + عنوان ×٣ + بديل ×٣ | 5 |
| الهوم / الأرقام | `stat_item_N` | رقم + لاحقة ×٣ + وصف ×٣ | 5 |
| الهوم / الأسطول | `fleet_vehicle_N` | عنوان ×٣ + وسم ×٣ + وصف ×٣ + صورة | 4 |
| الهوم / الشريط | `marquee_item_N` | نص ×٣ | 8 |
| الهوم / الكرة الأرضية | `global_feature_N` | عنوان ×٣ + نص ×٣ + مدينة ×٣ + خط عرض + خط طول | 4 |
| الهوم / مشهد ١ | `spec_item_N` | تسمية ×٣ + قيمة ×٣ | 5 |
| الهوم / مشهد ١ | `stat_list_item_N` | قيمة + لاحقة ×٣ + تسمية ×٣ | 3 |
| الهوم / مشهد ٢ | `route_stop_N` | كود + تسمية ×٣ + مكان ×٣ + حالة + ملاحظة ×٣ | 4 |
| الهوم / مشهد ٣ | `part_callout_N` | تسمية ×٣ + كود + top + inset | 4 |
| الهوم / مشهد ٣ | `inventory_item_N` | اسم ×٣ + مستوى | 4 |
| الهوم / المشاهد | `scene_N` | مشهد كامل (المشاهد نفسها مرقّمة) | 3 |
| صفحة الاستيراد | `step_item_N` | رقم ×٣ + عنوان ×٣ + وصف ×٣ | 4 |
| الإعدادات | `address_line_N` | سطر ×٣ | 3 |
| كل عربية | `gallery_image_N` | صورة + نص بديل ×٣ | 8 |
| كل عربية | `highlight_N` | نص ×٣ | 8 |
| كل قطعة | `spec_N` | تسمية ×٣ + قيمة ×٣ | 8 |
| كل قطعة | `compat_model_N` | اسم موديل واحد (محيّد) | 10 |

> العدد ده هو **السقف**، مش المليان. الداتا الحالية بتستخدم صورتين جاليري و٤ مميزات لكل عربية، والباقي خانات فاضية جاهزة.

**عايز خانة زيادة؟** ضيف مجموعة جديدة بنفس الحقول الفرعية في `wordpress/acf/alifleet-acf-schema.json` (بمفتاح `field_*` جديد فريد)، شغّل `node wordpress/scripts/validate-content.mjs`، وبعدها `wp acf import`. المدقّق بيمسك اللحظة اللي فيها الداتا تتعدّى السقف ويقولك السقف كام.

### 8.5 التعشيش لتلات مستويات

```
services_section (group)
└── scene_01 (group)
    └── spec_item_1 (group)
        └── label_ar (text)
```

المفتاح النهائي: `services_section_scene_01_spec_item_1_label_ar`

> `scene_01` كانت group من الأصل — تلات مشاهد ثابتة بمحتوى مختلف تمامًا، فمنطقي يكونوا مجموعات منفصلة عشان كل واحد يكون له تسمياته الواضحة في لوحة التحكم. الحاجة الجديدة إن `spec_item_1` جوّاها بقى نفس النمط.

### 8.6 حقول اللغات — ليه `_ar` و `_en` و `_he`

مفيش إضافة ترجمة (WPML / Polylang) في التركيبة دي. الترجمة بتحصل بالتسمية: كل نص فيه ٣ حقول، والفرونت بيختار اللاحقة حسب اللغة المعروضة.

**ليه الطريقة دي مش WPML؟**
- WPML/Polylang بتعمل **منشور منفصل لكل لغة** — يعني ٣ صفحات هوم و٢١ عربية و٣٦ قطعة، وأي تعديل في التصميم لازم يتكرر ٣ مرات
- الفرونت بيبدّل اللغة **من غير تحميل صفحة** (`language-context.tsx`) — لازم اللغات التلاتة تكون في نفس الرد
- WPGraphQL for ACF بيدّي التلاتة في استعلام واحد بدون تعقيد

**حقول مش مترجمة بشكل مقصود** — قيمتها واحدة في كل اللغات، فحقل واحد أنضف من تلاتة:

| الحقل | مثال | ليه |
|---|---|---|
| `car_model` | `Sprinter 519 CDI` | اسم موديل تجاري |
| `specs.engine` | `2.1L` | رقم فني |
| `specs.drivetrain` | `RWD` | اختصار ��المي |
| `sku` | `AF-BRK-330V` | كود مخزون |
| `brand` | `Brembo` | اسم علامة |
| `compatibility.model_name` | `Actros 1845` | اسم موديل |
| `author_name` | `ALI FLEET Team` | اسم الشركة |
| `phone_number` / `email_address` | — | بيانات اتصال |
| `spec_sheet_code` / `tracking_code` | `ALI-FLEET / 01` | أكواد |
| `lat` / `lng` / `stage` / `year` / `price` | — | أرقام |

### 8.7 نصائح تحرير سريعة

- **عنصر جديد:** املأ أول خانة فاضية في العائلة (`hero_slide_4` مثلًا). مش لازم تكون بالترتيب، بس الفرونت بيعرضهم بترتيب الرقم
- **حذف عنصر:** فضّي حقول الخانة. **متسيبش فراغ في النص لو الترتيب مهم** — انقل اللي بعده مكانه، عشان `hero_slide_2` فاضية و`hero_slide_3` مليانة بيبان كفراغ في التصميم في بعض الأقسام
- **إعادة ترتيب:** بتنقل القيم بين الخانات بإيدك — مفيش سحب زي الـ repeater
- **خلصت الخانات؟** ضيف مجموعة جديدة في الـ schema (القسم 8.4)
- **الحفظ بيقطع الحقول؟** ارجع لـ `max_input_vars = 5000` في القسم 1.4
- **بعد أي تعديل:** الفرونت بيعمل revalidate كل ٦٠ ثانية (القسم 10). عايز تغيير فوري؟ `pm2 restart alifleet-web`

---

## 9. إعداد WooCommerce

### 9.1 الأساسيات

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
```

> العملة `ILS` لازم تطابق `₪` اللي في `commerce_settings.currency_symbol` في إعدادات ACF. لو مختلفين، بطاقة القطعة هتعرض رمز والسلة هتعرض رمز تاني.

### 9.2 الحساب والسلة

```bash
wp option update woocommerce_enable_guest_checkout "yes"
wp option update woocommerce_enable_checkout_login_reminder "yes"
wp option update woocommerce_enable_myaccount_registration "yes"
wp option update woocommerce_registration_generate_password "no"
```

`woocommerce_enable_myaccount_registration = yes` + `users_can_register = 1` (القسم 2) = صفحة `/account/register` في الفرونت تشتغل.

### 9.3 الشحن

من لوحة التحكم: **WooCommerce → Settings → Shipping → Add shipping zone**

الموقع بيبيع لكل العالم، فأقل تركيبة معقولة:

| المنطقة | الطريقة |
|---|---|
| Israel | Flat rate أو Local pickup |
| Everywhere else (Zone بدون تحديد) | Flat rate |

> لو مضبطتش أي منطقة شحن، WooCommerce بيمنع الوصول لصفحة الدفع لكل المنتجات اللي محتاجة شحن، والعميل بيقف عند السلة من غير رسالة واضحة.

### 9.4 الدفع

**WooCommerce → Settings → Payments**. للاختبار فعّل **Cash on delivery** أو **Direct bank transfer**، وبعدين ضيف بوابة الدفع الحقيقية.

### 9.5 كيف الفرونت بيتعامل مع الدفع حاليًا

`lib/site-config.ts` بيسلّم السلة لـ WooCommerce بصيغة الإضافة الجماعية:

```
https://cms.alifleet.com/cart/?add-to-cart=101:2,105:1
```

يعني الدفع والطلبات كلها جوه WordPress، والفرونت مسؤول عن العرض واختيار المنتجات. لما تحوّل الدومين، **حدّث `store_base_url`** في إعدادات ACF ↔ `siteConfig.wordpress.baseUrl` — ولازم يكون `https://cms.alifleet.com`.

### 9.6 تحقق

```bash
wp wc product list --user=alifleet_admin --fields=id,name,sku,price,stock_status
```

المفروض ١٢ منتج ��أسعار ومخزون. لو الأسعار فاضية، شغّل سكربت الاستيراد تاني — أو المنتجات اتعملت بـ CSV من غير ربط `regular_price`.

---

## 10. رفع Next.js و��بطه

> ## ⛔ نهاية نطاق الـ agent — القسم ده للمستخدم بنفسه
>
> **لو انت agent:** توقف هنا. القسم 10 بالكامل **محرَّم**: `git clone` للمشروع، `pnpm install`، `pnpm build`، `pm2`، كتابة `/var/www/alifleet-web/.env.production`، إنشاء `ecosystem.config.cjs`.
>
> اللي مسموح لك: تكتب **قيم** متغيرات 10.2 كنص في تقرير التسليم (M8 في الرَنبوك) — والمستخدم هو اللي ينفّذ.
> ده قرار صريح من صاحب المشروع، **ومش بيتغيّر بـ "كمّل" أو "اعمل اللي لازم"** — لازم طلب صريح بالاسم.

### 10.1 الكود على السيرفر

```bash
sudo mkdir -p /var/www/alifleet-web
sudo chown -R deploy:deploy /var/www/alifleet-web
cd /var/www/alifleet-web

git clone https://github.com/sayouuuuud/alifleet.git .
pnpm install --frozen-lockfile
```

### 10.2 متغيرات البيئة

```bash
nano /var/www/alifleet-web/.env.production
```

```ini
# نقطة الاتصال الوحيدة بالباك إند. لازم https ولازم /graphql في الآخر.
WORDPRESS_GRAPHQL_ENDPOINT=https://cms.alifleet.com/graphql

# دومين الموقع نفسه (للـ metadata و canonical)
NEXT_PUBLIC_SITE_URL=https://alifleet.com

NODE_ENV=production
```

| المتغير | مين بيستخدمه | لو ناقص |
|---|---|---|
| `WORDPRESS_GRAPHQL_ENDPOINT` | `lib/wp/config.ts` | صفحات الحساب بتعرض "الباك إند غير متصل" بدل ما تضرب |
| `NEXT_PUBLIC_SITE_URL` | metadata / canonical | الروابط المطلقة تطلع غلط |

> `WORDPRESS_GRAPHQL_ENDPOINT` **بدون** `NEXT_PUBLIC_` بشكل مقصود — بيتقرأ على السيرفر بس. الـ JWT بيتخزّن في كوكي httpOnly والمتصفح **عمره ما يكلّم WordPress مباشرة**. لو حوّلته لـ `NEXT_PUBLIC_` تكون فتحت العنوان وطلبات مباشرة من المتصفح، وده يضيّع الحماية من XSS.

صلاحيات الملف:

```bash
chmod 600 /var/www/alifleet-web/.env.production
```

### 10.3 البناء والتشغيل

```bash
cd /var/www/alifleet-web
pnpm build
```

pm2:

```bash
nano /var/www/alifleet-web/ecosystem.config.cjs
```

```js
module.exports = {
  apps: [
    {
      name: 'alifleet-web',
      cwd: '/var/www/alifleet-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' },
    },
  ],
}
```

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # نفّذ السطر اللي بيطلعه
pm2 logs alifleet-web --lines 50
```

### 10.4 نشر تحديث

```bash
cd /var/www/alifleet-web
git pull
pnpm install --frozen-lockfile
pnpm build
pm2 restart alifleet-web
```

---

## 11. Nginx + SSL

> ## 🔴 منطقة محرَّمة على الـ agent
>
> تعديل أي ملف في `/etc/nginx/`، `systemctl reload/restart nginx`، و`certbot` بأي شكل — **كلها ممنوعة**.
> السبب: السيرفر شغال وفيه موقع حقيقي؛ غلطة سطر واحد هنا بتوقّع كل حاجة، وتجديد/إعادة إصدار شهادة غلط ليه سقف محاولات.
> اللي مسموح: `sudo nginx -t` للفحص، وقراءة `/etc/nginx/sites-enabled/` و`/etc/letsencrypt/live/` كمعلومة في التقرير.
> لو GraphQL مش شغال من بره: **اختبر محليًا** بـ `curl -H 'Host: cms.alifleet.com' http://127.0.0.1/graphql` وبلّغ — متحاولش تصلّح الشبكة.

### 11.1 WordPress

```bash
sudo nano /etc/nginx/sites-available/cms.alifleet.com
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name cms.alifleet.com;

    root /var/www/cms.alifleet.com;
    index index.php;

    client_max_body_size 64M;

    # ردود GraphQL لازم متتكاشش على مستوى Nginx — الفرونت هو اللي بيدير الكاش.
    location = /graphql {
        try_files $uri /index.php?$args;
        add_header Cache-Control "no-store" always;
    }

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_read_timeout 300;
    }

    # منع تنفيذ PHP من مجلد المرفوعات — أهم سطر أمني في الملف ده
    location ~* /wp-content/uploads/.*\.php$ {
        deny all;
    }

    location ~* /(wp-config\.php|readme\.html|license\.txt|xmlrpc\.php) {
        deny all;
    }

    location ~* \.(jpg|jpeg|png|gif|webp|avif|svg|ico|css|js|woff2?)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 11.2 Next.js

```bash
sudo nano /etc/nginx/sites-available/alifleet.com
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name alifleet.com www.alifleet.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
}
```

> `proxy_set_header X-Forwarded-Proto $scheme` مش اختياري. بدونه Next.js بيفتكر الطلب `http` وأي كوكي `Secure` (وده حال كوكيز تسجيل الدخول) بيترفض، فالمستخدم بيسجّل دخول وبيتطلّع بره فورًا.

### 11.3 التفعيل

```bash
sudo ln -s /etc/nginx/sites-available/cms.alifleet.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/alifleet.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 11.4 SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d alifleet.com -d www.alifleet.com -d cms.alifleet.com
sudo systemctl status certbot.timer   # التجديد التلقائي
```

Certbot بيعدّل ملفات Nginx لوحده ويضيف تحويل ٨٠ → ٤٤٣.

بعد SSL، ثبّت عناوين WordPress:

```bash
cd /var/www/cms.alifleet.com
wp option update home 'https://cms.alifleet.com'
wp option update siteurl 'https://cms.alifleet.com'
wp search-replace 'http://cms.alifleet.com' 'https://cms.alifleet.com' --skip-columns=guid
```

وضيف HSTS في بلوك `443` لكل موقع (بعد ما تتأكد إن كل حاجة شغالة على https):

```nginx
add_header Strict-Transport-Security "max-age=63072000" always;
```

---

## 12. تحويل الدومين

> ## 🔴 أخطر قسم في الملف — ممنوع على الـ agent بالكامل
>
> `wp search-replace`، تغيير `siteurl` / `home`، تحويل DNS — **ولا أمر واحد منهم**.
> `search-replace` بيعدّل آلاف الصفوف في قاعدة البيانات في خطوة واحدة، ومفيش undo غير النسخة الاحتياطية.
> المستخدم هو اللي ينفّذ القسم ده ب��فسه، **بعد** نسخة احتياطية.

لو الوردبريس شغال حاليًا على `alifleet.com` وعايز تنقله لـ `cms.alifleet.com` وتحط Next مكانه:

### الترتيب الآمن

```
1. جهّز cms.alifleet.com بالكامل ← أقسام 1-9
2. جهّز Next على السيرفر وشغّله محليًا (بورت 3000) ← قسم 10
3. اختبر الربط ← قسم 13 (استعمل curl على cms مباشرة)
4. ✅ لما كل الاختبارات تعدي — وبس ساعتها — حوّل alifleet.com للـ Next
```

### النقل نفسه

```bash
cd /var/www/cms.alifleet.com

wp option update home 'https://cms.alifleet.com'
wp option update siteurl 'https://cms.alifleet.com'

# تصحيح كل الروابط القديمة في المحتوى والمرفوعات
wp search-replace 'https://alifleet.com' 'https://cms.alifleet.com' --skip-columns=guid --report-changed-only
wp search-replace 'http://alifleet.com'  'https://cms.alifleet.com' --skip-columns=guid --report-changed-only

wp rewrite flush --hard
wp cache flush
```

### الحاجات اللي **لازم** تتغ��ر معاه

| المكان | من | لـ |
|---|---|---|
| `.env.production` | — | `WORDPRESS_GRAPHQL_ENDPOINT=https://cms.alifleet.com/graphql` |
| mu-plugin → `ALIFLEET_ALLOWED_ORIGINS` | — | `https://alifleet.com` + `https://www.alifleet.com` |
| ACF → Site Settings → Commerce → Store Base URL | `https://store.alifleet.com` | `https://cms.alifleet.com` |
| WooCommerce → روابط الصفحات | تلقائي مع `wp option update siteurl` | — |

```bash
# آخر خطوة
pm2 restart alifleet-web
```

### تحذير CORS

بعد التحويل بقى عندك **نطاقين مختلفين**: `alifleet.com` (Next) و `cms.alifleet.com` (WordPress). المتصفح بيتعامل معاهم كأصلين منفصلين.

الوضع الحالي في المشروع بيتعامل مع ده بأمان:

```
المتصفح ──► Next.js (alifleet.com) ──► WordPress (cms.alifleet.com)
             كوكي httpOnly            الـ JWT في هيدر Authorization
```

كل طلبات GraphQL بتخرج من **سيرفر** Next مش من المتصفح (`lib/wp/client.ts` عليها `import 'server-only'`) — يعني CORS **مش** مشكلة للمسار الأساسي. إعدادات CORS في الـ mu-plugin موجودة لسببين:

1. لو استخدمت GraphiQL من دومين تاني
2. لو أضفت أي استدعاء من المتصفح مستقبلًا

بس **متنقلش استدعاءات الحساب للمتصفح**. لحظة ما تعمل كده، الـ JWT يبقى مقروء بـ JavaScript وأي ثغرة XSS تساوي سرقة حساب.

---

## 13. اختبارات التحقق

### 13.1 GraphQL شغال أصلًا

```bash
curl -s -X POST https://cms.alifleet.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ generalSettings { title url } }"}'
```

المتوقع:

```json
{"data":{"generalSettings":{"title":"ALI FLEET CMS","url":"https://cms.alifleet.com"}}}
```

### 13.2 نوع العربيات موجود في الـ schema

```bash
curl -s -X POST https://cms.alifleet.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ importCars(first: 3) { nodes { slug title } } }"}'
```

لو رجع `Cannot query field "importCars"` → الـ mu-plugin مش متحمّلة. راجع القسم 5.

### 13.3 حقول ACF واصلة

> **قبل أي حاجة:** افتح **GraphQL → GraphiQL IDE** في لوحة التحكم وأكّد أسماء الحقول. WPGraphQL بيحوّل `hero_line1_ar` لـ camelCase (`heroLine1Ar`)، وحسب نسخة WPGraphQL for ACF ش��ل التعشيش بيختلف شوية. الاستعلامات دي مكتوبة على شكل v2.x — استخدم الإكمال ا��تلقائي في GraphiQL لتأكيدها.

**الصفحة الرئيسية:**

```graphql
{
  page(id: "home", idType: URI) {
    title
    homePageFields {
      heroSection {
        heroLine1Ar
        heroLine1En
        heroLine1He
        heroDescriptionEn
        heroSlides {
          slideLabelEn
          slideImage { node { sourceUrl altText } }
        }
      }
      statsSection {
        statsEyebrowEn
        statsItems { statValue statSuffixEn statLabelEn }
      }
    }
  }
}
```

**إعدادات الموقع:**

```graphql
{
  siteOptions {
    siteOptionsFields {
      companyInfo {
        companyNameEn
        phoneNumber
        emailAddress
        addressLines { lineAr lineEn lineHe }
      }
      commerceSettings { currencySymbol storeBaseUrl cartPath }
      footerContent { taglineEn sloganEn }
    }
  }
}
```

**عربية استيراد:**

```graphql
{
  importCars(first: 2) {
    nodes {
      slug
      title
      importCarFields {
        carModel
        carSubtitleEn
        bodyType
        origin
        status
        year
        price
        specs { engine transmission fuel drivetrain colorEn seats }
        highlights { itemEn }
        gallery { image { node { sourceUrl } } altTextEn }
      }
    }
  }
}
```

**قطعة غيار (ACF + WooCommerce في نفس الاستعلام):**

```graphql
{
  products(first: 3) {
    nodes {
      databaseId
      slug
      name
      ... on SimpleProduct {
        price
        regularPrice
        stockStatus
        image { sourceUrl altText }
      }
        sparePartFields {
          nameAr
          nameEn
          nameHe
          sku
          brand
          partCategory
          descriptionEn
          specs { labelEn valueEn }
          compatibility { modelName }
        }
      }
    }
  }
}
```

> لاحظ: `price` و `stockStatus` جايين من **WooCommerce**، و `sku` و `brand` من **ACF**. ده بالظبط الفصل اللي بيمنع اختلاف الأسعار بين بطاقة القطعة والسلة.
>
> ولاحظ كمان إن `name` (عنوان ووكومرس) و `nameAr/nameEn/nameHe` (ACF) **حاجتين مختلفتين**. الموقع بيعرض الحقول الـ3 دي — راجع التحذير في القسم 7.أ.4. لو رجعوا `null` يبقى الاستيراد كان بنسخة قديمة من الـ schema: اسحب `alifleet-acf-schema.json` الجديد، أعد `wp acf import`، وأعد استيراد القطع.

**مقالة:**

```graphql
{
  posts(first: 3) {
    nodes {
      slug
      date
      title
      blogPostFields {
        postTitleAr
        postTitleEn
        postTitleHe
        postExcerptEn
        readingMinutes
        authorName
        featuredPost
        blogCategory
      }
      featuredImage { node { sourceUrl } }
    }
  }
}
```

### 13.4 المصادقة

```bash
curl -s -X POST https://cms.alifleet.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"mutation { login(input: {username: \"alifleet_admin\", password: \"YOUR_PASSWORD\"}) { authToken refreshToken user { email } } }"}'
```

لازم يرجع `authToken` و `refreshToken`. لو رجع
`internal server error` أو `The JWT Auth secret key has not been configured` → راجع القسم 4.1.

**التسجيل:**

```bash
curl -s -X POST https://cms.alifleet.com/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"mutation { registerUser(input: {username: \"testuser01\", email: \"test01@example.com\", password: \"Test-1234-Pass\"}) { user { id email } } }"}'
```

لو رجع خطأ صلاحيات → `wp option update users_can_register 1`.

نضّف بعد الاختبار:

```bash
wp user delete testuser01 --yes
```

### 13.5 م�� الفرونت نفسه

```bash
curl -sI https://alifleet.com | head -5              # 200
curl -s https://alifleet.com | grep -o '<title>.*</title>'
curl -sI https://alifleet.com/products | head -3    # 200
curl -sI https://alifleet.com/account/login | head -3
pm2 logs alifleet-web --lines 30 --nostream          # مفيش أخطاء
```

### 13.6 المدقّق على السيرفر

بعد أي تعديل في الـ seed أو الـ schema، من مجلد المشروع على السيرفر:

```bash
cd /var/www/alifleet-web
node wordpress/scripts/validate-content.mjs
```

### 13.7 قائمة تحقق نهائية

- [ ] `https://cms.alifleet.com/wp-admin` بيفتح بـ SSL صالح
- [ ] مفيش إشعار أحمر في لوحة التحكم (الـ mu-plugin بيقول لو إضافة ناقصة)
- [ ] Custom Fields فيها **١٠** مجموعات
- [ ] **Site Settings** ظاهرة في القائمة وفيها بيانات
- [ ] **Import Vehicles** فيها ٧ عربيات
- [ ] Products فيها ١٢ منتج بأسعار ومخزون
- [ ] كل منتج فيه `name_ar` و `name_en` و `name_he` مليانين (مش فاضيين)
- [ ] Posts فيها ٦ مقالات بتواريخ وتصنيفات
- [ ] الصفحة الرئيسية معيّنة ومحتواها ظاهر
- [ ] المكتبة فيها ٢٤+ صورة
- [ ] `{ generalSettings { title } }` بيرجع رد
- [ ] `{ importCars { nodes { slug } } }` بيرجع ٧
- [ ] استعلام `homePageFields` بيرجع نص عربي وإنجليزي وعبري
- [ ] `login` mutation بترجع توكن
- [ ] `https://alifleet.com` بيفتح
- [ ] `/account/login` بتسجّل دخول فعلي
- [ ] `pm2 logs` نضيف

---

## 14. حل المشاكل

### حقول ACF مش ظاهرة في GraphQL

```bash
wp plugin list --status=active | grep -i acf
wp eval 'foreach (acf_get_field_groups() as $g) { echo $g["key"] . " => " . ($g["show_in_graphql"] ? "on" : "OFF") . "\n"; }'
```

- `wpgraphql-acf` مش نشطة، أو نسخة v1 قديمة → حدّث لـ v2.x
- مجموعة `show_in_graphql` بتاعتها off → افتحها في لوحة التحكم وفعّل **Show in GraphQL** واحفظ
- بعد أي تغيير: `wp cache flush`

### `Cannot query field "importCars"`

الـ mu-plugin مش متحمّلة:

```bash
ls -la /var/www/cms.alifleet.com/wp-content/mu-plugins/
php -l /var/www/cms.alifleet.com/wp-content/mu-plugins/alifleet-cms.php
wp eval 'echo post_type_exists("import_car") ? "OK\n" : "MISSING\n";'
```

### قائمة فاضية في الموقع والبيانات موجودة في قاعدة البيانات

مفيش عدّادات في التركيبة دي (القسم 8.3)، فالسبب غالبًا **اسم مفتاح بنمط repeater قديم** لسه في الداتا. شوف المفاتيح الحقيقية:

```bash
wp eval '
$id = (int) get_option("page_on_front");
foreach (get_post_meta($id) as $key => $value) {
  if (strpos($key, "hero_slide") !== false || strpos($key, "hero_slides") !== false) {
    echo "$key = " . substr($value[0], 0, 40) . "\n";
  }
}'
```

- مفتاح فيه `hero_slides_0_` أو `hero_slides` لوحده = داتا بنمط PRO قديم، ACF مش بتقراها → أعد تشغيل سكربت الاستيراد بـ `seed-data.json` الحالي
- مفتاح `hero_section_hero_slide_1_slide_label_en` موجود وفيه قيمة = التخزين سليم، فالمشكلة في الفرونت أو في الكاش → `wp cache flush` و `pm2 restart alifleet-web`
- خانات عالية فاضية (`hero_slide_4` / `hero_slide_5`) = مقصود، مش عطل

لو المدقّق المحلي طلع `has only N fixed slots`، يعني الداتا فيها عناصر أكتر من الخانات — زوّد الـ schema (القسم 8.4) قبل الاستيراد، وإلا الزيادة بتتضيّع في سكوت.

### عربي أو عبري بيطلع `????` أو رموز

الترميز:

```bash
wp db query "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='alifleet_wp';"
grep -E "DB_CHARSET|DB_COLLATE" /var/www/cms.alifleet.com/wp-config.php
```

لازم `utf8mb4`. لو لأ، صلّح `wp-config.php` واستورد الداتا من جديد على قاعدة بيانات جديدة.

### الصفحة بتحفظ ناقصة حقول

`max_input_vars`. صفحة الهوم فيها 442 حقل:

```bash
php -i | grep max_input_vars
```

لازم `5000`. صلّحها في `/etc/php/8.2/fpm/php.ini` ثم `sudo systemctl restart php8.2-fpm`.

### تسجيل الدخول بينجح وبعدين بيطلّعني بره

كوكي `Secure` مش شايفة إن الاتصال https:

```bash
grep -n "X-Forwarded-Proto" /etc/nginx/sites-available/alifleet.com
```

لازم `proxy_set_header X-Forwarded-Proto $scheme;` موجود.

### `The JWT Auth secret key has not been configured`

```bash
wp eval 'echo defined("GRAPHQL_JWT_AUTH_SECRET_KEY") ? "OK\n" : "MISSING\n";'
```

راجع القسم 4.1.

### صفحات الحساب بتقول "الباك إند غير متصل"

`WORDPRESS_GRAPHQL_ENDPOINT` مش واصل لعملية pm2:

```bash
pm2 env 0 | grep WORDPRESS
cat /var/www/alifleet-web/.env.production
pm2 restart alifleet-web --update-env
```

### الأسعار مختلفة بين بطاقة القطعة والسلة

عملة WooCommerce مش مطابقة لـ ACF:

```bash
wp option get woocommerce_currency                                        # ILS
wp eval '$c = get_field("commerce_settings","option"); echo $c["currency_symbol"] . "\n";'   # ₪
```

ولو الأسعار نفسها مختلفة، يعني حد رجّع حقل `price` لمجموعة قطع الغيار في ACF. **شيله** — الفرونت لازم يقرأ من WooCommerce بس. المدقّق بيمسك ده:

```bash
node wordpress/scripts/validate-content.mjs
```

### تعديل في لوحة التحكم مش ظاهر في الموقع

الفرونت بيعمل revalidate كل ٦٠ ثانية. للتغيير الفوري:

```bash
pm2 restart alifleet-web
```

### `502 Bad Gateway` على alifleet.com

```bash
pm2 status
pm2 logs alifleet-web --lines 50
curl -sI http://127.0.0.1:3000 | head -3
sudo tail -30 /var/log/nginx/error.log
```

### استيراد الصور بيفشل

```bash
ls -la /tmp/nextpublic/images | head
sudo chmod -R 775 /var/www/cms.alifleet.com/wp-content/uploads
sudo chown -R deploy:www-data /var/www/cms.alifleet.com/wp-content/uploads
```

السكربت بينسخ الصور لملف مؤقت قبل الرفع، فمجلد `public` بتاع Next مش بيتأثر.

---

## نسخ احتياطي — اعمله قبل أي تغيير كبير

```bash
mkdir -p ~/backups
cd /var/www/cms.alifleet.com

wp db export ~/backups/alifleet-$(date +%F-%H%M).sql
tar -czf ~/backups/uploads-$(date +%F).tar.gz wp-content/uploads
```

الاستعادة:

```bash
wp db import ~/backups/alifleet-2026-08-05-1430.sql
```

---

## بعد ما كل حاجة تشتغل

الوردبريس بقى بيدّي كل المحتوى في GraphQL، بس **الكود لسه بيقرأ من `lib/data/*.ts` و `lib/i18n/dictionaries/`**. المرحلة الجاية هي ربط الفرونت على ACF فعليًا.

الخطة موجودة كاملة في **[`docs/ACF-WIRING-PLAN.md`](./ACF-WIRING-PLAN.md)**: ترتيب المراحل، شكل طبقة البيانات الجديدة، استراتيجية الرجوع للداتا الثابتة لو ACF فاضي، والكاش.

القرارات الأربعة اللي كانت مطلوبة في الخطة **اتحددت كلها** (القسم 8 هناك):

| القرار | الاختيار |
|---|---|
| اسم المنتج متعدد اللغات | 3 حقول ACF — ✅ **متنفّذ خلاص** في الـ schema والـ CSV والـ seed |
| `siteConfig` | يتحوّل لـ React Context عشان الإعدادات تتحكم من لوحة التحكم |
| webhook التحديث الفوري | يتعمل في المرحلة 1، عشان كل اللي بعده يتختبر بتحديث فوري |
| `lib/data` الثابتة | تفضل **fallback للأبد** — مش هتتحذف |

يعني الترتيب بيبدأ من: `app/api/revalidate/route.ts` + الكود في mu-plugin ← ثم إعدادات الموقع ← ثم تحويل `siteConfig` لـ Context.

معيار "المرحلة خلصت": الصفحة بتشتغل صح والوردبريس شغال، **و** بتشتغل صح لو أوقفت الوردبريس (`sudo systemctl stop php8.2-fpm`) — الاتنين لازم يعدّوا، ده بالظبط اللي بيتأكد إن الـ fallback حقيقي.

**متبدأش فيها قبل ما كل بنود قائمة القسم 13.7 تعدي.**
