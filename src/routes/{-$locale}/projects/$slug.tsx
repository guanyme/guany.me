import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react'
import { siGithub } from 'simple-icons'
import { ContentFooter } from '#/components/content-footer'
import { CopyMarkdownButton } from '#/components/copy-markdown-button'
import { MarkdownView } from '#/components/markdown/markdown-view'
import { softwareJsonLd } from '#/lib/json-ld'
import { siteHead, siteUrl } from '#/lib/site'
import { useCopy } from '#/lib/use-copy'
import { Button, buttonVariants } from '#/components/ui/button'
import { m } from '#/paraglide/messages.js'
import { baseLocale, localizeHref, type Locale } from '#/paraglide/runtime.js'
import { getProjectPage } from '#/server/projects.functions'

export const Route = createFileRoute('/{-$locale}/projects/$slug')({
  loader: ({ context: { locale }, params: { slug } }) => getProjectPage({ data: { locale, slug } }),
  head: ({ loaderData, params }) => {
    const locale = params.locale ?? baseLocale
    const pathname = projectPath(params.slug)
    const repo = loaderData?.repo
    return siteHead({
      locale,
      pathname,
      title: repo?.name ?? m.projects_not_found({}, { locale }),
      description:
        repo?.description ?? m.projects_project_details({ name: params.slug }, { locale }),
    })
  },
  component: Project,
  notFoundComponent: ProjectNotFound,
})

function projectPath(slug: string) {
  return `/projects/${encodeURIComponent(slug)}`
}

function CopyCloneButton({ fullName, locale }: { fullName: string; locale: Locale }) {
  const [copied, copy] = useCopy()

  return (
    <Button
      variant="outline"
      type="button"
      onClick={() => void copy(`https://github.com/${fullName}.git`)}
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? m.projects_copied({}, { locale }) : m.projects_copy_clone_url({}, { locale })}
    </Button>
  )
}

function ProjectNotFound() {
  const { locale } = Route.useRouteContext()
  return <p className="mx-auto max-w-4xl px-4 pt-8 pb-24">{m.projects_not_found({}, { locale })}</p>
}

function Project() {
  const { locale } = Route.useRouteContext()
  const { repo, readme, previous, next } = Route.useLoaderData()
  const localizedProjectPath = (slug: string) => localizeHref(projectPath(slug), { locale })
  const url = new URL(localizedProjectPath(repo.name), siteUrl).href
  const readmeName = locale === baseLocale ? 'README.md' : `README.${locale}.md`
  const editUrl = `https://github.com/${repo.full_name}/edit/${repo.default_branch}/${readmeName}`
  const schema = softwareJsonLd({
    name: repo.name,
    description: repo.description,
    url,
    codeRepository: repo.html_url,
    programmingLanguage: repo.language,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/{-$locale}/projects"
          params={{ locale: locale === baseLocale ? undefined : locale }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {m.projects_back_to_list({}, { locale })}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <CopyCloneButton fullName={repo.full_name} locale={locale} />
          {readme && <CopyMarkdownButton content={readme} locale={locale} />}
          <a
            className={buttonVariants({ variant: 'outline' })}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              data-icon="inline-start"
            >
              <path d={siGithub.path} />
            </svg>
            GitHub
          </a>
          {repo.homepage && (
            <a
              className={buttonVariants({ variant: 'outline' })}
              href={repo.homepage}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink data-icon="inline-start" />
              {m.projects_visit({}, { locale })}
            </a>
          )}
        </div>
      </div>

      <article className="max-w-none">
        {readme ? (
          <MarkdownView repositoryReadme locale={locale}>
            {readme}
          </MarkdownView>
        ) : (
          <>
            <h1 className="mb-4 text-3xl font-bold">{repo.name}</h1>
            <p className="text-muted-foreground">{m.projects_no_readme({}, { locale })}</p>
          </>
        )}
      </article>

      <div className="mt-16 border-t pt-6">
        <ContentFooter
          editUrl={editUrl}
          locale={locale}
          collection="projects"
          prev={previous ? { title: previous, slug: previous } : undefined}
          next={next ? { title: next, slug: next } : undefined}
        />
      </div>
    </div>
  )
}
