'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { BlogCard } from '@/components/blog-card'
import { useLanguage } from '@/lib/i18n/language-context'
import type { BlogPost } from '@/lib/data/blog'

const articleCopy = {
  en: {
    intro: 'In this guide, the ALI FLEET team shares the practical details that matter when choosing, importing, or operating commercial vehicles. Our recommendations are based on real sourcing experience, technical inspections, and international delivery workflows.',
    heading1: 'What matters most',
    body1: 'The right decision starts with a clear operating brief: expected mileage, payload, road conditions, maintenance access, and total ownership cost. Looking beyond the purchase price helps protect uptime and long-term value.',
    heading2: 'A smarter sourcing process',
    body2: 'Every vehicle should be checked against its service history, specification, physical condition, and local compliance requirements. Independent inspection and complete documentation reduce risk before shipping begins.',
    heading3: 'How ALI FLEET can help',
    body3: 'We manage sourcing, verification, export paperwork, freight, customs support, and final delivery through one accountable process. That gives fleet owners a clearer timeline and fewer surprises from market to handover.',
    cta: 'Need help with your next vehicle or fleet order?',
    ctaLead: 'Tell us what you need and our team will prepare the right sourcing plan.',
    contact: 'Talk to our team',
  },
  ar: {
    intro: 'في هذا الدليل يشارك فريق علي فليت أهم التفاصيل العملية عند اختيار المركبات التجارية أو استيرادها أو تشغيلها. تعتمد توصياتنا على خبرة فعلية في التوريد والفحص الفني والشحن الدولي.',
    heading1: 'ما الذي يجب التركيز عليه؟',
    body1: 'يبدأ القرار الصحيح بتحديد طبيعة التشغيل بوضوح: المسافة المتوقعة، والحمولة، وحالة الطرق، وتوافر الصيانة، والتكلفة الإجمالية للملكية. النظر إلى ما بعد سعر الشراء يحافظ على استمرارية العمل وقيمة المركبة.',
    heading2: 'عملية توريد أكثر ذكاءً',
    body2: 'يجب مراجعة تاريخ الصيانة والمواصفات والحالة الفعلية ومتطلبات الترخيص المحلية لكل مركبة. الفحص المستقل والوثائق الكاملة يقللان المخاطر قبل بدء الشحن.',
    heading3: 'كيف تساعدك علي فليت؟',
    body3: 'ندير البحث والفحص وأوراق التصدير والشحن ودعم التخليص الجمركي والتسليم النهائي من خلال عملية واحدة واضحة. وهذا يمنح أصحاب الأساطيل جدولًا أدق ومفاجآت أقل حتى لحظة التسليم.',
    cta: 'تحتاج مساعدة في طلب مركبتك أو أسطولك القادم؟',
    ctaLead: 'أخبرنا بما تحتاج إليه وسيجهز فريقنا خطة التوريد المناسبة.',
    contact: 'تواصل مع فريقنا',
  },
  he: {
    intro: 'במדריך זה צוות ALI FLEET משתף את הפרטים המעשיים החשובים בבחירה, ייבוא ותפעול של רכבים מסחריים. ההמלצות שלנו מבוססות על ניסיון אמיתי באיתור, בדיקות טכניות ומשלוחים בינלאומיים.',
    heading1: 'מה חשוב באמת',
    body1: 'החלטה נכונה מתחילה בהגדרת צורכי התפעול: קילומטראז׳ צפוי, מטען, תנאי דרך, זמינות תחזוקה ועלות בעלות כוללת. הסתכלות מעבר למחיר הרכישה מגינה על זמינות הצי ועל הערך לטווח ארוך.',
    heading2: 'תהליך איתור חכם יותר',
    body2: 'יש לבדוק היסטוריית טיפולים, מפרט, מצב פיזי ודרישות תקינה מקומיות. בדיקה עצמאית ותיעוד מלא מפחיתים סיכון עוד לפני תחילת המשלוח.',
    heading3: 'איך ALI FLEET יכולה לעזור',
    body3: 'אנחנו מנהלים איתור, אימות, מסמכי יצוא, הובלה, תמיכה במכס ומסירה סופית בתהליך אחראי אחד. כך בעלי צי מקבלים לוח זמנים ברור ופחות הפתעות עד למסירה.',
    cta: 'צריכים עזרה עם הרכב או הזמנת הצי הבאה?',
    ctaLead: 'ספרו לנו מה אתם צריכים והצוות שלנו יכין תוכנית איתור מתאימה.',
    contact: 'דברו עם הצוות',
  },
} as const

function localized(post: BlogPost, locale: string) {
  if (locale === 'ar') return { title: post.titleAr, excerpt: post.excerptAr }
  if (locale === 'he') return { title: post.titleHe, excerpt: post.excerptHe }
  return { title: post.titleEn, excerpt: post.excerptEn }
}

export function BlogArticle({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const { locale, t, dir } = useLanguage()
  const copy = articleCopy[locale]
  const { title, excerpt } = localized(post, locale)
  const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : locale === 'he' ? 'he-IL' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(post.publishedAt))
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft

  return (
    <main className="min-h-screen bg-background pt-28 md:pt-36">
      <article>
        <header className="mx-auto flex max-w-4xl flex-col gap-6 px-6 text-start md:px-8">
          <Link href="/blog" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
            <BackIcon className="size-4" aria-hidden="true" />
            {t.blog.backToBlog}
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-accent">
            <span className="rounded-full bg-accent/10 px-3 py-1.5">{t.blog.categories[post.category]}</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {post.readingMinutes} {t.blog.minRead}
            </span>
          </div>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">{title}</h1>
          <p className="max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">{excerpt}</p>
          <div className="flex items-center gap-3 border-t border-border pt-5">
            <div className="relative size-10 overflow-hidden rounded-full border border-border">
              <Image src={post.authorAvatar} alt={post.authorName} fill className="object-cover" sizes="40px" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">{t.blog.by} {post.authorName}</p>
              <p className="text-muted-foreground">{t.blog.publishedOn} {date}</p>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-6xl px-4 md:px-8">
          <div className="relative aspect-[16/8] overflow-hidden rounded-3xl bg-secondary">
            <Image src={post.coverImage} alt={title} fill priority className="object-cover" sizes="(max-width: 1200px) 100vw, 1152px" />
          </div>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-14 text-start md:px-8 md:py-20">
          <p className="text-pretty text-lg leading-8 text-foreground/85">{copy.intro}</p>
          {[1, 2, 3].map((number) => (
            <section key={number} className="flex flex-col gap-3 border-t border-border pt-8">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {copy[`heading${number}` as 'heading1' | 'heading2' | 'heading3']}
              </h2>
              <p className="text-pretty text-base leading-8 text-muted-foreground md:text-lg">
                {copy[`body${number}` as 'body1' | 'body2' | 'body3']}
              </p>
            </section>
          ))}
        </div>

        <aside className="mx-auto mb-20 max-w-4xl px-6 md:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-8 md:flex-row md:items-center md:p-10">
            <div className="max-w-xl text-start">
              <h2 className="text-2xl font-semibold text-primary-foreground md:text-3xl">{copy.cta}</h2>
              <p className="mt-2 leading-relaxed text-primary-foreground/65">{copy.ctaLead}</p>
            </div>
            <Link href="/contact" className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5">
              {copy.contact}
            </Link>
          </div>
        </aside>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-secondary/30 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6 md:px-8">
            <h2 className="mb-8 text-start text-3xl font-semibold tracking-tight text-foreground">{t.blog.relatedPosts}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => <BlogCard key={item.slug} post={item} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
