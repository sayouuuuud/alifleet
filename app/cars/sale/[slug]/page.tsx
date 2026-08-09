import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSaleCar, getSimilarSaleCars } from '@/lib/wp/sale-cars'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SaleCarDetail } from '@/components/sale-car-detail'
import { ImportCustomCta } from '@/components/import-custom-cta'

// Dynamic rendering — slugs come from WordPress at runtime, not build time.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const car = await getSaleCar(slug)
  if (!car) return { title: 'Car not found | ALI FLEET' }

  return {
    title: `${car.model} · ${car.year} | ALI FLEET`,
    description: car.description.en || car.subtitle.en,
  }
}

export default async function SaleCarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const car = await getSaleCar(slug)
  if (!car) notFound()

  const related = await getSimilarSaleCars(car)

  return (
    <>
      <SiteHeader />
      <main>
        <SaleCarDetail car={car} related={related} />
        <ImportCustomCta />
      </main>
      <SiteFooter />
    </>
  )
}
