import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { THEME_COLOR } from '@/lib/site'

function detectLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return routing.defaultLocale
  const candidates = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase().split('-')[0])
  for (const lang of candidates) {
    if ((routing.locales as readonly string[]).includes(lang)) {
      return lang
    }
  }
  return routing.defaultLocale
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const h = await headers()
  const locale = detectLocale(h.get('accept-language'))
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    name: t('siteTitle'),
    short_name: t('shortName'),
    description: t('siteDescription'),
    start_url: '/',
    display: 'standalone',
    background_color: THEME_COLOR.light,
    theme_color: THEME_COLOR.light,
    icons: [
      { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
