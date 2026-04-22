'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Star, GitFork, Search, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { GitHubRepo } from '@/types/github'

interface ProjectListProps {
  repos: GitHubRepo[]
  initialKeyword?: string
}

export function ProjectList({ repos, initialKeyword = '' }: ProjectListProps) {
  const [search, setSearch] = useState(initialKeyword)
  const t = useTranslations('projects')

  function handleSearchChange(value: string) {
    setSearch(value)
    const params = new URLSearchParams()
    if (value.trim()) {
      params.set('keyword', value)
    }
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}`,
    )
  }

  const filteredRepos = search.trim()
    ? repos.filter((repo) => {
        const query = search.toLowerCase()
        return (
          repo.name.toLowerCase().includes(query) ||
          repo.description?.toLowerCase().includes(query) ||
          repo.language?.toLowerCase().includes(query)
        )
      })
    : repos

  return (
    <>
      <div className="sticky top-20 z-40 mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-background pl-10 shadow-sm dark:bg-background"
          />
        </div>
      </div>

      {filteredRepos.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {search ? t('noMatch') : t('noProjects')}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRepos.map((repo) => (
            <article
              key={repo.id}
              className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
            >
              <Link
                href={`/projects/${repo.name}`}
                className="absolute inset-0 rounded-xl"
                aria-label={repo.name}
              />

              <div className="pointer-events-none relative z-0 flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="flex-1 truncate font-semibold transition-colors group-hover:text-primary">
                    {repo.name}
                  </h2>
                  <div className="flex shrink-0 items-center gap-3">
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-3.5" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <GitFork className="size-3.5" />
                        {repo.forks_count}
                      </span>
                    )}
                  </div>
                </div>

                <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {repo.description || t('noDescription')}
                </p>
              </div>

              <div className="pointer-events-none relative z-0 mt-auto flex items-center justify-between pt-2">
                {repo.language ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    {repo.language}
                  </span>
                ) : (
                  <div />
                )}
                {repo.homepage && (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto relative z-10 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title={t('visitWebsite')}
                    aria-label={t('visitWebsite')}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
