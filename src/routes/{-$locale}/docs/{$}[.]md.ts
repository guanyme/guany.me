import { createFileRoute } from '@tanstack/react-router'
import { defaultLocale, isLocale } from '#/locale'
import { getDocument } from '#/server/docs.server'

export const Route = createFileRoute('/{-$locale}/docs/{$}.md')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const locale = params.locale ?? defaultLocale
        const markdown = isLocale(locale) && getDocument(locale, params._splat ?? '')
        if (!markdown) return new Response('Not Found', { status: 404 })
        return new Response(markdown, {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        })
      },
    },
  },
})
