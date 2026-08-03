import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getImportCar, importCars } from '@/lib/data/import-cars'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ImportCarDetail } from '@/components/import-car-detail'
import { ImportCustomCta } from '@/components/import-custom-cta'

export function generateStaticParams() {
  return importCars.map((car) => ({ slug: car.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const car = getImportCar(slug)
  if (!car) return { title: 'Vehicle not found | ALI FLEET' }

  return {
    title: `${car.model} · ${car.year} | ALI FLEET`,
    description: car.description.en,
  }
}

export default async function ImportCarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const car = getImportCar(slug)
  if (!car) notFound()

  return (
    <>
      <SiteHeader />
      <main>
        <ImportCarDetail car={car} />
        <ImportCustomCta />
      </main>
      <SiteFooter />
    </>
  )
}
