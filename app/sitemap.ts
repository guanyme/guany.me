import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'
import { getRepos } from '@/lib/github'
import { docsConfig } from '@/lib/docs-config'
import fs from 'fs'
import path from 'path'

function getTimestamps(): Record<string, string> {
  try {
    const filePath = path.join(process.cwd(), 'content', 'timestamps.json')
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return {}
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const timestamps = getTimestamps()
  const entries: MetadataRoute.Sitemap = []

  // Home page
  entries.push({
    url: `${siteUrl}/`,
    lastModified: new Date(),
    alternates: {
      languages: {
        en: `${siteUrl}/`,
        zh: `${siteUrl}/zh`,
      },
    },
  })

  // Docs page
  const slugs = docsConfig.flatMap((g) => g.items.map((i) => i.slug))
  for (const slug of slugs) {
    const tsKey = `en/docs/${slug}.md`
    const lastModified = timestamps[tsKey]
      ? new Date(timestamps[tsKey])
      : new Date()

    entries.push({
      url: `${siteUrl}/docs/${slug}`,
      lastModified,
      alternates: {
        languages: {
          en: `${siteUrl}/docs/${slug}`,
          zh: `${siteUrl}/zh/docs/${slug}`,
        },
      },
    })
  }

  // Projects page
  try {
    const repos = await getRepos()
    for (const repo of repos) {
      entries.push({
        url: `${siteUrl}/projects/${repo.name}`,
        lastModified: repo.updated_at ? new Date(repo.updated_at) : new Date(),
        alternates: {
          languages: {
            en: `${siteUrl}/projects/${repo.name}`,
            zh: `${siteUrl}/zh/projects/${repo.name}`,
          },
        },
      })
    }
  } catch {
    // ignore if GitHub API fails
  }

  // Uses page
  const usesTs = timestamps['en/pages/uses.md']
  entries.push({
    url: `${siteUrl}/uses`,
    lastModified: usesTs ? new Date(usesTs) : new Date(),
    alternates: {
      languages: {
        en: `${siteUrl}/uses`,
        zh: `${siteUrl}/zh/uses`,
      },
    },
  })

  // llms.txt
  entries.push({
    url: `${siteUrl}/llms.txt`,
    lastModified: new Date(),
  })
  entries.push({
    url: `${siteUrl}/llms-full.txt`,
    lastModified: new Date(),
  })

  return entries
}
