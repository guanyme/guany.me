import { match } from '@formatjs/intl-localematcher'
import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'
import {
  appendResponseHeader,
  getCookie,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'
import Negotiator from 'negotiator'
import { defaultLocale, isLocale, localeCookie, locales } from '#/locale'

const localeMiddleware = createMiddleware().server(async ({ request, handlerType, next }) => {
  if (handlerType !== 'router' || !['GET', 'HEAD'].includes(request.method)) return next()

  const url = new URL(request.url)
  const prefix = url.pathname.split('/')[1]
  const pathname = isLocale(prefix) ? url.pathname.slice(prefix.length + 1) || '/' : url.pathname
  const sitePage = /^\/(?:docs(?:\/.*)?|projects(?:\/.*)?)?$/
  if (!sitePage.test(pathname) || (pathname.startsWith('/docs/') && pathname.endsWith('.md'))) {
    return next()
  }

  const acceptLanguage = request.headers.get('accept-language')
  const accepted = new Negotiator({
    headers: { 'accept-language': acceptLanguage ?? undefined },
  })
    .languages()
    .filter((language) => language !== '*')

  let browserLocale = defaultLocale
  try {
    const result = match(accepted, [...locales].reverse(), defaultLocale)
    if (isLocale(result)) browserLocale = result
  } catch {
    browserLocale = defaultLocale
  }

  const stored = getCookie(localeCookie)
  const locale = isLocale(prefix) ? prefix : isLocale(stored) ? stored : browserLocale
  const destination =
    locale === defaultLocale ? pathname : `/${locale}${pathname === '/' ? '' : pathname}`
  const fetchDestination = request.headers.get('sec-fetch-dest')
  if (!isLocale(prefix)) {
    appendResponseHeader('Vary', 'Accept-Language, Cookie')
  }
  if (
    (!fetchDestination || fetchDestination === 'document') &&
    (stored ?? browserLocale) !== locale
  ) {
    setCookie(localeCookie, locale, { path: '/', sameSite: 'lax' })
    setResponseHeader('Cache-Control', 'private, no-store')
  }

  if (url.pathname !== destination && url.pathname !== `${destination}/`) {
    return new Response(null, {
      status: 307,
      headers: {
        Location: destination + url.search,
        'Cache-Control': 'private, no-store',
        Vary: 'Accept-Language, Cookie',
      },
    })
  }

  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({ filter: ({ handlerType }) => handlerType === 'serverFn' }),
    localeMiddleware,
  ],
}))
