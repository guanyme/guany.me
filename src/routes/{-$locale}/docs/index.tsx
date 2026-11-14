import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/docs/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/{-$locale}/docs/$',
      params: { ...params, _splat: 'getting-started' },
      statusCode: 307,
    })
  },
})
