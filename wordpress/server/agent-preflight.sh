#!/usr/bin/env bash
# =============================================================================
#  agent-preflight.sh — جرد المهمة M0 في docs/AGENT.md
#  قراءة فقط. مفيش أي أمر كتابة في الملف ده — ولا حرف.
#
#  الاستخدام:
#    scp wordpress/server/agent-preflight.sh AGENT_USER@SERVER_IP:/tmp/
#    ssh AGENT_USER@SERVER_IP 'bash /tmp/agent-preflight.sh'
#
#  ⚠️ السكربت **مبيطبعش أي سر**. الثوابت بتتفحص بالوجود (موجود/ناقص) مش بالقيمة،
#     ومتغيرات بيئة الكونتينر بتتعرض بالأسماء بس.
# =============================================================================
#  ⚠️ السكربت ده اتغيّر جوهريًا — البيئة Docker مش تنصيب مباشر
#
#  النسخة القديمة كانت بتفحص /var/www/cms.alifleet.com و php -m و nginx -t على
#  الهوست. الواقع: /var/www فاضي، nginx و php-fpm inactive، WordPress جوه
#  كونتينر تحت Coolify، و Traefik ماسك 80/443.
#
#  والأهم: الـ agent **مش** عنده docker (عن قصد — docker = root على الهوص).
#  فكل حاجة جوه الكونتينر بتتقرا من خلال `sudo wp-agent`.
# =============================================================================

set -uo pipefail

CMS_HOST="${CMS_HOST:-cms.alifleet.com}"
WPA="sudo -n wp-agent"

hr()  { printf '\n──────────────────────────────────────────────────────────\n'; }
sec() { hr; printf '## %s\n\n' "$1"; }
ok()  { printf '  ✔ %s\n' "$1"; }
no()  { printf '  ✖ %s\n' "$1"; }
inf() { printf '  · %s\n' "$1"; }

# مختصر: تشغيل WP-CLI جوه الكونتينر
wp() { $WPA wp "$@" 2>/dev/null; }

printf '=========================================================\n'
printf ' ALI FLEET — جرد ما قبل التنفيذ (M0) — بيئة Docker/Coolify\n'
printf ' التاريخ : %s\n' "$(date '+%F %T')"
printf ' اليوزر  : %s@%s\n' "$(whoami)" "$(hostname)"
printf '=========================================================\n'

# ------------------------------------------------- 0) الباب على الكونتينر
sec "0) الباب على الكونتينر — wp-agent"
if ! command -v wp-agent >/dev/null 2>&1; then
  no "wp-agent مش مركّب على السيرفر → ⛔ قف. المستخدم لازم يشغّل agent-user.sh create"
  hr; exit 0
fi
if ! $WPA help >/dev/null 2>&1; then
  no "مش قادر أشغّل wp-agent بـ sudo → ⛔ قف. راجع /etc/sudoers.d/alifleet-agent"
  hr; exit 0
fi
ok "wp-agent شغال — ده الباب الوحيد على WordPress"

# فحص مقصود: لازم **يفشل**. لو نجح، الحماية مكسورة.
if sudo -n docker ps >/dev/null 2>&1; then
  no "خطر: docker متاح لليوزر ده مباشرة = root كامل على الهوست."
  no "     السيرفر مشترك وعليه 6 تطبيقات إنتاج تانية. ⛔ قف وبلّغ المستخدم فورًا."
else
  ok "docker مش متاح مباشرة (صح — الحصر سليم)"
fi

# --------------------------------------------------------------- 1) الهوست
sec "1) الهوست — للعلم بس، مفيش شغل هنا"
inf "التوزيعة : $( (. /etc/os-release && echo "$PRETTY_NAME") 2>/dev/null || echo unknown )"
inf "النواة   : $(uname -r)"
inf "الرام    : $(free -m 2>/dev/null | awk '/^Mem:/{print $2"MB total / "$7"MB available"}')"
inf "القرص    : $(df -h / 2>/dev/null | awk 'NR==2{print $4" free of "$2" ("$5" used)"}')"

