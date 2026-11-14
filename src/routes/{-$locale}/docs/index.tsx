import { createFileRoute, redirect } from '@tanstack/react-router'
import { docsIndexSlug } from '#/lib/docs-config'

export const Route = createFileRoute('/{-$locale}/docs/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/{-$locale}/docs/$',
      params: { ...params, _splat: docsIndexSlug },
      search: true,
      hash: true,
      statusCode: 307,
    })
  },
})
