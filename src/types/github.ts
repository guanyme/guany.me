import { z } from 'zod'

export const webUrl = z.url({ protocol: /^https?$/ })

export const githubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  avatar_url: webUrl,
  html_url: webUrl,
  name: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  public_repos: z.number(),
  followers: z.number(),
  following: z.number(),
})

export const githubRepoSchema = z.object({
  id: z.number(),
  name: z.string().regex(/^[\w.-]+$/),
  full_name: z.string().regex(/^[\w-]+\/[\w.-]+$/),
  html_url: webUrl,
  description: z.string().nullable(),
  homepage: z
    .string()
    .nullish()
    .transform((value) => {
      if (!value) return null
      const parsed = webUrl.safeParse(value)
      return parsed.success ? parsed.data : null
    }),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  updated_at: z.string(),
  default_branch: z
    .string()
    .nullish()
    .transform((value) => value || 'main'),
})

export type GitHubUser = z.infer<typeof githubUserSchema>
export type GitHubRepo = z.infer<typeof githubRepoSchema>
export type ProjectCardData = GitHubRepo & { tagline: string | null }
