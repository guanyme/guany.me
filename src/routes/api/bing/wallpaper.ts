import { createFileRoute } from '@tanstack/react-router'
import { baseLocale, toLocale } from '#/paraglide/runtime.js'
import { getBingWallpaper } from '#/server/wallpaper.server'

export const Route = createFileRoute('/api/bing/wallpaper')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const language = new URL(request.url).searchParams.get('locale') ?? ''
        const locale = toLocale(language) ?? toLocale(language.split('-')[0]) ?? baseLocale
        const result = await getBingWallpaper(locale)
        return result
          ? Response.json(result)
          : Response.json({ error: 'Failed to fetch Bing wallpaper' }, { status: 502 })
      },
    },
  },
})
