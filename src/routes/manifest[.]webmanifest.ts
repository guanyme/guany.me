import { createFileRoute } from '@tanstack/react-router'
import { THEME_COLOR } from '#/lib/site'
import { m } from '#/paraglide/messages.js'
import { baseLocale } from '#/paraglide/runtime.js'

export const Route = createFileRoute('/manifest.webmanifest')({
  server: {
    handlers: {
      GET: () => {
        const name = m.metadata_short_name({}, { locale: baseLocale })
        return Response.json(
          {
            name,
            short_name: name,
            start_url: '/',
            display: 'standalone',
            background_color: THEME_COLOR.light,
            theme_color: THEME_COLOR.light,
            icons: [192, 512].map((size) => ({
              src: `/icons/pwa-${size}x${size}.png`,
              sizes: `${size}x${size}`,
              type: 'image/png',
            })),
          },
          {
            headers: {
              'Content-Type': 'application/manifest+json; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          },
        )
      },
    },
  },
})
