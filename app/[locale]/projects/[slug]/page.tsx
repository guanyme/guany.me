import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { siGithub } from 'simple-icons'
import { SimpleIcon } from '@/components/simple-icon'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { getRepos, getRepo, getRepoReadme } from '@/lib/github'
import { StreamdownRenderer } from '@/components/markdown/streamdown-renderer'
import { CopyCloneButton } from '@/components/copy-clone-button'
import { CopyMarkdownButton } from '@/components/copy-markdown-button'
import { ContentFooter } from '@/components/content-footer'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { siteUrl } from '@/lib/site'
import { softwareJsonLd } from '@/lib/json-ld'

interface ProjectPageProps {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  const repos = await getRepos()
  return repos.map((repo) => ({
    slug: repo.name,
  }))
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  const repo = await getRepo(slug)

  if (!repo) {
    return { title: t('notFound') }
  }

  return {
    title: repo.name,
    description: repo.description || t('projectDetails', { name: repo.name }),
    alternates: {
      canonical: `${siteUrl}/projects/${slug}`,
      languages: {
        en: `${siteUrl}/projects/${slug}`,
        zh: `${siteUrl}/zh/projects/${slug}`,
      },
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const t = await getTranslations('projects')
  const [repo, repos] = await Promise.all([getRepo(slug), getRepos()])

  if (!repo) {
    notFound()
  }

  const index = repos.findIndex((r) => r.name === slug)
  const prevRepo = index > 0 ? repos[index - 1] : null
  const nextRepo = index < repos.length - 1 ? repos[index + 1] : null

  const readme = await getRepoReadme(
    repo.full_name,
    repo.default_branch,
    locale,
  )

  const localePrefix = locale === 'en' ? '' : `/${locale}`

  return (
    <div className="mx-auto max-w-4xl px-4 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            softwareJsonLd({
              name: repo.name,
              description: repo.description,
              url: `${siteUrl}${localePrefix}/projects/${slug}`,
              codeRepository: repo.html_url,
              programmingLanguage: repo.language,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('backToList')}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <CopyCloneButton fullName={repo.full_name} />
          {readme && <CopyMarkdownButton content={readme} />}
          <Button variant="outline" size="sm" asChild>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              <SimpleIcon icon={siGithub} className="mr-1.5 size-4" />
              GitHub
            </a>
          </Button>
          {repo.homepage && (
            <Button variant="outline" size="sm" asChild>
              <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 size-4" />
                {t('visit')}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* README */}
      <article className="max-w-none">
        {readme ? (
          <StreamdownRenderer content={readme} />
        ) : (
          <p className="text-muted-foreground">{t('noReadme')}</p>
        )}
      </article>

      <div className="mt-16 border-t pt-6">
        <ContentFooter
          editUrl={`https://github.com/${repo.full_name}/edit/${repo.default_branch}/${locale !== 'en' ? `README.${locale}.md` : 'README.md'}`}
          locale={locale}
          prev={
            prevRepo
              ? { title: prevRepo.name, href: `/projects/${prevRepo.name}` }
              : null
          }
          next={
            nextRepo
              ? { title: nextRepo.name, href: `/projects/${nextRepo.name}` }
              : null
          }
        />
      </div>
    </div>
  )
}
