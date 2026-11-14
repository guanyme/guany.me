import { createFileRoute } from '@tanstack/react-router'
import { docsConfig } from '#/lib/docs-config'
import { siteUrl } from '#/lib/site'
import { baseLocale, locales, localizeUrl } from '#/paraglide/runtime.js'
import { getContent } from '#/server/docs.server'
import { getRepos } from '#/server/github.server'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const repos = await getRepos()
        const entries = [
          sitemapEntry('/'),
          ...docsConfig.flatMap(({ items }) =>
            items.flatMap(({ slug }) => {
              const doc = getContent(baseLocale, 'docs', slug)
              return doc ? [sitemapEntry(`/docs/${slug}`, doc.lastUpdated)] : []
            }),
          ),
          sitemapEntry('/projects'),
          ...repos.map(({ name, updated_at }) =>
            sitemapEntry(`/projects/${encodeURIComponent(name)}`, updated_at),
          ),
          sitemapEntry('/uses', getContent(baseLocale, 'pages', 'uses')?.lastUpdated),
          sitemapEntry('/llms.txt', undefined, false),
          sitemapEntry('/llms-full.txt', undefined, false),
        ]

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`,
          { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
        )
      },
    },
  },
})

function sitemapEntry(pathname: string, modified?: string | null, localized = true) {
  const canonical = new URL(pathname, siteUrl)
  const timestamp = modified && new Date(modified)
  const lastModified =
    timestamp && Number.isFinite(timestamp.getTime())
      ? `<lastmod>${timestamp.toISOString()}</lastmod>`
      : ''
  const alternates = localized
    ? locales
        .map((locale) => {
          const url = localizeUrl(canonical, { locale })
          const href = pathname === '/' && locale !== baseLocale ? url.href.slice(0, -1) : url.href
          return `<xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(href)}" />`
        })
        .join('')
    : ''
  return `<url><loc>${escapeXml(canonical.href)}</loc>${alternates}${lastModified}</url>`
}

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}
