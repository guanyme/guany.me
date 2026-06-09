import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export function proxy(request: NextRequest) {
  return handleI18nRouting(request)
}

export const config = {
  matcher: [
    // All paths except API routes, Next internals, and static files (which
    // contain a dot). next-intl handles locale routing for the rest.
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
    // Project slugs can themselves contain a dot (e.g. /projects/guany.me), so
    // the dot-exclusion above would skip them and 404 the unprefixed default-
    // locale URL. Match project routes explicitly so the locale gets injected.
    '/projects/:path*',
  ],
}
