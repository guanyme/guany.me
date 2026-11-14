import { Link, createFileRoute } from '@tanstack/react-router'
import { getDocumentForRoute } from '#/server/docs.functions'

export const Route = createFileRoute('/{-$locale}/docs/$')({
  loader: ({ params, context }) =>
    getDocumentForRoute({
      data: { locale: context.locale, slug: params._splat },
    }),
  component: Document,
})

function Document() {
  const markdown = Route.useLoaderData()
  const params = Route.useParams()
  const [heading, ...body] = markdown.split('\n')

  return (
    <article>
      <h1 className="text-3xl font-bold">{heading.replace(/^# /, '')}</h1>
      <pre className="mt-4 whitespace-pre-wrap">{body.join('\n').trimStart()}</pre>
      <Link
        className="mt-4 inline-block underline"
        to="/{-$locale}/docs/$"
        params={{ ...params, _splat: 'herdr' }}
      >
        Herdr
      </Link>
    </article>
  )
}
