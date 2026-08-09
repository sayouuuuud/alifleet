'use client'

import { ClipboardCheck, KeyRound, Search, Ship } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'

export function ImportSteps() {
  const { t } = useLanguage()

  const steps = [
    { icon: Search, title: t.import.step1Title, desc: t.import.step1Desc },
    { icon: ClipboardCheck, title: t.import.step2Title, desc: t.import.step2Desc },
    { icon: Ship, title: t.import.step3Title, desc: t.import.step3Desc },
    { icon: KeyRound, title: t.import.step4Title, desc: t.import.step4Desc },
  ]

  // `#import` is the landing target for the hero's "import a car" CTA — the
  // import half of /cars starts here.
  return (
    <section id="import" className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent text-start">
          {t.import.stepsEyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl text-start">
          {t.import.stepsTitle}
        </h2>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex flex-col rounded-3xl bg-card p-6 ring-1 ring-border"
            >
              <span
                className="font-mono text-xs font-semibold text-accent"
                dir="ltr"
              >{`0${index + 1}`}</span>
              <span className="mt-4 flex size-11 items-center justify-center rounded-2xl bg-secondary text-accent">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-pretty text-base font-semibold leading-snug text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
