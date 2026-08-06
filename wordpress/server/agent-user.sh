#!/usr/bin/env bash
# ============================================================================
#  إنشاء / إلغاء اليوزر المؤقت بتاع الـ agent
#  ALI FLEET — temporary agent account provisioning
# ----------------------------------------------------------------------------
#  ⚠️ الملف ده **للمستخدم (صاحب السيرفر)** — مش للـ agent.
#     الـ agent ممنوع من adduser/passwd/visudo (شوف alifleet-agent.sudoers).
#
#  الاستخدام:
#     sudo bash agent-user.sh create      # إنشاء اليوزر + الباسورد + الصلاحيات
#     sudo bash agent-user.sh status      # عرض الحالة الحالية
#     sudo bash agent-user.sh revoke      # قفل الحساب فورًا (طوارئ)
#     sudo bash agent-user.sh delete      # مسح الحساب نهائيًا بعد التسليم
#
#  لازم تتنفّذ كـ root (أو بـ sudo) من يوزر عنده sudo كامل.
# ============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
#  إعدادات — عدّلها لو مختلفة عندك
# ---------------------------------------------------------------------------
AGENT_USER="afagent"
WP_PATH="/var/www/cms.alifleet.com"
SUDOERS_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/alifleet-agent.sudoers"
SUDOERS_DST="/etc/sudoers.d/alifleet-agent"
EXPIRE_DAYS="3"          # الحساب بيتقفل تلقائيًا بعد كام يوم

# ---------------------------------------------------------------------------
c_ok()   { printf '\033[0;32m✔\033[0m %s\n' "$1"; }
c_warn() { printf '\033[0;33m⚠\033[0m %s\n' "$1"; }
c_err()  { printf '\033[0;31m✖\033[0m %s\n' "$1"; }
c_head() { printf '\n\033[1;36m== %s ==\033[0m\n' "$1"; }

need_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    c_err "لازم تشغّل السكربت بـ sudo:  sudo bash agent-user.sh $*"
    exit 1
  fi
}

