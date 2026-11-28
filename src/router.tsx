import { createRouter as createTanStackRouter, defaultParseSearch } from '@tanstack/react-router'
import { RouteError } from '#/components/route-error'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultErrorComponent: RouteError,
    parseSearch: (searchString) => {
      const search: Record<string, unknown> = defaultParseSearch(searchString)
      const keyword = search.keyword
      // The project filter uses text, including values that also parse as JSON scalars.
      if (typeof keyword === 'number' || typeof keyword === 'boolean' || keyword === null) {
        search.keyword = new URLSearchParams(searchString).get('keyword') ?? undefined
      }
      return search
    },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
