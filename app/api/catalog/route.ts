import { getCatalogSummaries } from '@/lib/wp/catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { parts, status } = await getCatalogSummaries()
    return Response.json({ parts, status })
  } catch (error) {
    console.error('[alifleet] Failed to fetch catalog summaries API:', error)
    return Response.json({ parts: [], status: 'error' }, { status: 500 })
  }
}
