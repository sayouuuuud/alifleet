import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail } from '@/components/product-detail'
import { getPart, getRelatedParts } from '@/lib/wp/catalog'

/**
 * Product pages are rendered on demand rather than pre-generated: the catalog
 * lives in WooCommerce, so a new product must appear without a redeploy. There
 * is no `generateStaticParams` for that reason — the cached catalog fetch is
 * what keeps this cheap.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const part = await getPart(slug)
  if (!part) return { title: 'ALI FLEET' }

  // English falls back to the Hebrew original for products that are not
  // translated yet, which is still far better metadata than a bare site name.
  const title = part.name.en || part.name.he
  return {
    title: `${title} — ALI FLEET Spare Parts`,
    description: part.description.en || part.description.he || undefined,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const part = await getPart(slug)
  if (!part) notFound()

  const related = await getRelatedParts(part)

  return (
    <>
      <SiteHeader />
      <main>
        <ProductDetail part={part} related={related} />
      </main>
      <SiteFooter />
    </>
  )
}
