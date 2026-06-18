import type { MetadataRoute } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { THEME_COLOR } from '@/lib/site'

// Kept static (default-locale strings, no request headers) so the manifest is
// cacheable. A dynamic manifest is served with `max-age=0, must-revalidate`,
// which makes the browser re-fetch it — and re-resolve its icons — on every
// client-side navigation. The PWA install name uses the default locale.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: 'metadata',
  })

  return {
    name: t('shortName'),
    short_name: t('shortName'),
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
