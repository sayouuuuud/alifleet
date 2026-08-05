import { AlertCircle, CheckCircle2, PlugZap } from 'lucide-react'

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl bg-destructive/10 px-4 py-3 ring-1 ring-destructive/30"
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  )
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl bg-accent/10 px-4 py-3 ring-1 ring-accent/30"
    >
      <CheckCircle2
        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
        aria-hidden="true"
      />
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  )
}

/**
 * Shown when WORDPRESS_GRAPHQL_ENDPOINT is absent. Explains the exact steps
 * needed to switch accounts on, instead of failing with an opaque error.
 */
export function BackendNotice({
  title,
  lead,
  checklist,
  steps,
}: {
  title: string
  lead: string
  checklist: string
  steps: string[]
}) {
  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <PlugZap className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-serif text-xl tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {lead}
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm font-medium text-foreground">{checklist}</p>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground">
              {i + 1}
            </span>
            <span className="leading-relaxed text-muted-foreground">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
