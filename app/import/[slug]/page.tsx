import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getVehicle, getSimilarVehicles } from '@/lib/wp/vehicles'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ImportCarDetail } from '@/components/import-car-detail'
import { ImportCustomCta } from '@/components/import-custom-cta'

// Dynamic rendering — slugs come from WordPress at runtime, not build time.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const car = await getVehicle(slug)
  if (!car) return { title: 'Vehicle not found | ALI FLEET' }

  return {
    title: `${car.model} · ${car.year} | ALI FLEET`,
    description: car.description.en || car.subtitle.en,
  }
}

export default async function ImportCarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const car = await getVehicle(slug)
  if (!car) notFound()

  const related = await getSimilarVehicles(car)

  return (
    <>
      <SiteHeader />
      <main>
        <ImportCarDetail car={car} related={related} />
        <ImportCustomCta />
      </main>
      <SiteFooter />
    </>
  )
}
