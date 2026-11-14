import { Link } from '@tanstack/react-router'
import { ExternalLink, GitFork, Star } from 'lucide-react'
import { m } from '#/paraglide/messages.js'
import { baseLocale, type Locale } from '#/paraglide/runtime.js'
import type { ProjectCardData } from '#/types/github'

export function ProjectCard({
  repo,
  locale,
  featuredIndex,
}: {
  repo: ProjectCardData
  locale: Locale
  featuredIndex?: number
}) {
  const Heading = featuredIndex === undefined ? 'h2' : 'h3'
  const animation = featuredIndex === undefined ? '' : 'animate-fade-in-up'
  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg ${animation}`}
      style={
        featuredIndex === undefined
          ? undefined
          : { animationDelay: `${100 + featuredIndex * 50}ms` }
      }
    >
      <Link
        to="/{-$locale}/projects/$slug"
        params={{ locale: locale === baseLocale ? undefined : locale, slug: repo.name }}
        className="absolute inset-0 rounded-xl"
        aria-label={repo.name}
      />

      <div className="pointer-events-none relative z-0 flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Heading className="flex-1 truncate font-semibold transition-colors group-hover:text-primary">
            {repo.name}
          </Heading>
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
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {repo.tagline ?? repo.description ?? m.projects_no_description({}, { locale })}
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
            title={m.projects_visit_website({}, { locale })}
            aria-label={m.projects_visit_website({}, { locale })}
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </article>
  )
}
