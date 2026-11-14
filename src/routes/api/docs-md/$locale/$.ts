import { createFileRoute } from '@tanstack/react-router'
import { isLocale } from '#/paraglide/runtime.js'
import { getDocument } from '#/server/docs.server'

export const Route = createFileRoute('/api/docs-md/$locale/$')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const markdown = isLocale(params.locale) && getDocument(params.locale, params._splat ?? '')
        if (!markdown) return new Response('Not Found', { status: 404 })
        return new Response(markdown, {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        })
      },
    },
  },
})
