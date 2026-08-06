# AGENT.md — الملف الوحيد للـ agent

> **لو انت agent:** الملف ده كل حاجة. الأوامر كلها جواه. **متفتحش أي ملف `.md` تاني** — مفيش داعي.
> ابدأ من **الجزء ب**. اقرأه لآخره قبل أول أمر.
>
> **لو انت المستخدم:** الجزء أ ده بتاعك — 4 خطوات وخلاص.

---
---

# الجزء أ — للمستخدم (4 خطوات)

> ### ⚠️ اقرأ ده الأول — البيئة مش اللي الدليل كان مبني عليه
>
> السيرفر بيشغّل WordPress **جوه Docker تحت إدارة Coolify**، مش تنصيب مباشر:
>
> | البند | الواقع |
> |---|---|
> | WordPress | كونتينر `wordpress-yo985p014jyz554zjo2oo6w7` (صورة `wordpress:latest`) |
> | `/var/www` على الهوست | **فاضي تمامًا** |
> | قاعدة البيانات | MySQL 8 في كونتينر `mysql-yo985p014jyz554zjo2oo6w7` |
> | ويب سيرفر | **Traefik v3.6** ماسك 80/443. `nginx` / `php8.2-fpm` / `mariadb` كلهم inactive |
> | الإدارة | **Coolify 4.1.2** — لوحة على بورت 8000 |
> | `wp-cli` | **مش منصّب** لا على الهوست ولا جوه الكونتينر |
> | السيرفر | **مشترك** — 16 كونتينر، منهم 6 تطبيقات إنتاج مش تابعة للمشروع ده |
>
> **ونتيجة لكده اتغيّر نموذج الأمان:** أي وصول لأمر `docker` = root كامل على
> الهوست (`docker run -v /:/host … chroot /host`). فمفيش حاجة اسمها "docker
> محدود". الـ agent **مياخدش** docker ولا مجموعة docker — ياخد سكربت root واحد
> اسمه `wp-agent` واسم الكونتينر مثبَّت جواه.
>
> **وكمان:** القسم 11 في `docs/WORDPRESS-SETUP.md` (nginx + certbot) **ملغي** —
> مش محرَّم بس، هو غير قابل للتنفيذ لأن مفيش nginx شغال. الدومين والشهادة من
> لوحة Coolify، **وانت اللي تعملها**.

## 1) اعمل اليوزر المؤقت

من جهازك — **تلات ملفات، مش اتنين**:

```bash
scp wordpress/server/agent-user.sh \
    wordpress/server/alifleet-agent.sudoers \
    wordpress/server/wp-agent \
    deploy@YOUR_SERVER_IP:/tmp/
```

على السيرفر:

```bash
ssh deploy@YOUR_SERVER_IP
cd /tmp
sed -i 's/\r$//' agent-user.sh alifleet-agent.sudoers wp-agent   # لو رفعت من ويندوز
sudo bash agent-user.sh create
```

السكربت بيتأكد الأول إن الكونتينر شغال، وإن `docker.sock` **مش** متمرَّر جواه،
وإنه مش `privileged` — لأن الحماية كلها مبنية على الحصر جوه الكونتينر. لو أي
واحدة من التلاتة مكسورة، بيوقف ومبيعملش اليوزر.

**لو اسم الكونتينر مختلف** (Coolify بيغيّره لو عملت redeploy بـ resource ID
جديد): هاته بـ `docker ps --format '{{.Names}}\t{{.Image}}' | grep -i wordpress`
وعدّل `WP_CONTAINER` في أول `wp-agent`. **الـ agent مش بيقدر يعدّله** — الملف
مملوك `root:root 0755`.

هيطبعلك في الآخر `ssh afagent@IP` + الباسورد. **انسخهم فورًا** — الباسورد بيتعرض مرة واحدة بس.

**لو `deploy` مش موجود** (`Permission denied` مع إن الباسورد صح): استخدم `root@YOUR_SERVER_IP` وشيل `sudo` من الأوامر.

**لو ظهر `$'\r': command not found`:** سطر `sed` فوق هو الحل — ويندوز حوّل نهايات السطور لـ CRLF. لازم تنضّف ملف الـ `.sudoers` هو كمان، لأن `\r` جواه بيفشّل `visudo -c`. (ملف `.gitattributes` في المستودع بيمنع المشكلة دي في أي checkout جديد.)

## 2) خُد نسخة احتياطية — **إلزامية، مش خيار**

`wp db export` مش متاح (مفيش wp-cli، والـ agent ممنوع من `wp db`). البديل:

```bash
sudo bash /tmp/agent-user.sh backup
```

بياخد التلاتة: قاعدة البيانات بـ `mysqldump` من كونتينر MySQL، و `wp-config.php`،
و `wp-content` كامل. النواتج في `/root/alifleet-backups` بصلاحية 600 — **انقلها
بره السيرفر**.

> **ليه "إلزامية" مش "مستحسنة":** استيراد الداتا (M5) مبني على `wp eval-file`،
> وده تنفيذ PHP حر جوه الكونتينر. يعني الـ agent بيوصل لقاعدة البيانات بغض
> النظر عن إن `wp db` مرفوض. **الحد الحقيقي عليه هو الحصر جوه الكونتينر، مش
> قايمة الأوامر** — وقايمة الرفض بتمنع الغلط العابر، مش فاعل مصمِّم على الخروج.

