#!/usr/bin/env bash
# ============================================================================
#  إنشاء / إلغاء اليوزر المؤقت بتاع الـ agent
#  ALI FLEET — temporary agent account provisioning (Docker / Coolify)
# ----------------------------------------------------------------------------
#  ⚠️ الملف ده **للمستخدم (صاحب السيرفر)** — مش للـ agent.
#     الـ agent ممنوع من adduser/passwd/visudo/docker (شوف alifleet-agent.sudoers).
#
#  الاستخدام:
#     sudo bash agent-user.sh create      # إنشاء اليوزر + الباسورد + الصلاحيات
#     sudo bash agent-user.sh status      # عرض الحالة الحالية
#     sudo bash agent-user.sh backup      # نسخة احتياطية (DB + wp-config) — قبل التسليم
#     sudo bash agent-user.sh revoke      # قفل الحساب فورًا (طوارئ)
#     sudo bash agent-user.sh delete      # مسح الحساب نهائيًا بعد التسليم
#
#  لازم تتنفّذ كـ root (أو بـ sudo) من يوزر عنده sudo كامل.
# ============================================================================
#  ⚠️ الملف ده اتغيّر جوهريًا — البيئة مش اللي الخطط كانت مبنية عليه
#
#  النسخة القديمة كانت بتدوّر على wp-config.php على القرص وتظبط صلاحيات
#  /var/www/cms.alifleet.com. الواقع:
#
#    · WordPress جوه كونتينر Docker (wordpress:latest) تحت إدارة Coolify 4.1.2
#    · /var/www على الهوست **فاضي تمامًا**
#    · MySQL 8 في كونتينر منفصل. mariadb/mysql على الهوست inactive
#    · Traefik v3.6 ماسك 80/443. nginx و php8.2-fpm inactive
#    · wp-cli مش منصّب لا على الهوست ولا جوه الكونتينر
#    · السيرفر **مشترك**: 16 كونتينر، منهم 6 تطبيقات إنتاج مش تابعة للمشروع
#
#  فالسكربت ده بقى: يتحقق من الكونتينر، يركّب سكربت wp-agent (الباب الوحيد)،
#  ويعمل يوزر مالوش أي علاقة بمجموعة docker ولا بمجموعة www-data على الهوست.
#  كل الكتابة بتحصل جوه الكونتينر عبر wp-agent — مش على القرص.
# ============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
#  إعدادات — عدّلها لو مختلفة عندك
# ---------------------------------------------------------------------------
AGENT_USER="afagent"
EXPIRE_DAYS="3"          # الحساب بيتقفل تلقائيًا بعد كام يوم

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDOERS_SRC="$HERE/alifleet-agent.sudoers"
SUDOERS_DST="/etc/sudoers.d/alifleet-agent"
WPAGENT_SRC="$HERE/wp-agent"
WPAGENT_DST="/usr/local/bin/wp-agent"
WPAGENT_LOG="/var/log/wp-agent.log"

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

# ---------------------------------------------------------------------------
#  قراءة اسم الكونتينر من جوه سكربت wp-agent — مصدر حقيقة واحد.
#  لو الاسم اتغيّر، بتعدّله في wp-agent بس، والسكربت ده بيمشي وراه.
# ---------------------------------------------------------------------------
read_container_names() {
  [[ -f "$WPAGENT_SRC" ]] || {
    c_err "سكربت wp-agent مش موجود جنب الملف ده: $WPAGENT_SRC"
    c_err "ارفع wordpress/server/wp-agent في نفس المجلد."
    exit 1
  }
  WP_CONTAINER="$(grep -m1 '^WP_CONTAINER=' "$WPAGENT_SRC" | cut -d'"' -f2)"
  DB_CONTAINER="$(grep -m1 '^DB_CONTAINER=' "$WPAGENT_SRC" | cut -d'"' -f2)"
  [[ -n "$WP_CONTAINER" ]] || { c_err "مقدرتش أقرأ WP_CONTAINER من $WPAGENT_SRC"; exit 1; }
}

