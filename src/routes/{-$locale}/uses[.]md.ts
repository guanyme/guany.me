import { createFileRoute } from '@tanstack/react-router'
import { baseLocale, isLocale } from '#/paraglide/runtime.js'
import { getContent } from '#/server/docs.server'

export const Route = createFileRoute('/{-$locale}/uses.md')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const locale = params.locale ?? baseLocale
        const content = isLocale(locale) && getContent(locale, 'pages', 'uses')
        if (!content) return new Response('Not Found', { status: 404 })

        return new Response(content.markdown, {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        })
      },
    },
  },
})
