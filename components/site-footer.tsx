import Image from 'next/image'

const columns = [
  {
    heading: 'Fleet',
    links: ['Heavy-Duty Trucks', 'Executive Vans', 'Luxury Vehicles', 'Used Inventory'],
  },
  {
    heading: 'Services',
    links: ['Vehicle Importing', 'Spare Parts', 'Fleet Consulting', 'After-Sales Support'],
  },
  {
    heading: 'Company',
    links: ['About Us', 'Careers', 'News', 'Contact'],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Image
              src="/images/ali-fleet-logo.png"
              alt="ALI FLEET logo"
              width={140}
              height={51}
              className="h-11 w-auto"
            />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Luxurious commercial vehicles, global importing, and genuine
              spare parts — delivered with excellence worldwide.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} ALI FLEET. All rights reserved.</p>
          <p>Luxury Fleet. Global Reach.</p>
        </div>
      </div>
    </footer>
  )
}