# ---------------------------------------------------------------------------
#  التحقق من بيئة Docker — بدل البحث القديم عن wp-config.php على القرص
# ---------------------------------------------------------------------------
verify_docker_env() {
  command -v docker >/dev/null 2>&1 || {
    c_err "docker مش منصّب — السكربت ده مخصوص لبيئة Docker/Coolify."
    c_err "لو WordPress عندك تنصيب مباشر، انت على الملف الغلط."
    exit 1
  }
  c_ok "docker موجود: $(docker --version | cut -d, -f1)"

  local state
  state="$(docker inspect -f '{{.State.Status}}' "$WP_CONTAINER" 2>/dev/null || true)"
  if [[ -z "$state" ]]; then
    c_err "الكونتينر '$WP_CONTAINER' مش موجود."
    c_err "الكونتينرات اللي فيها wordpress:"
    docker ps -a --format '    {{.Names}}\t{{.Image}}\t{{.Status}}' | grep -i wordpress || echo "    (ولا واحد)"
    c_err "عدّل WP_CONTAINER في أول $WPAGENT_SRC وشغّل تاني."
    exit 1
  fi
  [[ "$state" == "running" ]] || { c_err "الكونتينر '$WP_CONTAINER' حالته: $state (المطلوب running)"; exit 1; }
  c_ok "كونتينر WordPress شغال: $WP_CONTAINER"

  # الحصر جوه الكونتينر هو الحماية الأساسية. لو مكسور، الباقي ملوش قيمة.
  if docker inspect -f '{{range .Mounts}}{{println .Source}}{{end}}' "$WP_CONTAINER" | grep -q 'docker.sock'; then
    c_err "docker.sock متمرَّر جوه الكونتينر → الـ agent هيقدر يخرج للهوست."
    c_err "الحماية كلها مبنية على الحصر جوه الكونتينر. متسلّمش وصول والحالة كده."
    exit 1
  fi
  c_ok "docker.sock مش متمرَّر جوه الكونتينر"

  if [[ "$(docker inspect -f '{{.HostConfig.Privileged}}' "$WP_CONTAINER")" == "true" ]]; then
    c_err "الكونتينر privileged → الحصر ضعيف. متسلّمش وصول والحالة كده."
    exit 1
  fi
  c_ok "الكونتينر مش privileged"

  # نطاق الـ volume — بيحدد إذا كان تعديل wp-config بيستمر بعد rebuild
  c_warn "الـ volumes المربوطة:"
  docker inspect -f '{{range .Mounts}}    {{.Destination}} ⟵ {{.Source}}{{println}}{{end}}' "$WP_CONTAINER"
  if docker inspect -f '{{range .Mounts}}{{println .Destination}}{{end}}' "$WP_CONTAINER" | grep -qx '/var/www/html'; then
    c_ok "الـ volume بيغطي /var/www/html كامل → تعديل wp-config.php بيستمر"
  else
    c_warn "الـ volume مش بيغطي /var/www/html كامل."
    c_warn "معناه إن تعديل wp-config.php (ثوابت M2) **بيروح** مع أي rebuild من Coolify،"
    c_warn "ولازم الثوابت تتحوّل لمتغيرات بيئة في لوحة Coolify بدل تعديل الملف."
    c_warn "الـ agent بيبلّغك بده في M0 — القرار قرارك."
  fi
}