## 3) دي اللي تقولها للـ agent

افتحله التيرمينال ومجلد المشروع، وقوله:

> بيانات الدخول: `ssh afagent@<IP>` باسورد `<الباسورد>`
> اقرأ `docs/AGENT.md` بالكامل ونفّذ المهام M0 → M8 بالترتيب. متخرجش عن حدود الملف.

## 4) وانت شغال

| عايز | الأمر |
|---|---|
| تشوف بيعمل إيه | `sudo bash /tmp/agent-user.sh status` |
| **كل استدعاء على الكونتينر (حتى المرفوض)** | `sudo tail -f /var/log/wp-agent.log` |
| كل أمر sudo | `sudo tail -f /var/log/auth.log` |
| **تقطعه فورًا** | `sudo bash /tmp/agent-user.sh revoke` |
| تمسحه لما يخلّص | `sudo bash /tmp/agent-user.sh delete` |

`revoke` بيشيل `/usr/local/bin/wp-agent` **الأول** — يعني الباب على الكونتينر
بيتقفل قبل الحساب نفسه.

**بعد `delete`:** الـ agent كان بيشغّل PHP جوه الكونتينر، فكان بيقدر يقرأ بيانات
الاتصال بقاعدة البيانات. لو عايز تكون 100% مطمّن: غيّر `WORDPRESS_DB_PASSWORD`
ودوّر `GRAPHQL_JWT_AUTH_SECRET_KEY` **من لوحة Coolify** (الاتنين محتاجين redeploy،
وتدوير مفتاح الـ JWT بيلغي كل الجلسات المفتوحة).

---
---

# الجزء ب — للـ agent

## 1) المهمة والحدود

| بند | القيمة |
|---|---|
| **هدفك** | WordPress على `cms.alifleet.com` يبقى: الإضافات مفعّلة + ثوابت `wp-config` + mu-plugin + ACF (10 مجموعات) + الداتا مستوردة + WooCommerce مضبوط + GraphQL بيرجّع كل الحقول |
| **آخر حاجة مسموحة** | التحقق من GraphQL (M7) + كتابة قيم متغيرات البيئة في تقريرك (M8) |
| **الخط الأحمر** | ❌ ممنوع رفع/بناء/تشغيل مشروع Next.js على السيرفر — ❌ ممنوع `docker` بأي شكل — ❌ ممنوع Coolify — ❌ ممنوع Traefik/SSL — ❌ ممنوع تحويل الدومين |
| **مبدأك** | انت **بتنفّذ**، مش **بتخترع**. أي انحراف عن المكتوب هنا = وقوف وسؤال |
| **نطاق عملك** | كونتينر واحد: `wordpress-yo985p014jyz554zjo2oo6w7`، من خلال `sudo wp-agent` بس |
| **مسار WordPress** | `/var/www/html` **جوه الكونتينر**. `/var/www` على الهوست فاضي — ده طبيعي |
| **ملفات المشروع** | موجودة local على جهاز المستخدم وانت شايفها. النقل **خطوتين**: `scp` للهوست ثم `sudo wp-agent put` للكونتينر |

### �� السيرفر مشترك — أهم قيد في الملف

عليه **16 كونتينر**، منهم إنتاج مش تابع للمشروع ده: `usesend`، تطبيقين تانيين،
4 قواعد PostgreSQL، Redis، وطبقة Coolify نفسها.

**أي حاجة بره كونتينر `wordpress-yo985p014jyz554zjo2oo6w7` = مخالفة**، مهما كانت
مبرَّرة، لأن الضرر بيوصل لتطبيقات إنتاج لغير المشروع. ومفيش داعي تفكر في الأمر
أصلًا: `sudo wp-agent` مش بياخد اسم كونتينر منك، و `docker` مرفوض في الـ sudoers.

### الوضع الحالي المؤكَّد (مش افتراض)

| البند | الحالة | معناه ليك |
|---|---|---|
| البيئة | ✅ Docker + Coolify 4.1.2 | كل أوامر WP من خلال `sudo wp-agent` — مفيش `wp` على الهوست |
| WordPress | ✅ منصَّب في كونتينر | متعملش `wp core install` ولا `wp config create` |
| `wp-cli` | ⚠️ **مش منصّب** | أول خطوة في M0: `sudo wp-agent bootstrap`. وبيروح مع أي rebuild من Coolify — اتحقق من وجوده في أول كل جلسة |
| قاعدة البيانات | ✅ MySQL 8 في كونتينر منفصل | ممنوع تلمس كونتينر الداتابيز. `wp db` مرفوض من `wp-agent` |
| Traefik / الدومين / SSL | ✅ شغال، وبيتدار من Coolify | **مش شغلك.** بلّغ بالحالة وبس |
| `nginx` / `php-fpm` / `mariadb` على الهوست | ✅ inactive (مقصود) | متحاولش تشغّلهم. القسم 11 في دليل التشغيل ملغي |

### ❓ 4 حقائق مجهولة — بوابة إلزامية في M0

الجدول اللي فوق مؤكَّد من `docker ps`. الأربعة دي **لسه مجهولة**، و `wp-agent
doctor` بيجيبهم كلهم. **ممنوع أي أمر كتابة قبل ما تبلّغ بيهم وتاخد موافقة:**

