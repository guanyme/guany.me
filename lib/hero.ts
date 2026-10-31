import { cache } from 'react'
import { cacheLife } from 'next/cache'
import type { HeroBackground, HeroBackgroundConfig, HomeConfig } from '@/types/hero'
import { toMkt } from '@/lib/locale'
import { fetchWithTimeout } from '@/lib/server-fetch'

const SITE_CONFIG_URL = process.env.SITE_CONFIG_URL

function normalizePosition(position?: string): string {
  const trimmed = position?.trim()
  return trimmed || 'center'
}

function toCustomBackground(config: HeroBackgroundConfig): HeroBackground | null {
  if (config.mode !== 'custom') return null

  const url = config.url?.trim()
  if (!url) return null

  return {
    url,
    position: normalizePosition(config.position),
  }
}

// Failures get the one-minute profile rather than the full lifetime, so a flaky upstream is retried soon
async function getRemoteHeroConfig(): Promise<HeroBackgroundConfig | null> {
  'use cache: remote'
  if (!SITE_CONFIG_URL) return null

  try {
    const res = await fetchWithTimeout(SITE_CONFIG_URL, {
      timeoutMs: 5000,
    })
    if (res.ok) {
      const data = (await res.json()) as HomeConfig
      cacheLife({ revalidate: 300 })
      return data.hero ?? null
    }
  } catch {}
  cacheLife('minutes')
  return null
}

async function getBingWallpaper(locale: string): Promise<string | null> {
  'use cache: remote'
  const mkt = toMkt(locale)
  try {
    const res = await fetchWithTimeout(
      `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${mkt}`,
      {
        timeoutMs: 5000,
      },
    )
    if (res.ok) {
      const data = await res.json()
      cacheLife({ revalidate: 3600 })
      return `https://www.bing.com${data.images[0].url}`
    }
  } catch {}
  cacheLife('minutes')
  return null
}

export const getHeroBackground = cache(async (locale: string): Promise<HeroBackground | null> => {
  const remoteConfig = await getRemoteHeroConfig()
  const customBackground = remoteConfig ? toCustomBackground(remoteConfig) : null
  if (customBackground) return customBackground

  const url = await getBingWallpaper(locale)
  if (!url) return null
  return {
    url,
    position: normalizePosition(remoteConfig?.position),
  }
})
