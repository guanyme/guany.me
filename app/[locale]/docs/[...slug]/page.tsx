import { notFound } from 'next/navigation'
import matter from 'gray-matter'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import {
  getDocBySlug,
  getAllDocs,
  extractToc,
  getDocLastUpdated,
} from '@/lib/mdx'
import { DocsToc } from '@/components/docs/docs-toc'
import { DocsFooter } from '@/components/docs/docs-footer'
import { StreamdownRenderer } from '@/components/markdown/streamdown-renderer'
import { siteUrl } from '@/lib/site'
import { techArticleJsonLd } from '@/lib/json-ld'

interface DocsPageProps {
  params: Promise<{ locale: string; slug: string[] }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  const docs = getAllDocs('en', 'docs')
  return docs.map((doc) => ({
    slug: doc.slug.split('/'),
  }))
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'docs' })
  const slugPath = slug.join('/')
  const doc = getDocBySlug(locale, 'docs', slugPath)

  if (!doc) {
    return { title: t('notFound') }
  }

  return {
    title: doc.meta.title || slugPath,
    description: doc.meta.description,
    alternates: {
      canonical: `${siteUrl}/docs/${slugPath}`,
      languages: {
        en: `${siteUrl}/docs/${slugPath}`,
        zh: `${siteUrl}/zh/docs/${slugPath}`,
      },
    },
  }
}

export default async function DocsSlugPage({ params }: DocsPageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const slugPath = slug.join('/')
  const doc = getDocBySlug(locale, 'docs', slugPath)

  if (!doc) {
    notFound()
  }

  const { content: rawContent } = matter(doc.content)
  const toc = extractToc(doc.content)
  const lastUpdated = getDocLastUpdated(locale, slugPath)
  const localePrefix = locale === 'en' ? '' : `/${locale}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            techArticleJsonLd({
              title: doc.meta.title || slugPath,
              description: doc.meta.description,
              url: `${siteUrl}${localePrefix}/docs/${slugPath}`,
              dateModified: lastUpdated,
              locale,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />
      <article className="max-w-none min-w-0 xl:mr-[17rem]">
        <StreamdownRenderer content={rawContent} />
      </article>
      <DocsFooter slug={slugPath} locale={locale} />
      <DocsToc toc={toc} rawContent={rawContent} />
    </>
  )
}
