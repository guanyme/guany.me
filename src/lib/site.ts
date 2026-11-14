import { m } from '#/paraglide/messages.js'
import { localizeUrl, type Locale } from '#/paraglide/runtime.js'

export const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://guany.me').replace(/\/$/, '')
export const THEME_COLOR = { light: '#ffffff', dark: '#121212' } as const

export function siteHead({
  locale,
  pathname,
  title,
  description = m.metadata_site_description({}, { locale }),
}: {
  locale: Locale
  pathname: string
  title?: string
  description?: string
}) {
  const name = m.metadata_site_title({}, { locale })
  const pageTitle = title ? `${title} | ${name}` : name
  const url = new URL(pathname, siteUrl)
  const href = (language: Locale) => {
    const localized = localizeUrl(url, { locale: language })
    if (pathname === '/') localized.pathname = localized.pathname.replace(/(.)\/$/, '$1')
    return localized.href
  }
  const canonical = href(locale)

  return {
    meta: [
      { title: pageTitle },
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: name },
      { property: 'og:locale', content: locale === 'zh' ? 'zh' : 'en_US' },
      { property: 'og:url', content: canonical },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: description },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: description },
    ],
    links: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hrefLang: 'en', href: href('en') },
      { rel: 'alternate', hrefLang: 'zh', href: href('zh') },
    ],
  }
}