# ===========================================================================
#  create
# ===========================================================================
do_create() {
  c_head "1/7 — التحقق من المتطلبات"

  if [[ ! -d "$WP_PATH" ]]; then
    c_err "مسار ووردبريس مش موجود: $WP_PATH"
    c_err "عدّل WP_PATH في أول السكربت وأعد المحاولة."
    exit 1
  fi
  c_ok "مسار ووردبريس: $WP_PATH"

  if [[ ! -f "$SUDOERS_SRC" ]]; then
    c_err "ملف الـ sudoers مش موجود جنب السكربت: $SUDOERS_SRC"
    c_err "ارفع wordpress/server/alifleet-agent.sudoers في نفس المجلد."
    exit 1
  fi
  c_ok "ملف الـ sudoers موجود"

  if id "$AGENT_USER" &>/dev/null; then
    c_warn "اليوزر $AGENT_USER موجود بالفعل — هيتم تحديث الباسورد والصلاحيات بس."
  fi

  # -----------------------------------------------------------------------
  c_head "2/7 — توليد باسورد قوي"
  # 24 حرف base64 من /dev/urandom. مفيش أي اعتماد على أدوات خارجية.
  AGENT_PASS="$(head -c 18 /dev/urandom | base64 | tr -d '\n/+=' )$(head -c 6 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 6)"
  c_ok "الباسورد اتولّد (24 حرف) — هيتعرض مرة واحدة في آخر السكربت"

  # -----------------------------------------------------------------------
  c_head "3/7 — إنشاء اليوزر"
  if ! id "$AGENT_USER" &>/dev/null; then
    # --disabled-password: مفيش باسورد وقت الإنشاء، بنحطّه بعدين بـ chpasswd
    adduser --disabled-password --gecos "ALI FLEET temp agent" "$AGENT_USER"
    c_ok "اليوزر $AGENT_USER اتعمل"
  fi

  printf '%s:%s\n' "$AGENT_USER" "$AGENT_PASS" | chpasswd
  c_ok "الباسورد اتظبط"

  # مهم: مش بنضيفه لمجموعة sudo. صلاحياته من /etc/sudoers.d/ بس.
  if id -nG "$AGENT_USER" | tr ' ' '\n' | grep -qx 'sudo'; then
    deluser "$AGENT_USER" sudo || true
    c_warn "اليوزر كان في مجموعة sudo — اتشال منها"
  fi
  c_ok "اليوزر مش في مجموعة sudo (صح)"

  # -----------------------------------------------------------------------
  c_head "4/7 — تاريخ انتهاء تلقائي"
  EXPIRE_DATE="$(date -u -d "+${EXPIRE_DAYS} days" +%Y-%m-%d)"
  chage -E "$EXPIRE_DATE" "$AGENT_USER"
  c_ok "الحساب بيتقفل تلقائيًا يوم $EXPIRE_DATE (بعد $EXPIRE_DAYS أيام)"

  # -----------------------------------------------------------------------
  c_head "5/7 — صلاحيات مجلد ووردبريس"
  # مجلد ووردبريس مملوك deploy:www-data. الـ agent محتاج يكتب في
  # plugins / mu-plugins / uploads بس — مش في core ولا wp-config.
  usermod -aG www-data "$AGENT_USER"
  c_ok "اتضاف لمجموعة www-data"

  mkdir -p "$WP_PATH/wp-content/mu-plugins"
  for d in plugins mu-plugins uploads; do
    target="$WP_PATH/wp-content/$d"
    [[ -d "$target" ]] || continue
    chgrp -R www-data "$target"
    chmod -R g+w "$target"
    chmod g+s "$target"          # setgid: أي ملف جديد يورث المجموعة
    c_ok "صلاحية كتابة للمجموعة على wp-content/$d"
  done

  # wp-config.php: قراءة للمجموعة بس. الـ agent محتاج يعدّل الثوابت (القسم 4)
  # لكن مش لازم يمسح الملف — فالمجلد الأب مفيهوش صلاحية كتابة للمجموعة.
  if [[ -f "$WP_PATH/wp-config.php" ]]; then
    chgrp www-data "$WP_PATH/wp-config.php"
    chmod 664 "$WP_PATH/wp-config.php"
    c_ok "wp-config.php قابل للتعديل من المجموعة (664)"
    c_warn "الـ agent هيقدر يعدّل wp-config.php — ده مقصود (القسم 4)."
    c_warn "بس معناه إنه هيقدر يقرأ بيانات قاعدة البيانات. الرَنبوك بيمنعه"
    c_warn "من طبعها أو استخدامها، ولكن خُد نسخة احتياطية قبل التسليم."
  fi

  # -----------------------------------------------------------------------
  c_head "6/7 — تركيب قايمة الـ sudo المحدودة"
  install -m 0440 -o root -g root "$SUDOERS_SRC" "$SUDOERS_DST"
  if visudo -c -f "$SUDOERS_DST" >/dev/null 2>&1 && visudo -c >/dev/null 2>&1; then
    c_ok "قايمة الـ sudo اتركّبت وعدّت الفحص (parsed OK)"
  else
    c_err "ملف الـ sudoers فيه غلط — بيتشال فورًا لتجنّب كسر sudo"
    rm -f "$SUDOERS_DST"
    visudo -c || true
    exit 1
  fi

  # -----------------------------------------------------------------------
  c_head "7/7 — ملخص الصلاحيات الفعلية"
  echo "أوامر sudo المسموحة لليوزر:"
  sudo -l -U "$AGENT_USER" 2>/dev/null | sed 's/^/    /' || c_warn "متعرفش تقرأ القايمة"

  # -----------------------------------------------------------------------
  cat <<EOF

════════════════════════════════════════════════════════════════════
  بيانات الدخول — اعرضها مرة واحدة، متسيبهاش في أي ملف
════════════════════════════════════════════════════════════════════

    ssh $AGENT_USER@$(hostname -I 2>/dev/null | awk '{print $1}')
    password: $AGENT_PASS

  ينتهي تلقائيًا: $EXPIRE_DATE

════════════════════════════════════════════════════════════════════
  اللي لازم تعمله قبل ما تسلّم التيرمينال
════════════════════════════════════════════════════════════════════

  1) نسخة احتياطية لقاعدة البيانات — الـ agent ممنوع من wp db:
       cd $WP_PATH && wp db export ~/backup-\$(date +%F-%H%M).sql

  2) نسخة احتياطية لـ wp-config:
       cp $WP_PATH/wp-config.php ~/wp-config.php.bak

  3) انسخ البرومبت من docs/AGENT.md وإداهله.

  4) خلّي عينك على اللي بيعمله:
       sudo journalctl -f _COMM=sudo
       sudo tail -f /var/log/auth.log

════════════════════════════════════════════════════════════════════
  بعد ما يخلّص — امسح الحساب فورًا
════════════════════════════════════════════════════════════════════

    sudo bash agent-user.sh delete

EOF
  c_warn "الباسورد فوق مش متسجّل في أي مكان تاني. لو ضاع، شغّل create تاني."
}

