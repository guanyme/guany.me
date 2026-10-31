import { Suspense, type ComponentProps } from 'react'
import { getTranslations } from 'next-intl/server'
import { getRepos, getRepoTagline } from '@/lib/github'
import { ProjectList } from '@/components/home/project-list'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params

  const repos = await getRepos()
  const enriched = await Promise.all(
    repos.map(async (repo) => ({
      ...repo,
      tagline: await getRepoTagline(repo.full_name, repo.default_branch, locale),
    })),
  )

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
      <h1 className="mb-8 text-3xl font-bold">
        <ProjectsTitle />
      </h1>
      {/* The unfiltered list is the static shell; a ?keyword= link only swaps in the pre-filled list */}
      <Suspense fallback={<ProjectList repos={enriched} />}>
        <KeywordProjectList repos={enriched} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function ProjectsTitle() {
  const t = await getTranslations('projects')
  return <>{t('title')}</>
}

async function KeywordProjectList({
  repos,
  searchParams,
}: {
  repos: ComponentProps<typeof ProjectList>['repos']
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { keyword } = await searchParams
  return <ProjectList repos={repos} initialKeyword={typeof keyword === 'string' ? keyword : ''} />
}
