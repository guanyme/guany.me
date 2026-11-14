import { defineConfig } from '@inlang/paraglide-js'

const negotiated = ['cookie', 'preferredLanguage', 'baseLocale']

export default defineConfig({
  outdir: './src/paraglide',
  emitTsDeclarations: true,
  cookieSameSite: 'lax',
  strategy: ['baseLocale'],
  routeStrategies: [
    { match: '/:locale(en|zh)?/docs/:file(.*).md{/}?', exclude: true },
    { match: '/:locale(en|zh)/:path(.*)?', strategy: ['url', 'cookie', 'baseLocale'] },
    { match: '/', strategy: negotiated },
    { match: '/docs/:path(.*)?', strategy: negotiated },
    { match: '/projects/:path(.*)?', strategy: negotiated },
    { match: '/uses{/}?', strategy: negotiated },
    { match: '/md{/}?', strategy: negotiated },
    { match: '/auth/verified{/}?', strategy: negotiated },
  ],
})
