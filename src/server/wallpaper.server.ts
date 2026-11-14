import '@tanstack/react-start/server-only'

import { env } from 'cloudflare:workers'
import { z } from 'zod'
import type { Locale } from '#/paraglide/runtime.js'
import { webUrl } from '#/types/github'
import { cachedPublicData } from './public-cache.server'

const bingUrl = 'https://www.bing.com'
const markets = { en: 'en-US', zh: 'zh-CN' } satisfies Record<Locale, string>
const imageSchema = z.object({
  url: z.string(),
  copyright: z.string(),
  title: z.string(),
})
const remoteConfigSchema = z.object({
  hero: z
    .object({
      mode: z.enum(['bing', 'custom']).optional(),
      url: z.string().optional(),
      position: z.string().optional(),
    })
    .optional(),
})
const wallpaperSchema = z.object({ ...imageSchema.shape, url: webUrl })
const resultSchema = wallpaperSchema.nullable()

export function getBingWallpaper(locale: Locale) {
  const market = markets[locale]
  return cachedPublicData({
    name: `bing:${market}`,
    ttl: 60 * 60_000,
    schema: resultSchema,
    fallback: null,
    async load() {
      const response = await fetch(
        `${bingUrl}/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${market}`,
        { signal: AbortSignal.timeout(5_000) },
      )
      if (!response.ok) throw new Error(`Bing wallpaper returned ${response.status}`)

      const { images } = z
        .object({ images: z.tuple([imageSchema]).rest(imageSchema) })
        .parse(await response.json())
      const url = new URL(images[0].url, bingUrl)
      if (url.origin !== bingUrl) throw new Error('Bing wallpaper URL points to an unexpected host')
      return { ...images[0], url: url.href }
    },
  })
}

async function getRemoteHeroConfig() {
  const configUrl = webUrl.safeParse(env.SITE_CONFIG_URL)
  if (!configUrl.success) return null
  return cachedPublicData({
    name: 'hero:configuration',
    ttl: 5 * 60_000,
    schema: remoteConfigSchema.nullable(),
    fallback: null,
    async load() {
      const response = await fetch(configUrl.data, { signal: AbortSignal.timeout(5_000) })
      if (!response.ok) throw new Error(`Hero configuration returned ${response.status}`)
      return remoteConfigSchema.parse(await response.json())
    },
  })
}

export async function getHeroBackground(locale: Locale) {
  const config = (await getRemoteHeroConfig())?.hero
  const position = config?.position?.trim() || 'center'
  if (config?.mode === 'custom') {
    const url = webUrl.safeParse(config.url?.trim())
    if (url.success) return { url: url.data, position }
  }
  const result = await getBingWallpaper(locale)
  return result ? { url: result.url, position } : null
}
