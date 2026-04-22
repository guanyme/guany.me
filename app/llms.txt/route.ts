import { headers } from 'next/headers'
import { buildLlmsContent } from '@/lib/llms-content'
import { siteUrl } from '@/lib/site'

export const revalidate = 3600

export async function GET() {
  const headersList = await headers()
  const origin =
    headersList.get('x-forwarded-proto') && headersList.get('host')
      ? `${headersList.get('x-forwarded-proto')}://${headersList.get('host')}`
      : siteUrl
  const content = await buildLlmsContent({
    includeFullContent: false,
    origin,
  })
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
