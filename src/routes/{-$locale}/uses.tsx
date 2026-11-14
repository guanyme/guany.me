import { createFileRoute } from '@tanstack/react-router'
import { ContentFooter } from '#/components/content-footer'
import { CopyMarkdownButton } from '#/components/copy-markdown-button'
import { MarkdownView } from '#/components/markdown/markdown-view'
import { siteHead } from '#/lib/site'
import { m } from '#/paraglide/messages.js'
import { getDocumentForRoute } from '#/server/docs.functions'

export const Route = createFileRoute('/{-$locale}/uses')({
  loader: async ({ context }) => ({
    content: await getDocumentForRoute({
      data: { locale: context.locale, slug: 'uses', collection: 'pages' },
    }),
    locale: context.locale,
  }),
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { locale } = loaderData
    return siteHead({
      locale,
      pathname: '/uses',
      title: m.uses_title({}, { locale }),
      description: m.uses_description({}, { locale }),
    })
  },
  component: Uses,
})

function Uses() {
  const { content, locale } = Route.useLoaderData()
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
      <div className="mb-8 flex items-center justify-end">
        <CopyMarkdownButton content={content.markdown} locale={locale} />
      </div>
      <article className="mx-auto">
        <MarkdownView trusted locale={locale}>
          {content.markdown}
        </MarkdownView>
      </article>
      <footer className="mt-16 border-t pt-6">
        <ContentFooter
          editUrl={`https://github.com/guanyme/guany.me/edit/main/content/${content.sourcePath}`}
          locale={locale}
          lastUpdated={content.lastUpdated}
        />
      </footer>
    </div>
  )
}
