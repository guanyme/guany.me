import { type NextRequest, NextResponse } from 'next/server'
import { cacheLife } from 'next/cache'
import type { BingWallpaperResponse } from '@/types/bing'
import { toMkt } from '@/lib/locale'

async function fetchWallpaper(mkt: string) {
  'use cache: remote'
  const res = await fetch(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${mkt}`)
  if (!res.ok) {
    cacheLife('minutes')
    return { status: res.status, data: null }
  }
  cacheLife({ revalidate: 3600 })
  return { status: res.status, data: (await res.json()) as BingWallpaperResponse }
}

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get('locale') || 'en'
  const { status, data } = await fetchWallpaper(toMkt(locale))

  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch Bing wallpaper' }, { status })
  }
  const wallpaperUrl = `https://www.bing.com${data.images[0].url}`

  return NextResponse.json({
    url: wallpaperUrl,
    copyright: data.images[0].copyright,
    title: data.images[0].title,
  })
}