| # | الحقيقة | ليه بتوقف عندها |
|---|---|---|
| 1 | متغيرات بيئة الكونتينر + الدومين من Traefik labels | لو `WP_HOME`/`siteurl` مختلفين عن الدومين المربوط → تصحيحهم = تحويل دومين = 🔴 |
| 2 | الإضافات النازلة **فعلًا** | الجدول القديم كان بيقول "أكترها نازلة" — ده كان افتراض من قبل ما نعرف إنها Docker. M1 بيتحدد على الناتج الحقيقي |
| 3 | `mu-plugins` موجودة والـ volume بيغطيها؟ | لو مش مغطّاة، M3 بيروح مع أول rebuild و M4 بتضيع معاه |
| 4 | نطاق الـ volume — `/var/www/html` كامل ولا `wp-content` بس؟ | لو `wp-content` بس → `wp config set` في M2 **مؤقت**، والثوابت لازم تبقى متغيرات بيئة في Coolify. ⏸ اسأل |

---

## 2) قانون الحدود — صنّف كل أمر قبل تنفيذه

**أمر مش مذكور في الجداول دي = 🟡 اسأل.** مفيش استثناء.

### 🟢 ALLOW — نفّذ لوحدك

**كل أمر WP-CLI بيبدأ بـ `sudo wp-agent wp`.** مفيش `cd /var/www/...` ومفيش `wp`
لوحده — الاتنين مش موجودين على السيرفر ده.

- **قراءة WP-CLI:** `sudo wp-agent wp plugin list`, `… wp option get`, `… wp post list`, `… wp user list`, `… wp config list --fields=name`, `… wp core version`, `… wp post-type list`
- **جرد الكونتينر:** `sudo wp-agent doctor`, `sudo wp-agent ls`, `sudo wp-agent bootstrap`
- **قراءة الهوست:** `ls`, `cat`, `grep`, `tail`, `df -h`, `systemctl status *`, `curl` على localhost
- **الإضافات:** `sudo wp-agent wp plugin install` / `activate` **للقايمة في M1 بس** + `sudo wp-agent unzip` للـ zip اللي المستخدم رفعه
- **الثوابت:** `sudo wp-agent wp config set` **للثوابت في M2 بالحرف بس**
- **الملفات للكونتينر:** `sudo wp-agent put /tmp/... mu-plugins/...` (المصدر من `/tmp` بس، والهدف جوه `plugins/` أو `mu-plugins/` أو `uploads/`)
- **فحص PHP:** `sudo wp-agent lint mu-plugins/alifleet-cms.php`
- **ACF:** `sudo wp-agent wp acf import`
- **الاستيراد الجاف:** `sudo wp-agent wp eval-file ... --dry-run`
- **WooCommerce:** `sudo wp-agent wp option update woocommerce_*` **للمذكور في M6 بس**
- **التحقق:** `sudo wp-agent wp eval` **بكود قراءة فقط** (`get_field` / `get_option` / `echo`) + `curl` لـ GraphQL
- **الملفات على الهوست:** `scp` لـ `/tmp` بس

### 🟡 ASK — قف واستنى موافقة

| الحاجة | ليه |
|---|---|
| **الاستيراد الحقيقي** (`eval-file` بدون `--dry-run`) | أول كتابة جماعية في DB |
| **أي `wp eval` فيه كتابة** (`update_field`, `update_option`, `wp_insert_post`) | كتابة غير موثّقة |
| **`wp config set` لو الـ volume مش بيغطي `/var/www/html`** | التعديل بيروح مع أول rebuild — لازم يبقى متغير بيئة في Coolify |
| `apt install` جوه الكونتينر | بيروح مع أول rebuild — الحل تعديل الصورة من Coolify |
| أي إضافة مش في قايمة M1 | مفيش إضافات باجتهاد شخصي |
| بوابات دفع WooCommerce أو أي مفتاح دفع | فلوس حقيقية |
| **أي حاجة انت مش متأكد منها 100%** | القاعدة الافتراضية |

**الحاجات دي `wp-agent` بيرفضها بنفسه — متحاولش:** `wp db *`, `wp search-replace`,
`wp option update siteurl|home`, `wp user create/update/delete`, `wp core update`,
`wp theme *`, `wp plugin delete/deactivate/update`, `wp config set` على `DB_*` أو
`WP_HOME`/`WP_SITEURL`, `wp config list` بقيم, وكل flags: `--path --ssh --http
--url --require --exec --allow-root --force --skip-*`.

لو احتجت واحدة منهم فعلًا → ⏸ اسأل المستخدم **ينفّذها هو**. **ممنوع تدوّر على
طريقة تلف بيها** (زي `wp eval` بكود يعمل نفس الحاجة) — ده أخطر من الأمر نفسه لأنه
بيعدّي من غير ما يظهر في اللوج بشكل مفهوم.

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