printf '\n  خدمات الهوست (المتوقع إن أغلبها inactive — Traefik هو الماسك):\n'
for s in nginx php8.2-fpm php8.1-fpm php8.3-fpm mariadb mysql redis-server docker; do
  st=$(systemctl is-active "$s" 2>/dev/null || true)
  [ -n "$st" ] && inf "$s → $st"
done

printf '\n  /var/www على الهوست (المتوقع: فاضي — الملفات جوه الكونتينر):\n'
ls -A /var/www 2>/dev/null | sed 's/^/    /' || inf "(مش موجود أو مش مقروء)"
[ -z "$(ls -A /var/www 2>/dev/null)" ] && ok "/var/www فاضي — مطابق للمتوقع في بيئة Docker"

printf '\n  البورتات المستمعة:\n'
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | awk 'NR==1 || /:80 |:443 |:3000 |:8000 /' | sed 's/^/    /'

# ------------------------------------- 2) الحقائق الأربعة قبل أي كتابة 🚪
sec "2) 🚪 الحقائق الأربعة — لازم تتأكد قبل أي كتابة"
printf '  الناتج تحت من `wp-agent doctor`: متغيرات البيئة + الدومين +\n'
printf '  نطاق الـ volume + الإضافات النازلة فعلًا + mu-plugins.\n'
printf '  ⛔ أي تحذير (⚠) هنا = قف وبلّغ قبل M1.\n'
$WPA doctor || no "doctor فشل → ⛔ قف وبلّغ"

# ---------------------------------------------------------- 3) WordPress
sec "3) WordPress (جوه الكونتينر)"
if ! wp core is-installed >/dev/null 2>&1; then
  no "WordPress مش منصَّب جوه الكونتينر، أو wp-cli مش موجود."
  no "لو wp-cli ناقص: sudo wp-agent bootstrap ثم شغّل الجرد تاني."
  no "لو WordPress نفسه مش منصَّب → ⛔ قف وبلّغ."
  hr; exit 0
fi
ok "WordPress منصَّب"
inf "الإصدار    : $(wp core version)"
inf "siteurl    : $(wp option get siteurl)"
inf "home       : $(wp option get home)"
inf "permalinks : $(wp option get permalink_structure || echo '(فاضي — لازم /%postname%/)')"
inf "التسجيل    : users_can_register = $(wp option get users_can_register)"
inf "الدور      : default_role = $(wp option get default_role)"
inf "الفهرسة    : blog_public = $(wp option get blog_public)"
inf "التوقيت    : $(wp option get timezone_string)"

printf '\n  ⚠️ لو siteurl/home مختلفين عن الدومين اللي في Traefik labels (القسم 2)\n'
printf '     → ⛔ قف. تصحيحهم = تحويل دومين = خارج نطاقك تمامًا.\n'

# ---------------------------------------------- 4) بيئة PHP جوه الكونتينر
sec "4) PHP والامتدادات (جوه الكونتينر، مش على الهوست)"
inf "إصدار PHP : $(wp eval 'echo PHP_VERSION;')"
mods="$(wp eval 'echo implode("\n", get_loaded_extensions());')"
for m in mysqli curl gd mbstring xml zip intl bcmath exif imagick soap; do
  echo "$mods" | grep -qix "$m" && ok "$m" || no "$m ناقص"
done
printf '\n  ⚠️ امتداد ناقص = مشكلة صورة Docker، بتتحل بتعديل الصورة من Coolify.\n'
printf '     ممنوع apt install جوه الكونتينر — بيروح مع أول rebuild.\n'

# ------------------------------------------------------------ 5) الإضافات
sec "5) الإضافات"
printf '  المطلوبة (٦):\n'
active=$(wp plugin list --status=active --field=name)
allp=$(wp plugin list --field=name)
for p in woocommerce wp-graphql wp-graphql-jwt-authentication advanced-custom-fields advanced-custom-fields-pro wpgraphql-acf wp-graphql-woocommerce; do
  if echo "$active" | grep -qx "$p"; then       ok "$p — مفعّلة"
  elif echo "$allp" | grep -qx "$p"; then       no "$p — موجودة بس مش مفعّلة"
  else
    case "$p" in
      advanced-custom-fields-pro) inf "$p — غير موجودة (طبيعي لو المجانية مستخدمة)" ;;
      *) no "$p — غير موجودة" ;;
    esac
  fi
