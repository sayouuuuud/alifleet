import { notFound } from 'next/navigation'
import { parts } from '@/lib/data/parts'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail } from '@/components/product-detail'

export function generateStaticParams() {
  return parts.map((part) => ({ slug: part.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const part = parts.find((item) => item.slug === slug)
  if (!part) return { title: 'ALI FLEET' }
  return {
    title: `${part.name.en} — ALI FLEET Spare Parts`,
    description: part.description.en,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const part = parts.find((item) => item.slug === slug)
  if (!part) notFound()

  return (
    <>
      <SiteHeader />
      <main>
        <ProductDetail part={part} />
      </main>
      <SiteFooter />
    </>
  )
}