1. ❌ **`docker` بأي شكل:** `docker ps`, `docker exec`, `docker inspect`, `docker-compose`, الانضمام لمجموعة `docker`. **السبب:** `docker` = root كامل على الهوست، والهوست عليه 6 تطبيقات إنتاج تانية. لو لقيت `docker` متاح لك → **ده خلل أمني، بلّغ فورًا ومتستخدموش.** كل شغلك من `sudo wp-agent`.
2. ❌ **أي كونتينر غير كونتينر WordPress:** كونتينر MySQL, `usesend`, قواعد PostgreSQL, Redis, كونتينرات Coolify. مش نطاقك ومش مشروعك.
3. ❌ **Coolify:** `/data/coolify/*`, متغيرات بيئة اللوحة, إعادة النشر, تعديل أي resource. الدومين والشهادة وربط Traefik **من اللوحة والمستخدم هو اللي يعملها**.
4. ❌ **رفع مشروع Next.js:** `git clone` للمشروع على السيرفر، `pnpm install`, `pnpm build`, `pm2`, كتابة `.env.production`, `ecosystem.config.cjs`. **انت بتكتب القيم في التقرير وخلاص.**
5. ❌ **Traefik / SSL:** أي تعديل على توجيه أو شهادات. (`nginx` و `certbot` مش موجودين شغالين أصلًا — القسم 11 في دليل التشغيل ملغي.)
6. ❌ **تحويل الدومين:** `wp search-replace`, تغيير `siteurl` / `home`, أي حاجة في DNS. أخطر خطوة في المشروع كله.
7. ❌ `rm -rf` بأي شكل، و`rm` على أي حاجة بره `/tmp`.
8. ❌ `mysql` / `mysqldump` / `mariadb`, وأي `DROP` / `TRUNCATE` / `DELETE` — سواء بأمر مباشر أو من جوه `wp eval`.
9. ❌ `sudo su`, `su -`, `visudo`, تعديل `/etc/sudoers*`, تعديل `/usr/local/bin/wp-agent`, إضافة يوزر, `authorized_keys`, `ufw`.
10. ❌ **تسريب أسرار:** طبع محتوى `wp-config.php`, `wp config list --fields=name,value`, `wp config get DB_PASSWORD`, طبع `GRAPHQL_JWT_AUTH_SECRET_KEY` أو أي مفتاح. الأسرار تتولّد وتتحط في **نفس الأمر** من غير `echo`. للتحقق من الوجود: `sudo wp-agent wp config has <NAME>`.
11. ❌ `git commit` / `git push`, أو تعديل `app/` أو `lib/` أو `components/` — الربط بالكود مرحلة تانية بتتعمل في v0، مش هنا.
12. ❌ تعديل `wordpress/acf/alifleet-acf-schema.json` أو `seed-data.json` أو أي ملف `docs/*.md`. لقيت غلط؟ **بلّغ وقف.**
13. ❌ حذف أو تعطيل إضافة شغالة. وممنوع أي إضافة كاش صفحات.
14. ❌ **الاستمرار بعد فشل تحقق.** الفشل = وقوف، مش محاولة تانية بأمر أقوى.

### صلاحياتك الفعلية

| البند | الوضع |
|---|---|
| مجموعة `sudo` | ❌ **مش** فيها. صلاحياتك من `/etc/sudoers.d/alifleet-agent` بس |
| مجموعة `docker` | ❌ **مش** فيها، وده مقصود — `docker` = root على هوست فيه إنتاج غيرك |
| بابك الوحيد للكونتينر | `sudo /usr/local/bin/wp-agent` — اسم الكونتينر مثبَّت جواه ومش بيتمرَّر منك |
| أوامر sudo التانية | `systemctl status`, `tail` للوجات, `df -h`. **بس.** |
| `wp-agent` نفسه | `root:root 0755` — تقدر تقراه، **مش** تقدر تعدّله |
| كتابة الملفات جوه الكونتينر | `plugins` + `mu-plugins` + `uploads` عبر `wp-agent put` بس. **مفيش** كتابة على ملفات الـ core |
| `wp-config.php` | تعدّل ثوابت M2 بـ `wp-agent wp config set`. **ممنوع تطبع محتواه أو `wp config get` على أي سر** |
| على الهوست | `/tmp` بس |
| انتهاء الحساب | تلقائي بعد 3 أيام |
| المراقبة | `/var/log/auth.log` لكل `sudo`, و `/var/log/wp-agent.log` لكل استدعاء على الكونتينر **بما فيها المرفوض**. المستخدم شايفهم لحظيًا وبيقدر يقطعك في أي لحظة |

**لو احتجت `sudo` لأمر مش في القايمة، أو احتجت `docker` → دي إشارة إنك خرجت عن
نطاقك. قف واسأل، متدوّرش على طريقة تلف بيها.**

> **صدق مع نفسك في حدود الحماية:** `wp eval` و `wp eval-file` مسموحين (M5 محتاجهم)،
> ودول تنفيذ PHP حر جوه الكونتينر — يعني تقدر تقنيًا توصل للداتابيز وتقرا الأسرار
> رغم إن `wp db` و `wp config get DB_PASSWORD` مرفوضين. قايمة الرفض بتمنع **الغلط
> العابر**، والحصر جوه الكونتينر هو اللي بيحمي الهوست وباقي التطبيقات. الفرق بين
> "ممنوع" و"مستحيل" فرق حقيقي، والمستخدم واثق فيك على أساسه — **متستغلّهوش.**

---

## 3) قواعد سلوك سارية في كل مهمة