done

printf '\n  إضافات كاش صفحات (لازم تكون فاضية):\n'
cache_found=0
for p in wp-super-cache w3-total-cache litespeed-cache wp-fastest-cache wp-rocket; do
  echo "$allp" | grep -qx "$p" && { no "$p موجودة — ⚠️ بتكسر ردود GraphQL"; cache_found=1; }
done
[ "$cache_found" -eq 0 ] && ok "مفيش كاش صفحات"

printf '\n  كل الإضافات المفعّلة:\n'
wp plugin list --status=active --fields=name,version | sed 's/^/    /'

# ----------------------------------------------------- 6) ثوابت wp-config
sec "6) ثوابت wp-config (وجود فقط — بدون قيم)"
wp eval '
$c = [
  "GRAPHQL_JWT_AUTH_SECRET_KEY",
  "WP_MEMORY_LIMIT","WP_MAX_MEMORY_LIMIT",
  "DISALLOW_FILE_EDIT","WP_AUTO_UPDATE_CORE","WP_ENVIRONMENT_TYPE",
  "ALIFLEET_ALLOWED_ORIGINS",
];
foreach ($c as $k) { echo (defined($k) ? "  ✔ " : "  ✖ ") . $k . (defined($k) ? " موجود\n" : " ناقص\n"); }
' || no "wp eval فشل"
printf '\n  ⚠️ راجع نطاق الـ volume في القسم 2 قبل M2: لو /var/www/html مش مغطّى\n'
printf '     بـ volume، أي `wp config set` بيروح مع أول rebuild من Coolify،\n'
printf '     والثوابت لازم تتحوّل لمتغيرات بيئة في اللوحة. ⛔ اسأل المستخدم.\n'

# --------------------------------------------------------- 7) mu-plugin
sec "7) mu-plugin و CPT"
$WPA ls mu-plugins >/dev/null 2>&1 \
  && $WPA ls mu-plugins | sed 's/^/    /' \
  || no "wp-content/mu-plugins غير موجود → المهمة M3"
if $WPA ls mu-plugins 2>/dev/null | grep -q 'alifleet-cms.php'; then
  ok "alifleet-cms.php موجود"
  $WPA lint mu-plugins/alifleet-cms.php 2>&1 | sed 's/^/    /'
else
  no "alifleet-cms.php غير موجود → المهمة M3"
fi
wp eval 'echo post_type_exists("import_car") ? "  ✔ CPT import_car مسجّل\n" : "  ✖ CPT import_car غير مسجّل\n";'

# --------------------------------------------------------------- 8) ACF
sec "8) مجموعات ACF (المتوقع ١٠)"
wp eval '
if (!function_exists("acf_get_field_groups")) { echo "  ✖ ACF مش محمّلة\n"; return; }
$g = acf_get_field_groups();
printf("  العدد: %d\n", count($g));
foreach ($g as $x) {
  printf("    %-46s graphql:%s\n", $x["key"], !empty($x["show_in_graphql"]) ? "on" : "OFF");
}
' || no "قراءة ACF فشلت"

# -------------------------------------------------------------- 9) الداتا
sec "9) الداتا الموجودة (المتوقع بعد الاستيراد: 6 / 7 / 12 / 6)"
for pt in page import_car product post; do
  n=$(wp post list --post_type="$pt" --post_status=any --format=count || echo '?')
  inf "$pt = $n"
done
inf "صفحة رئيسية: page_on_front = $(wp option get page_on_front)"
inf "صفحة مقالات : page_for_posts = $(wp option get page_for_posts)"

