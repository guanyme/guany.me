import { createFileRoute } from '@tanstack/react-router'
import { ContentFooter } from '#/components/content-footer'
import { CopyMarkdownButton } from '#/components/copy-markdown-button'
import { DocsNav } from '#/components/docs/docs-nav'
import { DocsToc } from '#/components/docs/docs-toc'
import { extractToc } from '#/components/markdown/headings'
import { MarkdownView } from '#/components/markdown/markdown-view'
import { docItemTitle, getDocNavigation } from '#/lib/docs-config'
import { techArticleJsonLd } from '#/lib/json-ld'
import { siteHead, siteUrl } from '#/lib/site'
import { m } from '#/paraglide/messages.js'
import { baseLocale, localizeUrl } from '#/paraglide/runtime.js'
import { getDocumentForRoute } from '#/server/docs.functions'

export const Route = createFileRoute('/{-$locale}/docs/$')({
  loader: async ({ params, context }) => ({
    content: await getDocumentForRoute({
      data: { locale: context.locale, slug: params._splat, collection: 'docs' },
    }),
    locale: context.locale,
  }),
  head: ({ loaderData, params }) => {
    const locale = loaderData?.locale ?? params.locale ?? baseLocale
    const pathname = `/docs/${params._splat}`
    if (!loaderData) return { meta: [{ title: m.docs_not_found({}, { locale }) }] }

    const { title, description, lastUpdated } = loaderData.content
    const url = localizeUrl(new URL(pathname, siteUrl), { locale }).href
    return {
      ...siteHead({ locale, pathname, title, description }),
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(
            techArticleJsonLd({ title, description, url, dateModified: lastUpdated, locale }),
          ).replace(/</g, '\\u003c'),
        },
      ],
    }
  },
  component: Document,
})

function Document() {
  const { content: doc, locale } = Route.useLoaderData()
  const toc = extractToc(doc.markdown)
  const { prev, next } = getDocNavigation(doc.slug)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <aside className="fixed top-24 hidden max-h-[calc(100vh-6rem)] w-60 overflow-y-auto pr-2 pb-8 lg:left-4 lg:block xl:left-[calc((100vw-80rem)/2+1rem)]">
        <DocsNav locale={locale} />
      </aside>
      <div className="min-w-0 py-8 lg:ml-[17rem]">
        <div className="mb-4 flex justify-end xl:hidden">
          <CopyMarkdownButton content={doc.markdown} locale={locale} />
        </div>
        <article className="max-w-none min-w-0 xl:mr-[17rem] [&_:is(h2,h3,h4,h5,h6)]:scroll-mt-[5.5rem]">
          <MarkdownView trusted locale={locale}>
            {doc.markdown}
          </MarkdownView>
        </article>
        <footer className="mt-16 border-t pt-6 xl:mr-[17rem]">
          <ContentFooter
            editUrl={`https://github.com/guanyme/guany.me/edit/main/content/${doc.sourcePath}`}
            locale={locale}
            lastUpdated={doc.lastUpdated}
            prev={prev ? { title: docItemTitle(prev, locale), slug: prev.slug } : undefined}
            next={next ? { title: docItemTitle(next, locale), slug: next.slug } : undefined}
          />
        </footer>
        <DocsToc key={`${locale}/${doc.slug}`} toc={toc} markdown={doc.markdown} locale={locale} />
      </div>
    </div>
  )
}
