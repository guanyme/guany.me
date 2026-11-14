import '@tanstack/react-start/server-only'
import matter from 'gray-matter'
import type { Locale } from '#/paraglide/runtime.js'

type Collection = 'docs' | 'pages'

interface ContentDocument {
  slug: string
  title: string
  description?: string
  markdown: string
  lastUpdated?: string
  sourcePath: string
}

const files = import.meta.glob<string>('../../content/{en,zh}/{docs,pages}/**/*.{md,mdx}', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const [timestamps = {}] = Object.values(
  import.meta.glob<Record<string, string>>('../../content/timestamps.json', {
    eager: true,
    import: 'default',
  }),
)

export function getContent(
  locale: Locale,
  collection: Collection,
  slug: string,
): ContentDocument | undefined {
  const base = `${locale}/${collection}/${slug}`
  const sourcePath = `${base}.${files[`../../content/${base}.mdx`] !== undefined ? 'mdx' : 'md'}`
  const source = files[`../../content/${sourcePath}`]
  if (source === undefined) return

  const { data, content } = matter(source)
  const markdown = content.trimStart()
  return {
    slug,
    title:
      typeof data.title === 'string'
        ? data.title
        : (markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? slug),
    description: typeof data.description === 'string' ? data.description : undefined,
    markdown,
    lastUpdated: timestamps[sourcePath],
    sourcePath,
  }
}

export function getContentSlugs(locale: Locale, collection: Collection): string[] {
  const prefix = `../../content/${locale}/${collection}/`
  return [
    ...new Set(
      Object.keys(files)
        .filter((path) => path.startsWith(prefix))
        .map((path) => path.slice(prefix.length).replace(/\.mdx?$/, '')),
    ),
  ].sort()
}

export function getDocument(locale: Locale, slug: string) {
  return getContent(locale, 'docs', slug)?.markdown
}
