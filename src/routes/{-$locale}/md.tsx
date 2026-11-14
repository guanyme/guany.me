import { createFileRoute } from '@tanstack/react-router'
import { MarkdownView } from '#/components/markdown/markdown-view'
import { m } from '#/paraglide/messages.js'
import { getRemoteMarkdown } from '#/server/remote-markdown.functions'

export const Route = createFileRoute('/{-$locale}/md')({
  validateSearch: (search): { url?: string } => ({
    url: typeof search.url === 'string' && search.url ? search.url : undefined,
  }),
  loaderDeps: ({ search }) => ({ url: search.url }),
  loader: ({ deps }) => (deps.url ? getRemoteMarkdown({ data: deps.url }) : null),
  staleTime: 60_000,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: MdPage,
})

function MdPage() {
  const { locale } = Route.useRouteContext()
  const result = Route.useLoaderData()
  const status = {
    'missing-url': m.md_provide_link,
    'unsupported-url': m.md_unsupported_url,
    'fetch-failed': m.md_fetch_failed,
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-24">
      {result?.kind === 'ready' ? (
        <article className="max-w-none">
          <MarkdownView trusted={false} baseUrl={result.url} locale={locale}>
            {result.markdown}
          </MarkdownView>
        </article>
      ) : (
        <p className="text-muted-foreground">
          {status[result?.kind ?? 'missing-url']({}, { locale })}
        </p>
      )}
    </div>
  )
}