1. **أمر واحد له غرض واحد.** ممنوع سلاسل `&&` طويلة تخبّي خطوة خطرة في وسطها.
2. **قبل أي أمر كتابة:** قول المهمة (`[M4]`) + الأمر + الناتج المتوقع. بعده: الناتج الفعلي.
3. **ممنوع `--force` و `--allow-root` و `--skip-*`** — أصلًا، مش بس عند الفشل. (`wp-agent` بيرفضهم، فمحاولتك هتظهر في اللوج كمحاولة تجاوز.)
4. **ممنوع الافتراض.** الكونتينر مش لاقيه؟ `wp-cli` مش موجود؟ → بلّغ واستنى.
5. **في أول كل جلسة:** `sudo wp-agent doctor`. لو Coolify عمل rebuild، `wp-cli` بيروح والثوابت اللي مش في volume بتترجع لأصلها — **اتحقق، متفترضش إن اللي عملته لسه موجود**.
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

`wp-cli` **مش منصّب** في الكونتينر. السكربت بيقولك كده، والحل:

```bash
sudo wp-agent bootstrap    # بينزّل wp-cli جوه الكونتينر — أول أمر كتابة مسموح في M0
sudo wp-agent doctor       # الجرد الكامل بعد ما wp-cli يبقى موجود
```

> `bootstrap` بينزّل من `raw.githubusercontent.com` **جوه الكونتينر بس** وبيتحقق
> من الملف بـ `wp --info` قبل ما يثبّته. وبيروح مع أي rebuild من Coolify — **ده
> طبيعي، مش خلل**. لو المستخدم عايز يبقى دائم، ده بيتعمل من الصورة في Coolify وهو
> اللي يعمله.

سلّم التقرير ده وقف:

| بند | المطلوب |
|---|---|
| الكونتينر | الاسم + الصورة + `docker.sock` مش متمرَّر ✓ |
| إصدارات | WP / PHP / MySQL / WP-CLI |
| **الـ volume** | `/var/www/html` كامل ولا `wp-content` بس؟ **(أهم بند في التقرير)** |
| **متغيرات البيئة** | أسماء `WORDPRESS_*` بدون قيم + `WP_HOME`/`siteurl` + دومين Traefik. متطابقين؟ |
| **الإضافات** | قايمة كاملة فعلية + إيه الناقص من الستة |
| **mu-plugins** | المجلد موجود؟ فيه إيه؟ داخل الـ volume؟ |
| ACF | مجموعات موجودة؟ العدد؟ |
| CPT | `import_car` موجود؟ |
| الداتا | عدد الصفحات / `import_car` / `product` / `post` |
| ثوابت | `GRAPHQL_JWT_AUTH_SECRET_KEY` موجود؟ (اكتب **موجود/مش موجود** — متطبعش القيمة) |
| Traefik / SSL / DNS | الحالة **للعلم بس** |
| المدقّق المحلي | ناتج `validate-content.mjs` |
| مخاطر | أي حاجة مخالفة للمتوقع |

**بوابات الوقوف:**

- أي `FAIL` من `validate-content.mjs` → **قف**.
- لقيت داتا مستوردة قبل كده → **قف واسأل**.
- **الـ volume بيغطي `wp-content` بس** → ⏸ قف. M2 كله (`wp config set`) هيروح مع أول rebuild، والثوابت لازم تتحوّل لمتغيرات بيئة في Coolify — **والمستخدم هو اللي يعملها**.
- **`mu-plugins` بره الـ volume** → ⏸ قف. M3 و M4 مبنيين عليها.
- **`siteurl` مش مطابق لدومين Traefik** → ⏸ قف وبلّغ بس. تصحيحه = تحويل دومين = 🔴 ممنوع.

---

### M1 — الإضافات

**متعملش install لحاجة موجودة.** كمّل الناقص بس.

```bash
# الناقص من دول بس (🟢)
sudo wp-agent wp plugin install woocommerce --activate
sudo wp-agent wp plugin install wp-graphql --activate
sudo wp-agent wp plugin install wp-graphql-jwt-authentication --activate
sudo wp-agent wp plugin install advanced-custom-fields --activate
```

**التنين دول مش في مستودع ووردبريس** (`wpgraphql-acf` + `wp-graphql-woocommerce`). لو الـ zip **مش** في `/tmp` → ⏸ **قف واطلب من المستخدم يرفعهم**. ممنوع تجيبهم من أي مصدر تاني أو `curl` من GitHub بدون إذن.

```bash
sudo wp-agent unzip /tmp/wpgraphql-acf.zip
sudo wp-agent unzip /tmp/wp-graphql-woocommerce.zip
sudo wp-agent wp plugin activate wpgraphql-acf wp-graphql-woocommerce
```

`wp-agent unzip` بينقل الـ zip للكونتينر وبيفكّه في `wp-content/plugins` جواه.
المصدر لازم يكون في `/tmp` على الهوست.

**ترتيب التنشيط إلزامي:** `wpgraphql-acf` **بعد** WPGraphQL و ACF. لو كانت مفعّلة قبلهم → ⏸ اسأل قبل `deactivate && activate`.

**تحقق — لازم الستة:**

```bash
sudo wp-agent wp plugin list --status=active --field=name
```

