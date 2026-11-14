import '@tanstack/react-start/server-only'

import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { githubRepoSchema, githubUserSchema } from '#/types/github'
import type { GitHubRepo, GitHubUser, ProjectCardData } from '#/types/github'
import { cachedPublicData } from './public-cache.server'
import { processReadmeContent, extractTagline } from './github-markdown'

const repoTtl = 30 * 60_000
const userTtl = 60 * 60_000
const readmeTtl = 60 * 60_000
const reposSchema = githubRepoSchema.array()
const upstreamRepoSchema = githubRepoSchema.extend({ fork: z.boolean(), private: z.boolean() })
const nullableRepository = githubRepoSchema.nullable()
const slugPattern = /^[\w.-]+$/
const fullNamePattern = /^[\w-]+\/[\w.-]+$/
const readmeSchema = z.string().nullable()

function githubOwner() {
  return env.GITHUB_OWNER || 'guanyme'
}

function githubFetch(
  path: string,
  { accept = 'application/vnd.github+json', timeout = 5_000, authenticated = true } = {},
) {
  const token = authenticated && env.GITHUB_TOKEN
  return fetch(`https://api.github.com${path}`, {
    redirect: 'manual',
    headers: {
      'User-Agent': 'guany.me',
      Accept: accept,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(timeout),
  })
}

export function getUser(): Promise<GitHubUser | null> {
  const owner = githubOwner()
  return cachedPublicData({
    name: `github:user:${owner}`,
    ttl: userTtl,
    schema: githubUserSchema.nullable(),
    fallback: null,
    async load() {
      const response = await githubFetch(`/users/${encodeURIComponent(owner)}`)
      if (!response.ok) throw new Error(`GitHub profile returned ${response.status}`)
      return githubUserSchema.parse(await response.json())
    },
  })
}

export function getRepos(): Promise<GitHubRepo[]> {
  const owner = githubOwner()
  return cachedPublicData({
    name: `github:repos:${owner}`,
    ttl: repoTtl,
    schema: reposSchema,
    fallback: [],
    async load() {
      const repos: GitHubRepo[] = []
      let page = 1
      let hasNextPage: boolean
      do {
        const response = await githubFetch(
          `/users/${encodeURIComponent(owner)}/repos?sort=pushed&per_page=100&type=owner&page=${page}`,
          { timeout: 8_000 },
        )
        if (!response.ok) throw new Error(`GitHub repository list returned ${response.status}`)

        const upstream = upstreamRepoSchema.array().parse(await response.json())
        repos.push(
          ...upstream
            .filter(({ fork, private: isPrivate }) => !fork && !isPrivate)
            .map((repo) => githubRepoSchema.parse(repo)),
        )
        hasNextPage = response.headers.get('link')?.includes('rel="next"') ?? false
        page++
      } while (hasNextPage)

      return repos
    },
  })
}

export async function getRepoByName(
  name: string,
  repos?: GitHubRepo[],
): Promise<GitHubRepo | null> {
  if (!slugPattern.test(name) || name === '.' || name === '..') return null
  const repo = (repos ?? (await getRepos())).find((entry) => entry.name === name)
  if (repo) return repo

  const owner = githubOwner()
  return cachedPublicData({
    name: `github:repo:${owner}/${name}`,
    ttl: repoTtl,
    schema: nullableRepository,
    fallback: null,
    async load() {
      const response = await githubFetch(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      )
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`GitHub repository returned ${response.status}`)
      const repo = upstreamRepoSchema.parse(await response.json())
      return repo.fork || repo.private ? null : githubRepoSchema.parse(repo)
    },
  })
}

export async function getRepoReadme(
  fullName: string,
  defaultBranch: string,
  locale?: string,
): Promise<string | null> {
  if (!fullNamePattern.test(fullName)) return null
  const [owner, repo] = fullName.split('/')
  if (repo === '.' || repo === '..') return null
  const path = `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  const filename = locale === 'zh' ? 'README.zh.md' : 'README.md'
  return cachedPublicData({
    name: `github:readme:${path}:${defaultBranch}:${filename}`,
    ttl: readmeTtl,
    schema: readmeSchema,
    fallback: null,
    async load() {
      const response = await fetch(`https://raw.githubusercontent.com/${path}/HEAD/${filename}`, {
        signal: AbortSignal.timeout(5_000),
      })
      if (response.ok) {
        return processReadmeContent(await response.text(), fullName, defaultBranch)
      }
      if (response.status !== 404) throw new Error(`GitHub README returned ${response.status}`)
      if (locale === 'zh') return getRepoReadme(fullName, defaultBranch)
      const fallback = await githubFetch(`/repos/${path}/readme`, {
        accept: 'application/vnd.github.raw+json',
        authenticated: false,
      })
      if (fallback.status === 404) return null
      if (!fallback.ok) throw new Error(`GitHub README returned ${fallback.status}`)
      return processReadmeContent(await fallback.text(), fullName, defaultBranch)
    },
  })
}

export async function getProjectCards(
  repos: GitHubRepo[],
  locale: string,
): Promise<ProjectCardData[]> {
  const result: ProjectCardData[] = []
  const parallelism = 4
  for (let start = 0; start < repos.length; start += parallelism) {
    const cards = await Promise.all(
      repos.slice(start, start + parallelism).map(async (repo) => {
        const readme = await getRepoReadme(repo.full_name, repo.default_branch, locale)
        return { ...repo, tagline: readme ? extractTagline(readme) : null }
      }),
    )
    result.push(...cards)
  }
  return result
}
