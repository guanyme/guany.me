import { cache } from 'react'
import type {
  HeroBackground,
  HeroBackgroundConfig,
  HomeConfig,
} from '@/types/hero'
import { toMkt } from '@/lib/locale'
import { fetchWithTimeout } from '@/lib/server-fetch'

const HOME_CONFIG_URL = process.env.HOME_CONFIG_URL

function normalizePosition(position?: string): string {
  const trimmed = position?.trim()
  return trimmed || 'center'
}

function toCustomBackground(
  config: HeroBackgroundConfig,
): HeroBackground | null {
  if (config.mode !== 'custom') return null

  const url = config.url?.trim()
  if (!url) return null

  return {
    url,
    position: normalizePosition(config.position),
  }
}

async function getRemoteHeroConfig(): Promise<HeroBackgroundConfig | null> {
  if (!HOME_CONFIG_URL) return null

  try {
    const res = await fetchWithTimeout(HOME_CONFIG_URL, {
      next: { revalidate: 300 },
      timeoutMs: 5000,
    })
    if (!res.ok) return null

    const data = (await res.json()) as HomeConfig
    return data.hero ?? null
  } catch {
    return null
  }
}

async function getBingWallpaper(locale: string): Promise<string | null> {
  const mkt = toMkt(locale)
  try {
    const res = await fetchWithTimeout(
      `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${mkt}`,
      {
        next: { revalidate: 3600 },
        timeoutMs: 5000,
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    return `https://www.bing.com${data.images[0].url}`
  } catch {
    return null
  }
}

export const getHeroBackground = cache(
  async (locale: string): Promise<HeroBackground | null> => {
    const remoteConfig = await getRemoteHeroConfig()
    const customBackground = remoteConfig
      ? toCustomBackground(remoteConfig)
      : null
    if (customBackground) return customBackground

    const url = await getBingWallpaper(locale)
    if (!url) return null
    return {
      url,
      position: normalizePosition(remoteConfig?.position),
    }
  },
)
