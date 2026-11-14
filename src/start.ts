import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'
import {
  appendResponseHeader,
  getCookie,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'
import { docsIndexSlug } from '#/lib/docs-config'
import {
  baseLocale,
  cookieName,
  deLocalizeUrl,
  extractLocaleFromHeader,
  getLocale,
  isExcludedByRouteStrategy,
  isLocale,
  localizeUrl,
} from '#/paraglide/runtime.js'

const canonicalLocaleMiddleware = createMiddleware().server(
  async ({ request, handlerType, next }) => {
    if (handlerType !== 'router' || !['GET', 'HEAD'].includes(request.method)) return next()

    const url = new URL(request.url)
    if (isExcludedByRouteStrategy(url)) return next()

    const explicitLocale = isLocale(url.pathname.split('/')[1])
    const unlocalizedPath = explicitLocale ? deLocalizeUrl(url).pathname : url.pathname
    const pathname = unlocalizedPath.replace(/\/+$/, '') || '/'
    const sitePage = /^\/(?:docs(?:\/.*)?|projects(?:\/.*)?|uses|md|auth\/verified)?$/
    if (!sitePage.test(pathname)) return next()

    const locale = getLocale()
    const canonicalPath = pathname === '/docs' ? `/docs/${docsIndexSlug}` : pathname
    const localized = localizeUrl(new URL(canonicalPath, url), { locale }).pathname
    const destination = localized.replace(/(.)\/$/, '$1')
    const fetchDestination = request.headers.get('sec-fetch-dest')

    const stored = getCookie(cookieName)
    const preferred = stored ?? extractLocaleFromHeader(request) ?? baseLocale
    if ((!fetchDestination || fetchDestination === 'document') && preferred !== locale) {
      setCookie(cookieName, locale, { path: '/', sameSite: 'lax' })
      setResponseHeader('Cache-Control', 'private, no-store')
    }

    if (url.pathname !== destination) {
      return new Response(null, {
        status: 307,
        headers: {
          Location: destination + url.search,
          'Cache-Control': 'private, no-store',
          Vary: 'Accept-Language, Cookie',
        },
      })
    }

    if (!explicitLocale) appendResponseHeader('Vary', 'Accept-Language, Cookie')
    return next()
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({ filter: ({ handlerType }) => handlerType === 'serverFn' }),
    canonicalLocaleMiddleware,
  ],
}))