`advanced-custom-fields` (أو `-pro`) / `woocommerce` / `wp-graphql` / `wp-graphql-jwt-authentication` / `wp-graphql-woocommerce` / `wpgraphql-acf`

> **لو ACF المجانية:** شاشة Site Settings مش هتظهر — **ده طبيعي ومقبول**. الإعدادات بتتكتب في `wp_options` من سكربت M5 وGraphQL بيقراها عادي. **متقترحش ترقية ومتنزّلش PRO.** اكتبها في التقرير وبس.
>
> **Wordfence / UpdraftPlus / Redis:** 🟡 اسأل، متنصّبهاش من نفسك.

---

### M2 — ثوابت wp-config

**`GRAPHQL_JWT_AUTH_SECRET_KEY` موجود؟ متلمسوش** — تغييره بيلغي كل الجلسات المفتوحة. لو ناقص، نفّذ كده — من غير طبع القيمة:

> ### ⏸ بوابة قبل M2 — نتيجة الـ volume من M0
>
> لو الـ volume بيغطي **`wp-content` بس**، فـ `wp-config.php` جوه طبقة الكونتينر
> المؤقتة و **كل الأوامر اللي تحت هتتمسح مع أول rebuild من Coolify**. في الحالة
> دي: **قف**، وبلّغ المستخدم إن الثوابت دي لازم تتحط كمتغيرات بيئة في Coolify
> (`WORDPRESS_CONFIG_EXTRA` أو متغيرات مفردة) — **وهو اللي يعملها، مش انت**.
>
> كمّل بالأوامر دي **بس** لو الـ volume بيغطي `/var/www/html` كامل.

```bash
sudo wp-agent wp config set GRAPHQL_JWT_AUTH_SECRET_KEY "$(openssl rand -base64 64 | tr -d '\n')" --type=constant
```

باقي الثوابت بالحرف — **زيادة ولا نقصان ممنوع**:

```bash
sudo wp-agent wp config set WP_MEMORY_LIMIT '512M' --type=constant
sudo wp-agent wp config set WP_MAX_MEMORY_LIMIT '512M' --type=constant
sudo wp-agent wp config set DISALLOW_FILE_EDIT true --raw --type=constant
sudo wp-agent wp config set WP_AUTO_UPDATE_CORE 'minor' --type=constant
sudo wp-agent wp config set WP_ENVIRONMENT_TYPE 'production' --type=constant
```

**تحقق:**

```bash
sudo wp-agent wp config has GRAPHQL_JWT_AUTH_SECRET_KEY
sudo wp-agent wp config list --fields=name | grep -E 'MEMORY|ENVIRONMENT|DISALLOW'
```

> ⚠️ `--fields=name` **بس** — `wp-agent` بيرفض `--fields=name,value` تلقائيًا لأنه
> بيطبع الأسرار. وبيرفض كمان `wp config get` على أي سر (`DB_PASSWORD`, مفتاح الـ
> JWT, الـ salts) — للتحقق من الوجود استخدم `wp config has` زي ما فوق. لو المستخدم
> عايز نسخة من المفتاح، هو يجيبها بنفسه.

---

### M3 — mu-plugin

**إلزامي قبل M4.** لو ACF اتستوردت قبله، 9 مجموعات من 10 هتضيّع قواعد موقعها.

**النقل خطوتين** — `scp` للهوست، وبعدين `wp-agent put` للكونتينر:

```bash
# على جهاز المستخدم — عدّل ALIFLEET_ALLOWED_ORIGINS قبل الرفع
scp wordpress/mu-plugin/alifleet-cms.php afagent@SERVER_IP:/tmp/

# على السيرفر
sudo wp-agent put /tmp/alifleet-cms.php mu-plugins/alifleet-cms.php
sudo wp-agent lint mu-plugins/alifleet-cms.php   # لازم: No syntax errors detected
```

`put` بيعمل المجلد لو مش موجود وبيظبط الملكية لـ `www-data` لوحده.

عدّل `ALIFLEET_ALLOWED_ORIGINS` للدومينات الحقيقية **على جهازك قبل `scp`**. **ممنوع
`*`** — بيكسر تسجيل الدخول بالكوكيز.

**تحقق:**

```bash
sudo wp-agent wp eval 'echo post_type_exists("import_car") ? "CPT OK\n" : "CPT MISSING\n";'
```

`CPT MISSING` → **قف**. الملف مش بيتحمّل (صلاحيات/مسار/خطأ PHP)، و M4 هتضيع لو كمّلت.

> **لو M0 قال إن `mu-plugins` بره الـ volume:** الملف ده هيروح مع أول rebuild
> ومعاه كل CPTs و ACF. ⏸ **قف** وبلّغ — الحل إن `wp-content` كله يبقى في volume،
> والمستخدم هو اللي يعمله من Coolify.

---

### M4 — ACF schema

```bash
scp wordpress/acf/alifleet-acf-schema.json afagent@SERVER_IP:/tmp/
# على السيرفر — لازم ينتقل جوه الكونتينر الأول
sudo wp-agent stage /tmp/alifleet-acf-schema.json
sudo wp-agent wp acf import --json_file=/tmp/alifleet-stage/alifleet-acf-schema.json
```

