import { proxyWooRequest } from '@/lib/checkout/proxy'

type Context = { params: Promise<{ path?: string[] }> }

async function handler(request: Request, context: Context) {
  const { path = [] } = await context.params
  return proxyWooRequest(request, ['checkout', ...path])
}

export const GET = handler
export const POST = handler
export const HEAD = handler
export const OPTIONS = handler
