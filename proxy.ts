import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

// /docs/zsh.md, /zh/docs/zsh.md → the document's original Markdown source.
// Bypass next-intl to avoid redirects to another language version based on the browser language.
const docsMarkdownPath = new RegExp(
  `^(?:/(${routing.locales.join('|')}))?/docs/(.+)\\.md$`,
)

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(docsMarkdownPath)
  if (match) {
    const [, locale = routing.defaultLocale, slug] = match
    return NextResponse.rewrite(
      new URL(`/api/docs-md/${locale}/${slug}`, request.url),
    )
  }
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
    // Likewise, document URLs ending in .md contain a dot, so they need to be matched explicitly to reach the rewrite above.
    '/docs/:path*',
    '/:locale/docs/:path*',
  ],
}