**تحقق:** لازم **10 مجموعات** وكلها `show_in_graphql`.
طلعوا 8 أو 9 → **قف**: يعني الملف قديم أو mu-plugin مش شغال (M3). **ممنوع** تعدّل الـ JSON عشان "يعدّي".

---

### M5 — الداتا 🚪

**5.1 الرفع + ترتيب الصور** (الترتيب ده إلزامي وإلا كل الصور هتفشل):

```bash
# 1) للهوست
scp wordpress/scripts/alifleet-import.php afagent@SERVER_IP:/tmp/
scp wordpress/scripts/seed-data.json      afagent@SERVER_IP:/tmp/
scp -r public/images                      afagent@SERVER_IP:/tmp/nextjs-public-images

# 2) على السيرفر — رتّب الصور جوه مجلد اسمه images
mkdir -p /tmp/nextpublic && mv /tmp/nextjs-public-images /tmp/nextpublic/images

# 3) انقل التلاتة جوه الكونتينر
sudo wp-agent stage /tmp/alifleet-import.php
sudo wp-agent stage /tmp/seed-data.json
sudo wp-agent stage /tmp/nextpublic
```

الترتيب في خطوة 2 إلزامي — السكربت بيدوّر على `<images>/images/...`، فلو المجلد
اسمه غير كده كل الصور هتفشل.

**5.2 dry-run** (🟢) — كل المسارات بقت جوه الكونتينر:

```bash
sudo wp-agent wp eval-file /tmp/alifleet-stage/alifleet-import.php \
  --seed=/tmp/alifleet-stage/seed-data.json \
  --images=/tmp/alifleet-stage/nextpublic --dry-run
```

**5.3 🚪 بوابة:** اعرض ملخص الجاف (كام create / كام update / كام `Image not found`) واستنى موافقة.
أي `Image not found` → **صلّح المسار وأعد الجاف**. متكمّلش على التنفيذ الحقيقي.

**5.4 التنفيذ** (بعد الموافقة بس): نفس الأمر بدون `--dry-run`.
المتوقع: `Success: created 31, updated 0, media uploaded 24, skipped 0`

**5.5 تحقق:**

```bash
sudo wp-agent wp post list --post_type=page       --fields=ID,post_name,post_status
sudo wp-agent wp post list --post_type=import_car --format=count   # 7
sudo wp-agent wp post list --post_type=product    --format=count   # 12
sudo wp-agent wp post list --post_type=post       --format=count   # 6

# حقول الهوم
sudo wp-agent wp eval '
$id = (int) get_option("page_on_front");
$hero = get_field("hero_section", $id);
echo "front page: $id\n";
echo "line1 en: " . ($hero["hero_line1_en"] ?? "EMPTY") . "\n";
$filled = 0;
for ($i = 1; $i <= 5; $i++) { if (!empty($hero["hero_slide_$i"]["slide_label_en"])) $filled++; }
echo "slides filled: $filled / 5\n";'

# إعدادات الموقع
sudo wp-agent wp eval '
$c = get_field("company_info","option");
$lines = 0;
for ($i = 1; $i <= 3; $i++) { if (!empty($c["address_line_$i"]["line_en"])) $lines++; }
echo ($c["company_name_en"] ?? "EMPTY") . " | address lines: $lines / 3\n";'

# أسماء المنتجات بالـ3 لغات — لازم مفيش ولا EMPTY
sudo wp-agent wp eval '
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

> ⚠️ **`eval-file` = تنفيذ PHP حر جوه الكونتينر.** ده أوسع صلاحية عندك في
> المشروع كله، ومسموحة **لأن M5 محتاجاها بالتحديد** — مش رخصة عامة. شغّل ملف
> `alifleet-import.php` زي ما هو من المستودع، **بدون تعديل**، ومتكتبش سكربت PHP
> من عندك تشغّله بيه. لو الاستيراد فشل → قف وبلّغ بالخطأ، متكتبش بديل.

> **لو الكونتينر اتعمله restart بين خطوة 5.1 و 5.4:** محتويات
> `/tmp/alifleet-stage` بتروح. أعِد الـ `stage` وأعِد الـ dry-run — **متكمّلش
> على التنفيذ الحقيقي بافتراض إن الملفات لسه موجودة**.

---

### M6 — WooCommerce

```bash
sudo wp-agent wp option update woocommerce_store_address "Industrial Zone, Building 12"
sudo wp-agent wp option update woocommerce_store_city "Haifa"
sudo wp-agent wp option update woocommerce_default_country "IL"
sudo wp-agent wp option update woocommerce_currency "ILS"
sudo wp-agent wp option update woocommerce_currency_pos "right"
sudo wp-agent wp option update woocommerce_price_decimal_sep "."
sudo wp-agent wp option update woocommerce_price_thousand_sep ","
sudo wp-agent wp option update woocommerce_price_num_decimals 2
sudo wp-agent wp option update woocommerce_weight_unit "kg"
sudo wp-agent wp option update woocommerce_dimension_unit "cm"

