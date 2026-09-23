import matter from 'gray-matter'
import { getAllDocs, getDocBySlug } from '@/lib/mdx'
import { routing } from '@/i18n/routing'

// 由 proxy 把 /docs/<slug>.md、/zh/docs/<slug>.md 改写到这里，返回文档的
// Markdown 原文（去掉 frontmatter，与页面上「复制 Markdown」的内容一致）。
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
