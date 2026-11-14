import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/projects/')({
  validateSearch: (search): { keyword?: string } => ({
    keyword: typeof search.keyword === 'string' ? search.keyword : undefined,
  }),
  component: Projects,
})

function Projects() {
  const { locale } = Route.useRouteContext()
  const { keyword } = Route.useSearch()
  const params = Route.useParams()
  const showProject = !keyword || 'guany.me'.includes(keyword.toLowerCase())

  return (
    <>
      <h1 className="text-3xl font-bold">{locale === 'zh' ? '项目' : 'Projects'}</h1>
      {showProject && (
        <Link
          className="mt-4 inline-block underline"
          to="/{-$locale}/projects/$slug"
          params={{ ...params, slug: 'guany.me' }}
        >
          guany.me
        </Link>
      )}
    </>
  )
}
