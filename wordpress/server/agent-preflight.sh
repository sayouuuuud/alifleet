#!/usr/bin/env bash
# =============================================================================
#  agent-preflight.sh — جرد المهمة M0 في docs/AGENT.md
#  قراءة فقط. مفيش أي أمر كتابة في الملف ده — ولا حرف.
#
#  الاستخدام:
#    scp wordpress/server/agent-preflight.sh AGENT_USER@SERVER_IP:/tmp/
#    ssh AGENT_USER@SERVER_IP 'bash /tmp/agent-preflight.sh'
#
#  مسار مختلف؟
#    WP_PATH=/srv/wordpress bash /tmp/agent-preflight.sh
#
#  ⚠️ السكربت **مبيطبعش أي سر**. الثوابت بتتفحص بالوجود (موجود/ناقص) مش بالقيمة.
# =============================================================================

set -uo pipefail

WP_PATH="${WP_PATH:-/var/www/cms.alifleet.com}"
CMS_HOST="${CMS_HOST:-cms.alifleet.com}"

hr()  { printf '\n──────────────────────────────────────────────────────────\n'; }
sec() { hr; printf '## %s\n\n' "$1"; }
ok()  { printf '  ✔ %s\n' "$1"; }
no()  { printf '  ✖ %s\n' "$1"; }
inf() { printf '  · %s\n' "$1"; }

printf '=========================================================\n'
printf ' ALI FLEET — جرد ما قبل التنفيذ (M0)\n'
printf ' التاريخ : %s\n' "$(date '+%F %T')"
printf ' اليوزر  : %s@%s\n' "$(whoami)" "$(hostname)"
printf ' مسار WP : %s\n' "$WP_PATH"
printf '=========================================================\n'

# ---------------------------------------------------------------- 1) النظام
sec "1) النظام"
inf "التوزيعة : $( (. /etc/os-release && echo "$PRETTY_NAME") 2>/dev/null || echo unknown )"
inf "النواة   : $(uname -r)"
inf "الرام    : $(free -m 2>/dev/null | awk '/^Mem:/{print $2"MB total / "$7"MB available"}')"
inf "القرص    : $(df -h / 2>/dev/null | awk 'NR==2{print $4" free of "$2" ("$5" used)"}')"

for b in php mysql node pnpm pm2 wp nginx unzip curl; do
  if command -v "$b" >/dev/null 2>&1; then
    case "$b" in
      php)   ok "php   $(php -r 'echo PHP_VERSION;' 2>/dev/null)" ;;
      node)  ok "node  $(node -v 2>/dev/null)" ;;
      wp)    ok "wp-cli $(wp --version 2>/dev/null | awk '{print $2}')" ;;
      nginx) ok "nginx $(nginx -v 2>&1 | sed 's|.*/||')" ;;
      mysql) ok "mysql client $(mysql --version 2>/dev/null | awk '{print $3}')" ;;
      *)     ok "$b موجود" ;;
    esac
  else
    no "$b غير موجود"
  fi
done

printf '\n  الخدمات:\n'
for s in nginx php8.2-fpm php8.1-fpm php8.3-fpm mariadb mysql redis-server; do
  st=$(systemctl is-active "$s" 2>/dev/null || true)
  [ -n "$st" ] && [ "$st" != "inactive" ] && [ "$st" != "unknown" ] && inf "$s → $st"
done

# ---------------------------------------------- 2) امتدادات PHP المطلوبة
sec "2) امتدادات PHP اللي WordPress و WooCommerce محتاجينها"
mods=$(php -m 2>/dev/null || true)
for m in mysqli curl gd mbstring xml zip intl bcmath exif imagick soap; do
  echo "$mods" | grep -qix "$m" && ok "$m" || no "$m ناقص"
done

# ---------------------------------------------------------- 3) WordPress
sec "3) WordPress"
if [ ! -d "$WP_PATH" ]; then
  no "المسار $WP_PATH غير موجود — ⛔ قف وبلّغ المستخدم بالمسار الصحيح"
  hr; exit 0
fi
ok "المسار موجود"
inf "المالك: $(stat -c '%U:%G' "$WP_PATH" 2>/dev/null)"
cd "$WP_PATH" || exit 0

if ! wp core is-installed >/dev/null 2>&1; then
  no "WordPress مش منصَّب في المسار ده — ⛔ قف وبلّغ"
  hr; exit 0
fi
ok "WordPress منصَّب"
inf "الإصدار    : $(wp core version 2>/dev/null)"
inf "siteurl    : $(wp option get siteurl 2>/dev/null)"
inf "home       : $(wp option get home 2>/dev/null)"
inf "permalinks : $(wp option get permalink_structure 2>/dev/null || echo '(فاضي — لازم /%postname%/)')"
inf "التسجيل    : users_can_register = $(wp option get users_can_register 2>/dev/null)"
inf "الدور      : default_role = $(wp option get default_role 2>/dev/null)"
inf "الفهرسة    : blog_public = $(wp option get blog_public 2>/dev/null)"
inf "التوقيت    : $(wp option get timezone_string 2>/dev/null)"

# ------------------------------------------------------------ 4) الإضافات
sec "4) الإضافات"
printf '  المطلوبة (٦):\n'
active=$(wp plugin list --status=active --field=name 2>/dev/null || true)
allp=$(wp plugin list --field=name 2>/dev/null || true)
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
  echo "$allp" | grep -qx "$p" && { no "$p موجودة — ⚠️ بتكسر ردود GraphQL (قسم 3.4)"; cache_found=1; }
