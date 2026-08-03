export function PageHero({
  eyebrow,
  title,
  titleEm,
  lead,
  children,
}: {
  eyebrow: string
  title: string
  titleEm?: string
  lead?: string
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden pb-12 pt-32 md:pb-16 md:pt-40">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-balance font-serif text-4xl leading-[1.08] tracking-tight text-foreground md:text-6xl">
          {title}
          {titleEm && (
            <>
              {' '}
              <em className="italic text-accent">{titleEm}</em>
            </>
          )}
        </h1>
        {lead && (
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
