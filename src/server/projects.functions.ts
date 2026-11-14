import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { locales } from '#/paraglide/runtime.js'
import { getProjectCards, getRepoByName, getRepoReadme, getRepos, getUser } from './github.server'
import { getHeroBackground } from './wallpaper.server'

const localeSchema = z.enum(locales)

export const getHomePage = createServerFn({ method: 'GET' })
  .validator(localeSchema)
  .handler(async ({ data: locale }) => {
    const [user, hero, projects] = await Promise.all([
      getUser(),
      getHeroBackground(locale),
      getRepos().then((repos) => getProjectCards(repos.slice(0, 6), locale)),
    ])
    return { user, hero, projects, copyrightYear: new Date().getUTCFullYear() }
  })

export const getProjectsPage = createServerFn({ method: 'GET' })
  .validator(localeSchema)
  .handler(async ({ data: locale }) => getProjectCards(await getRepos(), locale))

export const getProjectPage = createServerFn({ method: 'GET' })
  .validator(z.object({ locale: localeSchema, slug: z.string() }))
  .handler(async ({ data: { slug, locale } }) => {
    const repos = await getRepos()
    const repo = await getRepoByName(slug, repos)
    if (!repo) throw notFound()
    const readme = await getRepoReadme(repo.full_name, repo.default_branch, locale)
    const index = repos.findIndex(({ id }) => id === repo.id)
    return {
      repo,
      readme,
      previous: index > 0 ? repos[index - 1].name : null,
      next: index >= 0 && index < repos.length - 1 ? repos[index + 1].name : null,
    }
  })
