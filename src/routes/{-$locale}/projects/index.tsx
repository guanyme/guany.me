import { createFileRoute } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { ProjectCard } from '#/components/home/project-card'
import { Input } from '#/components/ui/input'
import { siteHead } from '#/lib/site'
import { m } from '#/paraglide/messages.js'
import { baseLocale } from '#/paraglide/runtime.js'
import { getProjectsPage } from '#/server/projects.functions'

export const Route = createFileRoute('/{-$locale}/projects/')({
  validateSearch: (search): { keyword?: string } => ({
    keyword: typeof search.keyword === 'string' ? search.keyword : undefined,
  }),
  loader: ({ context: { locale } }) => getProjectsPage({ data: locale }),
  head: ({ params }) => {
    const locale = params.locale ?? baseLocale
    return siteHead({
      locale,
      pathname: '/projects',
      title: m.projects_title({}, { locale }),
      description: m.projects_description({}, { locale }),
    })
  },
  component: Projects,
})

function Projects() {
  const { locale } = Route.useRouteContext()
  const { keyword } = Route.useSearch()
  const navigate = Route.useNavigate()
  const repos = Route.useLoaderData()
  const query = keyword?.trim().toLowerCase()
  const visible = query
    ? repos.filter((repo) =>
        [repo.name, repo.tagline, repo.description, repo.language].some((value) =>
          value?.toLowerCase().includes(query),
        ),
      )
    : repos
  const searchLabel = m.projects_search_placeholder({}, { locale })

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
      <h1 className="mb-8 text-3xl font-bold">{m.projects_title({}, { locale })}</h1>
      <div className="sticky top-20 z-40 mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={searchLabel}
            placeholder={searchLabel}
            value={keyword ?? ''}
            onChange={(event) => {
              const value = event.currentTarget.value
              void navigate({
                search: (previous) => ({ ...previous, keyword: value || undefined }),
                replace: true,
                resetScroll: false,
              })
            }}
            className="h-9 bg-background pr-3 pl-10 text-sm shadow-sm dark:bg-background"
          />
        </div>
      </div>
      {visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((repo) => (
            <ProjectCard key={repo.id} repo={repo} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          {query ? m.projects_no_match({}, { locale }) : m.projects_no_projects({}, { locale })}
        </p>
      )}
    </div>
  )
}