# ===========================================================================
#  status
# ===========================================================================
do_status() {
  c_head "حالة يوزر الـ agent"

  if ! id "$AGENT_USER" &>/dev/null; then
    c_ok "اليوزر $AGENT_USER مش موجود — مفيش وصول مفتوح"
  else
    c_warn "اليوزر $AGENT_USER موجود"
    echo "    المجموعات : $(id -nG "$AGENT_USER")"
    echo "    الانتهاء  : $(chage -l "$AGENT_USER" 2>/dev/null | grep -i 'Account expires' | cut -d: -f2- | xargs)"
    echo "    الحالة    : $(passwd -S "$AGENT_USER" 2>/dev/null | awk '{print $2}') (P=شغال L=مقفول)"
    if id -nG "$AGENT_USER" | tr ' ' '\n' | grep -qx 'sudo'; then
      c_err "خطر: اليوزر في مجموعة sudo — شيله فورًا: sudo deluser $AGENT_USER sudo"
    fi
  fi

  if [[ -f "$SUDOERS_DST" ]]; then
    c_warn "قايمة الـ sudo مركّبة: $SUDOERS_DST"
  else
    c_ok "قايمة الـ sudo مش مركّبة"
  fi

  c_head "الجلسات المفتوحة حاليًا"
  who | grep -w "$AGENT_USER" || c_ok "مفيش جلسة مفتوحة لليوزر"

  c_head "آخر 15 أمر sudo"
  grep -h "$AGENT_USER" /var/log/auth.log 2>/dev/null | grep -i sudo | tail -15 \
    || journalctl _COMM=sudo --no-pager 2>/dev/null | grep "$AGENT_USER" | tail -15 \
    || c_ok "مفيش سجل"
}

# ===========================================================================
#  revoke — قفل فوري بدون مسح (للطوارئ)
# ===========================================================================
do_revoke() {
  c_head "قفل فوري لحساب الـ agent"

  if ! id "$AGENT_USER" &>/dev/null; then
    c_ok "اليوزر مش موجود أصلًا"
    return
  fi

  # 1) اقفل الباسورد
  passwd -l "$AGENT_USER" && c_ok "الباسورد اتقفل"

  # 2) خلّي الشِل مرفوض
  usermod -s /usr/sbin/nologin "$AGENT_USER" && c_ok "الشِل بقى nologin"

  # 3) اقفل الحساب بتاريخ فات
  chage -E 0 "$AGENT_USER" && c_ok "الحساب منتهي"

  # 4) اشيل قايمة الـ sudo
  if [[ -f "$SUDOERS_DST" ]]; then
    rm -f "$SUDOERS_DST"
    c_ok "قايمة الـ sudo اتشالت"
  fi

  # 5) اقطع أي جلسة شغالة
  if pkill -KILL -u "$AGENT_USER" 2>/dev/null; then
    c_ok "الجلسات المفتوحة اتقطعت"
  else
    c_ok "مفيش جلسات شغالة"
  fi

  c_warn "الحساب مقفول بس لسه موجود. للمسح النهائي: sudo bash agent-user.sh delete"
}

# ===========================================================================
#  delete
# ===========================================================================
do_delete() {
  c_head "مسح حساب الـ agent نهائيًا"

  [[ -f "$SUDOERS_DST" ]] && { rm -f "$SUDOERS_DST"; c_ok "قايمة الـ sudo اتشالت"; }

  if id "$AGENT_USER" &>/dev/null; then
    pkill -KILL -u "$AGENT_USER" 2>/dev/null || true
    deluser --remove-home "$AGENT_USER" && c_ok "اليوزر ومجلد الهوم اتمسحوا"
  else
    c_ok "اليوزر مش موجود"
  fi

  # رجّع wp-config لصلاحية أضيق
  if [[ -f "$WP_PATH/wp-config.php" ]]; then
    chmod 640 "$WP_PATH/wp-config.php"
    c_ok "wp-config.php رجع 640"
  fi

  c_head "خطوة أخيرة مهمة"
  c_warn "الـ agent كان شايف wp-config.php. لو عايز تكون 100% مطمّن،"
  c_warn "غيّر باسورد يوزر قاعدة البيانات وحدّث DB_PASSWORD في wp-config.php."
  c_warn "وكمان دوّر أي مفتاح كان مكتوب في الثوابت (القسم 4)."
}

# ===========================================================================
case "${1:-}" in
  create) need_root "$@"; do_create ;;
  status) need_root "$@"; do_status ;;
  revoke) need_root "$@"; do_revoke ;;
  delete) need_root "$@"; do_delete ;;
  *)
    cat <<EOF
الاستخدام: sudo bash agent-user.sh <أمر>

  create   إنشاء اليوزر المؤقت + باسورد عشوائي + الصلاحيات المحدودة
  status   عرض حالة اليوزر والجلسات وآخر أوامر sudo
  revoke   قفل فوري للحساب (طوارئ) — من غير مسح
  delete   مسح الحساب نهائيًا بعد ما الـ agent يخلّص

الإعدادات الحالية (عدّلها في أول الملف لو مختلفة):
  AGENT_USER  = $AGENT_USER
  WP_PATH     = $WP_PATH
  EXPIRE_DAYS = $EXPIRE_DAYS
EOF
    exit 1 ;;
esac