# ------------------------------------------------------ 10) WooCommerce
sec "10) WooCommerce"
if echo "$active" | grep -qx woocommerce; then
  inf "العملة   : $(wp option get woocommerce_currency) (المطلوب ILS)"
  inf "البلد    : $(wp option get woocommerce_default_country)"
  inf "صفحة سلة : $(wp option get woocommerce_cart_page_id)"
  inf "صفحة حساب: $(wp option get woocommerce_myaccount_page_id)"
else
  no "WooCommerce مش مفعّلة"
fi

# ----------------------------------------------------------- 11) GraphQL
sec "11) GraphQL"
printf '  Traefik ماسك 80/443 على الهوست، فالاختبار المحلي بيعدّي عليه.\n\n'
code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 \
  -H "Host: $CMS_HOST" -H 'Content-Type: application/json' \
  --data '{"query":"{ generalSettings { title } }"}' \
  "http://127.0.0.1/graphql" 2>/dev/null || echo 000)
[ "$code" = "200" ] && ok "POST http://127.0.0.1/graphql (Host: $CMS_HOST) → 200" \
  || no "POST /graphql → $code — بلّغ بس. ⛔ ممنوع تلمس Traefik أو Coolify."

code=$(curl -s -o /dev/null -w '%{http_code}' -m 15 \
  -H 'Content-Type: application/json' \
  --data '{"query":"{ generalSettings { title } }"}' \
  "https://$CMS_HOST/graphql" 2>/dev/null || echo 000)
[ "$code" = "200" ] && ok "POST https://$CMS_HOST/graphql → 200 (الدومين والشهادة شغالين)" \
  || no "POST https://$CMS_HOST/graphql → $code — الدومين/الشهادة مسؤولية المستخدم من لوحة Coolify"

# -------------------------------- 12) الدومين والشهادة — خارج النطاق تمامًا
sec "12) الدومين والشهادة — 🔴 خارج نطاق الـ agent بالكامل"
cat <<'EOF'
  الطبقة دي بقت Traefik + Coolify، مش nginx + certbot:
    · القسم 11 في docs/WORDPRESS-SETUP.md (nginx + certbot) **ملغي** — مش
      "محرَّم" بس، هو غير قابل للتنفيذ أصلًا لأن مفيش nginx شغال على الهوست.
    · ربط الدومين وإصدار الشهادة وقواعد التوجيه كلها من لوحة Coolify (بورت
      8000) والمستخدم هو اللي يعملها.
    · الـ agent ممنوع من: /data/coolify، متغيرات بيئة Coolify، أي كونتينر
      غير كونتينر WordPress، وأي أمر docker.
  اكتب الحالة في تقريرك للعلم وبس.
EOF

# ------------------------------------------------------------- الخلاصة
hr
cat <<'EOF'
## الخلاصة — الخطوة التالية

1. حوّل الناتج ده لتقرير M0 بالجدول اللي في docs/AGENT.md (مهمة M0).
2. ⛔ قف. متكتبش حرف واحد على السيرفر قبل موافقة المستخدم على التقرير.

3. البوابات اللي **لازم** تتحل في التقرير قبل M1:
   · متغيرات بيئة الكونتينر والدومين المربوط (القسم 2)
   · نطاق الـ volume — بيغطي /var/www/html كامل ولا wp-content بس؟ (القسم 2)
     لو wp-content بس → ثوابت M2 لازم تبقى متغيرات بيئة في Coolify. اسأل.
   · الإضافات النازلة فعلًا (القسم 2 و 5) — الجدول القديم كان افتراض
   · mu-plugins موجودة ومغطّاة بـ volume؟ (القسم 2 و 7)

4. أي ✖ في "الداتا" أو "ACF" = المهمة لسه محتاجة تتعمل — مش خطأ.
   أي ✖ في "wp-agent" أو "WordPress منصَّب" أو أي ⚠ في القسم 2 = ⛔ توقف وبلّغ.
5. لو docker طلع متاح لليوزر (القسم 0) = خلل أمني. ⛔ قف فورًا وبلّغ.
6. لو الداتا موجودة أصلًا (6/7/12/6) → اسأل المستخدم: تحديث ولا وقوف؟
EOF
hr