done
[ "$cache_found" -eq 0 ] && ok "مفيش كاش صفحات"

printf '\n  كل الإضافات المفعّلة:\n'
wp plugin list --status=active --fields=name,version 2>/dev/null | sed 's/^/    /'

# ----------------------------------------------------- 5) ثوابت wp-config
sec "5) ثوابت wp-config (وجود فقط — بدون قيم)"
wp eval '
$c = [
  "GRAPHQL_JWT_AUTH_SECRET_KEY",
  "WP_MEMORY_LIMIT","WP_MAX_MEMORY_LIMIT",
  "DISALLOW_FILE_EDIT","WP_AUTO_UPDATE_CORE","WP_ENVIRONMENT_TYPE",
  "ALIFLEET_ALLOWED_ORIGINS",
];
foreach ($c as $k) { echo (defined($k) ? "  ✔ " : "  ✖ ") . $k . (defined($k) ? " موجود\n" : " ناقص\n"); }
' 2>/dev/null || no "wp eval فشل"

# --------------------------------------------------------- 6) mu-plugin
sec "6) mu-plugin و CPT"
if [ -f "wp-content/mu-plugins/alifleet-cms.php" ]; then
  ok "الملف موجود"
  php -l wp-content/mu-plugins/alifleet-cms.php 2>&1 | sed 's/^/    /'
else
  no "wp-content/mu-plugins/alifleet-cms.php غير موجود → المهمة M3"
fi
wp eval 'echo post_type_exists("import_car") ? "  ✔ CPT import_car مسجّل\n" : "  ✖ CPT import_car غير مسجّل\n";' 2>/dev/null

# --------------------------------------------------------------- 7) ACF
sec "7) مجموعات ACF (المتوقع ١٠)"
wp eval '
if (!function_exists("acf_get_field_groups")) { echo "  ✖ ACF مش محمّلة\n"; return; }
$g = acf_get_field_groups();
printf("  العدد: %d\n", count($g));
foreach ($g as $x) {
  printf("    %-46s graphql:%s\n", $x["key"], !empty($x["show_in_graphql"]) ? "on" : "OFF");
}
' 2>/dev/null || no "قراءة ACF فشلت"

# -------------------------------------------------------------- 8) الداتا
sec "8) الداتا الموجودة (المتوقع بعد الاستيراد: 6 / 7 / 12 / 6)"
for pt in page import_car product post; do
  n=$(wp post list --post_type="$pt" --post_status=any --format=count 2>/dev/null || echo '?')
  inf "$pt = $n"
done
inf "صفحة رئيسية: page_on_front = $(wp option get page_on_front 2>/dev/null)"
inf "صفحة مقالات : page_for_posts = $(wp option get page_for_posts 2>/dev/null)"

# ------------------------------------------------------- 9) WooCommerce
sec "9) WooCommerce"
if echo "$active" | grep -qx woocommerce; then
  inf "العملة   : $(wp option get woocommerce_currency 2>/dev/null) (المطلوب ILS)"
  inf "البلد    : $(wp option get woocommerce_default_country 2>/dev/null)"
  inf "صفحة سلة : $(wp option get woocommerce_cart_page_id 2>/dev/null)"
  inf "صفحة حساب: $(wp option get woocommerce_myaccount_page_id 2>/dev/null)"
else
  no "WooCommerce مش مفعّلة"
fi

# ----------------------------------------------------------- 10) GraphQL
sec "10) GraphQL (محلي — بدون لمس nginx)"
code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 \
  -H "Host: $CMS_HOST" -H 'Content-Type: application/json' \
  --data '{"query":"{ generalSettings { title } }"}' \
  "http://127.0.0.1/graphql" 2>/dev/null || echo 000)
[ "$code" = "200" ] && ok "POST /graphql → 200" || no "POST /graphql → $code (بلّغ بس — ممنوع تلمس nginx)"

# ----------------------------------------------- 11) nginx / SSL / DNS
sec "11) nginx / SSL / DNS — 🔴 معلومة فقط، خارج نطاق الـ agent"
ls /etc/nginx/sites-enabled/ 2>/dev/null | sed 's/^/    /' || inf "مش قادر أقرأ sites-enabled"
if command -v certbot >/dev/null 2>&1; then
  inf "certbot منصَّب — الشهادات:"
  ls /etc/letsencrypt/live/ 2>/dev/null | sed 's/^/    /' || inf "    (مش قادر أقرأ)"
else
  inf "certbot مش منصَّب"
fi
inf "استماع البورتات:"
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | awk 'NR==1 || /:80 |:443 |:3000 /' | sed 's/^/    /'

# ------------------------------------------------------------- الخلاصة
hr
cat <<'EOF'
## الخلاصة — الخطوة التالية

1. حوّل الناتج ده لتقرير M0 بالجدول اللي في docs/AGENT.md (مهمة M0).
2. ⛔ قف. متكتبش حرف واحد على السيرفر قبل موافقة المستخدم على التقرير.
3. أي ✖ في بند "الداتا" أو "ACF" = المهمة لسه محتاجة تتعمل — مش خطأ.
   أي ✖ في "المسار" أو "WordPress منصَّب" = ⛔ توقف وبلّغ.
4. لو الداتا موجودة أصلًا (6/7/12/6) → اسأل المستخدم: تحديث ولا وقوف؟
5. بند nginx/SSL/DNS للعلم بس. ممنوع أي إجراء عليه.
EOF
hr
