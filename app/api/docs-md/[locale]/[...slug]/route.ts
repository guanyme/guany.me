import matter from 'gray-matter'
import { getAllDocs, getDocBySlug } from '@/lib/mdx'
import { routing } from '@/i18n/routing'

// The proxy rewrites /docs/<slug>.md and /zh/docs/<slug>.md to here, returning the document's
// raw Markdown (with frontmatter removed, matching the content of "Copy Markdown" on the page).
export const dynamicParams = false

export function generateStaticParams() {
  const docs = getAllDocs('en', 'docs')
  return routing.locales.flatMap((locale) =>
    docs.map((doc) => ({ locale, slug: doc.slug.split('/') })),
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string[] }> },
) {
  const { locale, slug } = await params
  const doc = getDocBySlug(locale, 'docs', slug.join('/'))

  if (!doc) {
    return new Response('Not Found', { status: 404 })
  }

  const { content } = matter(doc.content)
  return new Response(content.trimStart(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