sudo wp-agent wp option update woocommerce_enable_guest_checkout "yes"
sudo wp-agent wp option update woocommerce_enable_checkout_login_reminder "yes"
sudo wp-agent wp option update woocommerce_enable_myaccount_registration "yes"
sudo wp-agent wp option update woocommerce_registration_generate_password "no"
```

`ILS` لازم تطابق `₪` في `commerce_settings.currency_symbol` — لو مختلفين، بطاقة القطعة هتعرض رمز والسلة رمز تاني.

**بره صلاحيتك:** الشحن (محتاج لوحة تحكم — اكتبها في التقرير للمستخدم)، بوابات الدفع 🟡 إذن، onboarding wizard ❌، إضافات Woo إضافية ❌.

**تحقق:**

```bash
sudo wp-agent wp option get woocommerce_currency          # ILS
sudo wp-agent wp post list --post_type=page --fields=post_name | grep -E 'cart|checkout|account'
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

**استخدم الدومين الفعلي اللي طلع من `doctor`** (من Traefik labels) — مش `cms.alifleet.com`
مفترضًا. لو مختلف: بلّغ بالفرق ولا تصلّح حاجة.

**لو SSL/DNS لسه مش جاهزين:** اختبر عبر Traefik محليًا بترويسة `Host`:

```bash
curl -s -X POST http://127.0.0.1/graphql -H 'Host: <الدومين-من-doctor>' \
  -H 'Content-Type: application/json' -d '{"query":"{ generalSettings { title } }"}'
```

**ممنوع** تلمس Traefik أو Coolify أو الشهادات عشان تخلّي الاختبار يمشي. الفشل من
بره = بلّغ وبس، والمستخدم يحلّها من اللوحة.

اختبار المصادقة محتاج يوزر تجريبي، و`wp user create` **مرفوض من `wp-agent`** — يعني
🟡 اسأل المستخدم **ينشئه هو**. لو عمله: الاسم يبدأ بـ `agenttest_`، والحذف بعدها هو
كمان اللي يعمله. **ممنوع** تعمله بـ `wp eval` — ده لف حول الرفض.
اختبار الفرونت → **مش شغلك** (الفرونت مش مرفوع بقرار).

---

### M8 — التسليم ⛔ وقوف ��هائي

سلّم ده وقف. **متعملش ولا خطوة من رفع Next.js.**

```
✅ اكتمل: M1 … M7
📋 قيم متغيرات البيئة (للمستخدم ينفّذها بنفسه):
   WORDPRESS_GRAPHQL_ENDPOINT=https://<الدومين-من-doctor>/graphql
   NEXT_PUBLIC_SITE_URL=https://alifleet.com
⛔ خارج نطاقي بقرار منك: رفع/بناء Next.js — docker — Coolify — Traefik/SSL — تحويل الدومين
🔍 حالة Traefik/SSL/DNS كما رصدتها: <معلومة فقط>

🐳 ملاحظات البيئة (Docker/Coolify) — مهمة للاستمرارية:
   • نطاق الـ volume: <root / wp-content فقط>
   • wp-cli: منصَّب يدويًا في الكونتينر — **بيروح مع أي rebuild من Coolify**
   • اللي بيستمر بعد rebuild: <…>   واللي بيروح: <…>
   • لو الثوابت مش في volume → لازم تتحوّل لمتغيرات بيئة في Coolify (انت اللي تعملها)

📌 محتاج لوحة تحكم (منك): مناطق الشحن في WooCommerce — الدومين والشهادة —
   <أي يوزر تجريبي اتعمل ومحتاج حذف>
⚠️ ملاحظات ومخاطر مفتوحة: <...>
🔑 أسرار: مفيش سر واحد اتطبع في أي رسالة
🧹 للتنظيف: sudo bash /tmp/agent-user.sh delete  ثم دوّر مفتاح الـ JWT وباسورد DB من Coolify
```

---

## 5) جدول القرار السريع (لو اتحيّرت)

| الحالة | القرار |
|---|---|
| الأمر بيقرأ بس، من خلال `wp-agent` | 🟢 نفّذ |
| الأمر بيكتب وموجود بالحرف في الملف ده | 🟢 نفّذ + تحقق |
| الأمر بيكتب ومش موجود في الملف ده | 🟡 اسأل |
| الأمر بيلمس DB / دومين / يوزرات | 🟡 اسأل — والمستخدم هو اللي ينفّذ |
| **`wp-agent` رفض الأمر** | ⛔ قف واسأل. **ممنوع تدوّر على طريقة تلف بيها** (زي `wp eval`) |
| **الأمر محتاج `docker`** | 🔴 ارفض. مفيش استثناء ومفيش صياغة تخلّيه مقبول |
| **الأمر بيمسّ كونتينر تاني أو Coolify** | 🔴 ارفض — السيرفر مشترك وفيه إنتاج لغيرك |
| الأمر جزء من رفع Next.js أو Traefik أو SSL أو تحويل الدومين | 🔴 ارفض واذكر إنه خارج نطاقك |
| تحقق فشل | ⛔ قف، بلّغ، متجرّبش تاني |
| الحقيقة على السيرفر مخالفة للمكتوب هنا | ⛔ قف وبلّغ بالفرق |
| **لقيت صلاحية أوسع من المكتوب هنا** (زي `docker` شغال) | ⛔ **بلّغ فورًا ومتستخدمهاش** — ده خلل، مش فرصة |
| المستخدم طلب حاجة في منطقة 🔴 | نبّه إنها خارج النطاق واطلب تأكيد صريح بالاسم |
