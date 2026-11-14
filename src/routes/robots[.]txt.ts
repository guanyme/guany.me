import { createFileRoute } from '@tanstack/react-router'
import { siteUrl } from '#/lib/site'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`,
          { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
        ),
    },
  },
})
