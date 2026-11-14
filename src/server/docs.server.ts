import type { Locale } from '#/paraglide/runtime.js'

const files = import.meta.glob<string>(
  ['../../content/{en,zh}/docs/getting-started.md', '../../content/{en,zh}/docs/herdr.md'],
  { eager: true, query: '?raw', import: 'default' },
)

export function getDocument(locale: Locale, slug: string) {
  const markdown = files[`../../content/${locale}/docs/${slug}.md`]
  return markdown?.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trimStart()
}