# ===========================================================================
#  check_ssh_password_login
#
#  السكربت بيظبط باسورد، بس أغلب الـ VPS بتكون PasswordAuthentication no.
#  في الحالة دي الباسورد ملوش أي لازمة والـ agent مش هيقدر يدخل خالص.
#  بنفحص ونبلّغ **وبس** — مش بنعدّل إعدادات SSH لوحدنا، ده قرار المستخدم.
# ===========================================================================
check_ssh_password_login() {
  echo "حالة الدخول بالباسورد عبر SSH:"

  local eff=""
  if command -v sshd &>/dev/null; then
    eff="$(sshd -T 2>/dev/null | awk '$1=="passwordauthentication"{print $2}')"
  elif [[ -x /usr/sbin/sshd ]]; then
    eff="$(/usr/sbin/sshd -T 2>/dev/null | awk '$1=="passwordauthentication"{print $2}')"
  fi

  if [[ -z "$eff" ]]; then
    c_warn "    مش قادر أقرأ إعداد sshd الفعلي — اتأكد بنفسك:"
    echo  "      sudo sshd -T | grep -i passwordauthentication"
    return
  fi

  if [[ "$eff" == "yes" ]]; then
    c_ok "    PasswordAuthentication yes → الباسورد اللي تحت هيشتغل"
    return
  fi

  c_err "    PasswordAuthentication no → الباسورد اللي تحت **مش** هيشتغل!"
  cat <<'SSHEOF'

    عندك تلات اختيارات — اختار واحد:

    (أ) مفتاح SSH للـ agent — الأنضف، ومفيش تخفيف أمان على السيرفر كله:
        الـ agent يبعتلك المفتاح العام بتاعه، وانت تحطه:
          sudo mkdir -p /home/afagent/.ssh
          sudo nano /home/afagent/.ssh/authorized_keys     # الصق المفتاح العام
          sudo chown -R afagent:afagent /home/afagent/.ssh
          sudo chmod 700 /home/afagent/.ssh
          sudo chmod 600 /home/afagent/.ssh/authorized_keys

    (ب) اسمح بالباسورد لليوزر ده **بس** (مش للسيرفر كله):
          sudo tee /etc/ssh/sshd_config.d/60-afagent.conf >/dev/null <<'EOF'
        Match User afagent
            PasswordAuthentication yes
        EOF
          sudo sshd -t && sudo systemctl reload ssh
        وبعد ما يخلّص، امسح الملف:
          sudo rm /etc/ssh/sshd_config.d/60-afagent.conf && sudo systemctl reload ssh

    (ج) متفتحش SSH خالص — انت تنفّذ الأوامر بنفسك والـ agent يكتبها لك.
        (أأمن اختيار، بس أبطأ.)

    ⚠️ متعملش PasswordAuthentication yes على مستوى السيرفر كله — ده بيفتح
       root وكل اليوزرات لهجمات التخمين، والسيرفر ده عليه إنتاج لمشاريع تانية.

SSHEOF
}

