/**
 * /setup — One-page guide for connecting WordPress to the Next.js frontend.
 * Not linked from the nav; access it directly at /setup.
 */
export const metadata = {
  title: 'Setup Guide — ALI FLEET',
  description: 'Step-by-step guide to connect WordPress and WooCommerce to the Next.js storefront.',
  robots: 'noindex',
}

export default function SetupPage() {
  const WP_DOMAIN = 'http://wordpress-yo985p014jyz554zjo2oo6w7.169.58.19.247.sslip.io'

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 font-sans text-foreground">
      <header className="mb-12 border-b border-border pb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">ALI FLEET</p>
        <h1 className="text-4xl font-bold tracking-tight text-balance">دليل ربط WordPress بالموقع</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          كل اللي محتاج تعمله عشان المنتجات والسيارات والمقالات تظهر من WooCommerce.
        </p>
      </header>

      {/* Status */}
      <section className="mb-12 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">الوضع الحالي</h2>
        <div className="flex flex-col gap-3">
          <StatusRow done label="WORDPRESS_GRAPHQL_ENDPOINT" detail="متضبطة وشغّالة" />
          <StatusRow done label="WPGraphQL" detail="مفعّل — الاتصال تمام" />
          <StatusRow done label="WPGraphQL for ACF" detail="مفعّل — الأسماء والتصنيفات والعلامات التجارية بتتحمّل" />
          <StatusRow done label="138+ منتج" detail="بيتحملوا من WooCommerce مع الأسعار والمخزون" />
          <StatusRow label="mu-plugin (النسخة الجديدة)" detail="لازم ترفعه — فيه storeSettings + alifleet-cart" />
          <StatusRow label="GRAPHQL_JWT_AUTH_SECRET_KEY" detail="تسجيل الدخول مش هيشتغل بدونه" />
          <StatusRow label="السيارات التسعة" detail="محتاج تشغّل migrate:cars بعد ما تحط credentials" />
        </div>
      </section>

      {/* Step 1: mu-plugin */}
      <Step number="1" title="ارفع الـ mu-plugin الجديد">
        <p>
          الملف موجود في المشروع على المسار:{' '}
          <Code>wordpress/mu-plugin/alifleet-cms.php</Code>
        </p>
        <p className="mt-3">ارفعه على السيرفر بنفس الطريقة القديمة:</p>
        <ol className="mt-2 flex flex-col gap-2 ps-5 text-sm list-decimal text-muted-foreground">
          <li>افتح File Manager أو FTP</li>
          <li>
            ارفع الملف على:{' '}
            <Code>{WP_DOMAIN}/wp-content/mu-plugins/alifleet-cms.php</Code>
          </li>
          <li>
            لو مش موجود فولدر <Code>mu-plugins</Code>، اعمله يدوياً
          </li>
        </ol>
        <Alert>
          المشروع القديم كان عنده نسخة من الـ plugin — الجديدة بتضيف حاجتين:
          storeSettings (التليفون والعنوان) و alifleet-cart (سلة متعددة من WooCommerce).
        </Alert>
      </Step>

      {/* Step 2: JWT key */}
      <Step number="2" title="حط GRAPHQL_JWT_AUTH_SECRET_KEY في wp-config.php">
        <p>
          بدونه تسجيل الدخول وإنشاء الحساب مش هيشتغلوا. افتح ملف{' '}
          <Code>wp-config.php</Code> وضيف هذا السطر قبل سطر{' '}
          <Code>/* That&apos;s all, stop editing! */</Code>:
        </p>
        <CodeBlock>{`define( 'GRAPHQL_JWT_AUTH_SECRET_KEY', 'put-any-long-random-string-here-min-32-chars' );`}</CodeBlock>
        <p className="mt-3 text-sm text-muted-foreground">
          تقدر تولّد string عشوائي من:{' '}
          <a
            href="https://api.wordpress.org/secret-key/1.1/salt/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            api.wordpress.org/secret-key
          </a>
          {' '}— خد أي سطر منه.
        </p>
      </Step>

      {/* Step 3: migrate cars */}
      <Step number="3" title="رحّل السيارات التسعة لـ WordPress">
        <p>
          9 سيارات محفوظة في الكود — سكربت واحد بيرفعهم كـ import_car posts مع كل حقول ACF.
        </p>
        <p className="mt-3 font-medium">أولاً: اعمل Application Password</p>
        <ol className="mt-2 flex flex-col gap-2 ps-5 text-sm list-decimal text-muted-foreground">
          <li>
            ادخل لوحة WordPress:{' '}
            <a href={`${WP_DOMAIN}/wp-admin`} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {WP_DOMAIN}/wp-admin
            </a>
          </li>
          <li>Users → Your Profile → مشروع لأسفل</li>
          <li>قسم &quot;Application Passwords&quot; → اكتب اسم مثل &quot;alifleet-migration&quot; → Add</li>
          <li>انسخ الـ password اللي ظهر (هيظهر مرة وحدة بس)</li>
        </ol>
        <p className="mt-4 font-medium">ثانياً: ضيف في ملف .env.local</p>
        <CodeBlock>{`WORDPRESS_GRAPHQL_ENDPOINT=http://wordpress-yo985p014jyz554zjo2oo6w7.169.58.19.247.sslip.io/graphql
WORDPRESS_USER=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx`}</CodeBlock>
        <p className="mt-4 font-medium">ثالثاً: شغّل السكربت</p>
        <CodeBlock>{`# جرّب الأول من غير كتابة
pnpm migrate:cars:dry

# لو كل حاجة OK، نفّذ
pnpm migrate:cars`}</CodeBlock>
        <Alert>
          السكربت بيتحقق من كل سيارة قبل ما يرفعها — لو اسم السيارة موجود بالفعل في WordPress مش هيعمل duplicate.
        </Alert>
      </Step>

      {/* Step 4: ACF schema import */}
      <Step number="4" title="استورد ACF Schema (لو مش عامل كده)">
        <p>
          لو <Code>importCarFields</Code> و <Code>sparePartFields</Code> مش ظاهرين في GraphQL schema، لازم تستورد
          الـ JSON:
        </p>
        <ol className="mt-2 flex flex-col gap-2 ps-5 text-sm list-decimal text-muted-foreground">
          <li>
            في WordPress: Custom Fields → Tools → Import
          </li>
          <li>
            ارفع الملف: <Code>wordpress/acf/alifleet-acf-schema.json</Code>
          </li>
          <li>بعد الاستيراد اضغط &quot;Sync Available&quot;</li>
        </ol>
      </Step>

      {/* Step 5: Cloudflare */}
      <Step number="5" title="اضبط Cloudflare (لو الدومين وراه Cloudflare)">
        <p>
          Cloudflare بيعمل block على POST requests للـ <Code>/graphql</Code> path. محتاج تعمل WAF Exception:
        </p>
        <ol className="mt-2 flex flex-col gap-2 ps-5 text-sm list-decimal text-muted-foreground">
          <li>ادخل Cloudflare Dashboard → الدومين بتاعك</li>
          <li>Security → WAF → Custom Rules → Create rule</li>
          <li>
            الشرط: <Code>URI Path contains /graphql</Code>
          </li>
          <li>الإجراء: <Code>Skip → All remaining custom rules</Code></li>
        </ol>
      </Step>

      {/* Step 6: content */}
      <Step number="6" title="ابدأ تضيف محتوى من WordPress">
        <p>بعد ما خلّصت الخطوات فوق، كل حاجة بتتحكم فيها من WordPress:</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ContentCard
            title="قطع الغيار"
            href={`${WP_DOMAIN}/wp-admin/edit.php?post_type=product`}
            desc="WooCommerce Products — الاسم، السعر، الصورة، المخزون"
          />
          <ContentCard
            title="السيارات المستوردة"
            href={`${WP_DOMAIN}/wp-admin/edit.php?post_type=import_car`}
            desc="Custom Post Type — حقول ACF للموديل والمواصفات والسعر"
          />
          <ContentCard
            title="المقالات"
            href={`${WP_DOMAIN}/wp-admin/edit.php`}
            desc="WordPress Posts — العنوان والمحتوى والصورة والتصنيف"
          />
          <ContentCard
            title="بيانات التواصل"
            href={`${WP_DOMAIN}/wp-admin/admin.php?page=wc-settings`}
            desc="WooCommerce → General — التليفون والعنوان والإيميل"
          />
        </div>
      </Step>

      <footer className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
        <p>
          الصفحة دي على <Code>/setup</Code> — غير ملينكة من الـ nav.
          لو حسيت إن حاجة مش شغّالة، افتحها وراجع الـ status في الأعلى.
        </p>
      </footer>
    </main>
  )
}

/* ------------------------------------------------------------------ helpers */

function StatusRow({
  done,
  label,
  detail,
}: {
  done?: boolean
  label: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
        }`}
      >
        {done ? '✓' : '!'}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {number}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="ps-11 flex flex-col gap-2 text-base text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs text-foreground leading-6 whitespace-pre-wrap">
      {children}
    </pre>
  )
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
      {children}
    </div>
  )
}

function ContentCard({
  title,
  href,
  desc,
}: {
  title: string
  href: string
  desc: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </a>
  )
}
