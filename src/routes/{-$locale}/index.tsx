import { Await, createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { HeroSection } from '#/components/home/hero-section'
import { ProjectCard } from '#/components/home/project-card'
import { SiteFooter } from '#/components/layout/site-footer'
import { webSiteJsonLd } from '#/lib/json-ld'
import { siteHead } from '#/lib/site'
import { m } from '#/paraglide/messages.js'
import { baseLocale } from '#/paraglide/runtime.js'
import { getHomeHero, getHomeProjects } from '#/server/projects.functions'

export const Route = createFileRoute('/{-$locale}/')({
  loader: ({ context: { locale } }) => ({
    hero: getHomeHero({ data: locale }),
    projects: getHomeProjects({ data: locale }),
  }),
  head: ({ params }) => {
    const locale = params.locale ?? baseLocale
    const name = m.metadata_site_title({}, { locale })
    const description = m.metadata_site_description({}, { locale })
    return {
      ...siteHead({ locale, pathname: '/', description }),
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(webSiteJsonLd({ name, description, locale })).replace(
            /</g,
            '\\u003c',
          ),
        },
      ],
    }
  },
  component: Home,
})

function Home() {
  const { locale } = Route.useRouteContext()
  const { hero, projects } = Route.useLoaderData()

  return (
    <>
      <Await promise={hero} fallback={<HeroSkeleton />}>
        {({ user, hero: background }) => (
          <HeroSection
            locale={locale}
            user={user}
            backgroundUrl={background?.url}
            backgroundPosition={background?.position}
          />
        )}
      </Await>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="animate-fade-in-up mb-10 text-center text-2xl font-semibold">
            {m.home_my_projects({}, { locale })}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Await promise={projects} fallback={<ProjectsSkeleton />}>
              {(repos) =>
                repos.map((repo, index) => (
                  <ProjectCard key={repo.id} repo={repo} locale={locale} featuredIndex={index} />
                ))
              }
            </Await>
          </div>
        </div>
      </section>
      <Suspense fallback={null}>
        <Await promise={hero}>
          {({ copyrightYear }) => (
            <SiteFooter locale={locale} copyrightYear={copyrightYear} avatar="/avatar.png" />
          )}
        </Await>
      </Suspense>
    </>
  )
}

function HeroSkeleton() {
  return (
    <section className="flex min-h-125 items-center justify-center px-5 py-20">
      <div className="flex flex-col items-center">
        <div className="mb-6 size-32 animate-pulse rounded-full bg-muted" />
        <div className="mb-3 h-10 w-40 animate-pulse rounded bg-muted md:h-12" />
        <div className="h-5 w-72 animate-pulse rounded bg-muted" />
      </div>
    </section>
  )
}

function ProjectsSkeleton() {
  return Array.from({ length: 6 }, (_, index) => (
    <div key={index} className="h-48 animate-pulse rounded-lg bg-muted" />
  ))
}