# ===========================================================================
#  create
# ===========================================================================
do_create() {
  c_head "1/7 — التحقق من البيئة"
  read_container_names
  verify_docker_env

  [[ -f "$SUDOERS_SRC" ]] || {
    c_err "ملف الـ sudoers مش موجود جنب السكربت: $SUDOERS_SRC"
    exit 1
  }
  c_ok "ملف الـ sudoers موجود"

  if id "$AGENT_USER" &>/dev/null; then
    c_warn "اليوزر $AGENT_USER موجود بالفعل — هيتم تحديث الباسورد والصلاحيات بس."
  fi

  # -----------------------------------------------------------------------
  c_head "2/7 — توليد باسورد قوي"
  AGENT_PASS="$(head -c 18 /dev/urandom | base64 | tr -d '\n/+=' )$(head -c 6 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 6)"
  c_ok "الباسورد اتولّد (24 حرف) — هيتعرض مرة واحدة في آخر السكربت"

  # -----------------------------------------------------------------------
  c_head "3/7 — إنشاء اليوزر"
  if ! id "$AGENT_USER" &>/dev/null; then
    adduser --disabled-password --gecos "ALI FLEET temp agent" "$AGENT_USER"
    c_ok "اليوزر $AGENT_USER اتعمل"
  fi

  printf '%s:%s\n' "$AGENT_USER" "$AGENT_PASS" | chpasswd
  c_ok "الباسورد اتظبط"

  # مهم: مش بنضيفه لمجموعة sudo ولا **docker** ولا www-data.
  #  · sudo   → صلاحياته من /etc/sudoers.d/ بس
  #  · docker → عضوية المجموعة دي = root على الهوست، وده يلغي الحماية كلها
  #  · www-data → مالهاش لازمة، مفيش ملفات WordPress على الهوست أصلًا
  for g in sudo docker www-data; do
    if id -nG "$AGENT_USER" | tr ' ' '\n' | grep -qx "$g"; then
      deluser "$AGENT_USER" "$g" || true
      c_warn "اليوزر كان في مجموعة $g — اتشال منها"
    fi
  done
  c_ok "اليوزر مش في sudo ولا docker ولا www-data (صح)"

  # -----------------------------------------------------------------------
  c_head "4/7 — تاريخ انتهاء تلقائي"
  EXPIRE_DATE="$(date -u -d "+${EXPIRE_DAYS} days" +%Y-%m-%d)"
  chage -E "$EXPIRE_DATE" "$AGENT_USER"
  c_ok "الحساب بيتقفل تلقائيًا يوم $EXPIRE_DATE (بعد $EXPIRE_DAYS أيام)"

  # -----------------------------------------------------------------------
  c_head "5/7 — تركيب wp-agent (الباب الوحيد على الكونتينر)"
  # root:root 0755 — الـ agent يشغّله ومش يعدّله. اسم الكونتينر مثبَّت جواه.
  install -m 0755 -o root -g root "$WPAGENT_SRC" "$WPAGENT_DST"
  c_ok "اتركّب في $WPAGENT_DST (root:root 0755)"

  if ! bash -n "$WPAGENT_DST"; then
    c_err "سكربت wp-agent فيه خطأ صياغة — بيتشال"
    rm -f "$WPAGENT_DST"
    exit 1
  fi
  c_ok "فحص الصياغة عدّى (bash -n)"

  # لوج الاستدعاءات — الـ agent بيكتب فيه عبر wp-agent (اللي بيشتغل كـ root)
  touch "$WPAGENT_LOG"
  chown root:root "$WPAGENT_LOG"
  chmod 0640 "$WPAGENT_LOG"
  c_ok "لوج الاستدعاءات: $WPAGENT_LOG (مقروء للـ root بس)"

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

  echo
  check_ssh_password_login

  echo
  echo "اختبار سريع إن الباب شغال (بيتنفّذ كـ $AGENT_USER):"
  su -s /bin/bash -c "sudo -n $WPAGENT_DST help >/dev/null 2>&1 && echo '    ✔ wp-agent شغال' || echo '    ✖ wp-agent مش شغال — راجع الـ sudoers'" "$AGENT_USER" || true
  su -s /bin/bash -c "sudo -n /usr/bin/docker ps >/dev/null 2>&1 && echo '    ✖ خطر: docker متاح لليوزر!' || echo '    ✔ docker مش متاح لليوزر (صح)'" "$AGENT_USER" || true

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

  1) النسخة الاحتياطية — **إلزامية، مش خيار**:
       sudo bash agent-user.sh backup

     ليه إلزامية: استيراد الداتا (M5) مبني على \`wp eval-file\` = تنفيذ PHP
     حر جوه الكونتينر. يعني الـ agent بيوصل لقاعدة البيانات بغض النظر عن
     رفض \`wp db\`. الحد الحقيقي هو الحصر جوه الكونتينر، مش قايمة الأوامر.

  2) انسخ البرومبت من docs/AGENT.md وإداهله.

  3) خلّي عينك على اللي بيعمله — لوجين:
       sudo tail -f $WPAGENT_LOG        # كل استدعاء wp-agent (حتى المرفوض)
       sudo tail -f /var/log/auth.log   # كل أمر sudo

  4) الدومين والشهادة وربط Traefik — **من لوحة Coolify، وانت اللي تعملها**.
     الـ agent ممنوع منها تمامًا (القسم 11 في WORDPRESS-SETUP.md ملغي).

════════════════════════════════════════════════════════════════════
  بعد ما يخلّص — امسح الحساب فورًا
════════════════════════════════════════════════════════════════════

    sudo bash agent-user.sh delete

EOF
  c_warn "الباسورد فوق مش متسجّل في أي مكان تاني. لو ضاع، شغّل create تاني."
}

# ===========================================================================
#  backup — DB + wp-config من جوه الكونتينرات
#  البديل الوحيد: wp db export مش متاح (wp-cli مش منصّب، والـ agent ممنوع منه)
# ===========================================================================
do_backup() {
  read_container_names
  c_head "نسخة احتياطية"

  local stamp dest
  stamp="$(date +%F-%H%M)"
  dest="${BACKUP_DIR:-/root/alifleet-backups}"
  mkdir -p "$dest"
  chmod 700 "$dest"

  # 1) قاعدة البيانات — من كونتينر MySQL. بيانات الاتصال بتتقرا من متغيرات
  #    بيئة كو��تينر WordPress، فمفيش باسورد مكتوب في السكربت ده ولا بيتطبع.
  c_warn "بيتم تصدير قاعدة البيانات من $DB_CONTAINER ..."
  local envs db_name db_user db_pass
  envs="$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$WP_CONTAINER")"
  db_name="$(echo "$envs" | grep -m1 '^WORDPRESS_DB_NAME='     | cut -d= -f2- || true)"
  db_user="$(echo "$envs" | grep -m1 '^WORDPRESS_DB_USER='     | cut -d= -f2- || true)"
  db_pass="$(echo "$envs" | grep -m1 '^WORDPRESS_DB_PASSWORD=' | cut -d= -f2- || true)"

  if [[ -z "$db_name" || -z "$db_user" || -z "$db_pass" ]]; then
    c_err "مقدرتش أقرأ WORDPRESS_DB_* من متغيرات بيئة الكونتينر."
    c_err "اعمل التصدير بنفسك:"
    c_err "  docker exec $DB_CONTAINER mysqldump -u<user> -p<pass> <db> > $dest/db-$stamp.sql"
    exit 1
  fi

  # الباسورد بيتمرَّر كمتغير بيئة للكونتينر — مش في سطر الأوامر (عشان
  # مايظهرش في ps ولا في history).
  if docker exec -e MYSQL_PWD="$db_pass" "$DB_CONTAINER" \
       mysqldump --single-transaction --quick --default-character-set=utf8mb4 \
       -u "$db_user" "$db_name" > "$dest/db-$stamp.sql" 2>"$dest/db-$stamp.err"; then
    chmod 600 "$dest/db-$stamp.sql"
    c_ok "قاعدة البيانات: $dest/db-$stamp.sql ($(du -h "$dest/db-$stamp.sql" | cut -f1))"
    rm -f "$dest/db-$stamp.err"
  else
    c_err "التصدير فشل — الخطأ في: $dest/db-$stamp.err"
    exit 1
  fi

  # 2) wp-config.php — مهم بالأخص لو الـ volume مش بيغطي /var/www/html
  if docker cp "$WP_CONTAINER:/var/www/html/wp-config.php" "$dest/wp-config-$stamp.php" 2>/dev/null; then
    chmod 600 "$dest/wp-config-$stamp.php"
    c_ok "wp-config.php: $dest/wp-config-$stamp.php"
  else
    c_warn "مقدرتش أنسخ wp-config.php (يمكن الإعداد كله من متغيرات بيئة Coolify)"
  fi

  # 3) wp-content — الإضافات والمرفوعات
  if docker exec "$WP_CONTAINER" tar czf - -C /var/www/html wp-content \
       > "$dest/wp-content-$stamp.tar.gz" 2>/dev/null; then
    chmod 600 "$dest/wp-content-$stamp.tar.gz"
    c_ok "wp-content: $dest/wp-content-$stamp.tar.gz ($(du -h "$dest/wp-content-$stamp.tar.gz" | cut -f1))"
  else
    c_warn "أرشفة wp-content فشلت — اعملها بنفسك من مسار الـ volume"
  fi

  c_head "مهم"
  c_warn "الملفات دي فيها أسرار (بيانات DB والمفاتيح). صلاحيتها 600 وفي $dest."
  c_warn "انقلها بره السيرفر ومتسيبهاش في مسار الـ agent."
  c_ok "خلصت — دلوقتي تقدر تعمل: sudo bash agent-user.sh create"
}

# ===========================================================================
#  status
# ===========================================================================
do_status() {
  read_container_names
  c_head "حالة يوزر الـ agent"

  if ! id "$AGENT_USER" &>/dev/null; then
    c_ok "اليوزر $AGENT_USER مش موجود — مفيش وصول مفتوح"
  else
    c_warn "اليوزر $AGENT_USER موجود"
    echo "    المجموعات : $(id -nG "$AGENT_USER")"
    echo "    الانتهاء  : $(chage -l "$AGENT_USER" 2>/dev/null | grep -i 'Account expires' | cut -d: -f2- | xargs)"
    echo "    الحالة    : $(passwd -S "$AGENT_USER" 2>/dev/null | awk '{print $2}') (P=شغال L=مقفول)"
    for g in sudo docker; do
      if id -nG "$AGENT_USER" | tr ' ' '\n' | grep -qx "$g"; then
        c_err "خطر: اليوزر في مجموعة $g — شيله فورًا: sudo deluser $AGENT_USER $g"
      fi
    done
  fi

  if [[ -f "$SUDOERS_DST" ]]; then
    c_warn "قايمة الـ sudo مركّبة: $SUDOERS_DST"
  else
    c_ok "قايمة الـ sudo مش مركّبة"
  fi
  if [[ -f "$WPAGENT_DST" ]]; then
    c_warn "wp-agent مركّب: $WPAGENT_DST → كونتينر $WP_CONTAINER"
  else
    c_ok "wp-agent مش مركّب"
  fi

  c_head "الجلسات المفتوحة حاليًا"
  who | grep -w "$AGENT_USER" || c_ok "مفيش جلسة مفتوحة لليوزر"

  c_head "آخر 20 استدعاء wp-agent"
  tail -20 "$WPAGENT_LOG" 2>/dev/null | sed 's/^/    /' || c_ok "مفيش سجل"

  c_head "آخر 15 أمر sudo"
  grep -h "$AGENT_USER" /var/log/auth.log 2>/dev/null | grep -i sudo | tail -15 \
    || journalctl _COMM=sudo --no-pager 2>/dev/null | grep "$AGENT_USER" | tail -15 \
    || c_ok "مفيش سجل"

  c_head "الكونتينر"
  docker ps --filter "name=$WP_CONTAINER" --format '    {{.Names}}  {{.Image}}  {{.Status}}' 2>/dev/null \
    || c_warn "مقدرتش أقرأ حالة الكونتينر"
}

# ===========================================================================
#  revoke — قفل فوري بدون مسح (للطوارئ)
# ===========================================================================
do_revoke() {
  c_head "قفل فوري لحساب الـ agent"

  # الأول: اقطع الباب على الكونتينر — أهم من قفل الحساب نفسه
  if [[ -f "$WPAGENT_DST" ]]; then
    rm -f "$WPAGENT_DST"
    c_ok "wp-agent اتشال — مفيش وصول للكونتينر خلاص"
  fi
  if [[ -f "$SUDOERS_DST" ]]; then
    rm -f "$SUDOERS_DST"
    c_ok "قايمة الـ sudo اتشالت"
  fi

  if ! id "$AGENT_USER" &>/dev/null; then
    c_ok "اليوزر مش موجود أصلًا"
    return
  fi

  passwd -l "$AGENT_USER" && c_ok "الباسورد اتقفل"
  usermod -s /usr/sbin/nologin "$AGENT_USER" && c_ok "الشِل بقى nologin"
  chage -E 0 "$AGENT_USER" && c_ok "الحساب منتهي"

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

  [[ -f "$WPAGENT_DST" ]] && { rm -f "$WPAGENT_DST"; c_ok "wp-agent اتشال"; }
  [[ -f "$SUDOERS_DST" ]] && { rm -f "$SUDOERS_DST"; c_ok "قايمة الـ sudo اتشالت"; }

  if id "$AGENT_USER" &>/dev/null; then
    pkill -KILL -u "$AGENT_USER" 2>/dev/null || true
    deluser --remove-home "$AGENT_USER" && c_ok "اليوزر ومجلد الهوم اتمسحوا"
  else
    c_ok "اليوزر مش موجود"
  fi

  if [[ -f "$WPAGENT_LOG" ]]; then
    c_warn "لوج الاستدعاءات باقي للمراجعة: $WPAGENT_LOG"
  fi

  c_head "خطوة أخيرة مهمة"
  c_warn "الـ agent كان بيشغّل PHP جوه الكونتينر (wp eval-file في M5)، يعني كان"
  c_warn "بيقدر يقرأ بيانات الاتصال بقاعدة البيانات. لو عايز تكون 100% مطمّن:"
  c_warn "  1) غيّر WORDPRESS_DB_PASSWORD من لوحة Coolify وأعد النشر"
  c_warn "  2) دوّر GRAPHQL_JWT_AUTH_SECRET_KEY (بيلغي كل الجلسات المفتوحة)"
  c_warn "متعملهومش قبل ما تتأكد إن الموقع شغال — الاتنين بيحتاجوا redeploy."
}

# ===========================================================================
case "${1:-}" in
  create) need_root "$@"; do_create ;;
  status) need_root "$@"; do_status ;;
  backup) need_root "$@"; do_backup ;;
  revoke) need_root "$@"; do_revoke ;;
  delete) need_root "$@"; do_delete ;;
  *)
    cat <<EOF
الاستخدام: sudo bash agent-user.sh <أمر>

  create   إنشاء اليوزر المؤقت + باسورد عشوائي + تركيب wp-agent والصلاحيات
  backup   نسخة احتياطية (DB + wp-config + wp-content) — إلزامية قبل create
  status   ع��ض حالة اليوزر والجلسات ولوج wp-agent
  revoke   قفل فوري للحساب (طوارئ) — بيشيل wp-agent الأول
  delete   مسح الحساب نهائيًا بعد ما الـ agent يخلّص

الإعدادات الحالية:
  AGENT_USER  = $AGENT_USER
  EXPIRE_DAYS = $EXPIRE_DAYS
  wp-agent    = $WPAGENT_SRC → $WPAGENT_DST

اسم الكونتينر بيتقرا من أول wp-agent — عدّله هناك لو Coolify غيّره.
EOF
    exit 1 ;;
esac
