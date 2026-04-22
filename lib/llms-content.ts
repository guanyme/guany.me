import matter from 'gray-matter'
import { getDocBySlug } from '@/lib/mdx'
import { docsConfig } from '@/lib/docs-config'
import { getRepos, getRepoReadme } from '@/lib/github'
import { siteUrl } from '@/lib/site'

interface LlmsOptions {
  includeFullContent: boolean
  origin?: string
}

export async function buildLlmsContent({
  includeFullContent,
  origin,
}: LlmsOptions): Promise<string> {
  const canonicalOrigin = origin ?? siteUrl
  const today = new Date().toISOString().split('T')[0]
  const lines: string[] = [
    "# Guany's Home",
    '',
    '> Personal home with projects, docs, and uses',
    '',
    `> Author: Guany`,
    `> Source: ${canonicalOrigin}`,
    `> License: MIT`,
    `> Updated: ${today}`,
    '',
    ...(includeFullContent ? ['> Full text of all content below', ''] : []),
  ]

  // Docs
  lines.push('## Docs', '')

  for (const group of docsConfig) {
    if (!includeFullContent) {
      lines.push(`### ${group.titleKey}`, '')
    }

    for (const item of group.items) {
      const doc = getDocBySlug('en', 'docs', item.slug)
      if (!doc) continue

      if (includeFullContent) {
        const { content: rawContent } = matter(doc.content)
        lines.push('---', '', rawContent.trim(), '')
      } else {
        const description = doc.meta.description || ''
        lines.push(
          `- [${item.titleKey}](${canonicalOrigin}/docs/${item.slug})${description ? `: ${description}` : ''}`,
        )
      }
    }
    lines.push('')
  }

  // Projects
  const repos = await getRepos()
  if (repos.length > 0) {
    lines.push('## Projects', '')

    for (const repo of repos) {
      if (includeFullContent) {
        lines.push('---', '', `## ${repo.name}`, '')
        if (repo.description) lines.push(`${repo.description}`, '')
        lines.push(`- Repo: ${repo.html_url}`)
        if (repo.homepage) lines.push(`- Homepage: ${repo.homepage}`)
        if (repo.language) lines.push(`- Language: ${repo.language}`)
        lines.push(`- Stars: ${repo.stargazers_count}`, '')

        const readme = await getRepoReadme(
          repo.full_name,
          repo.default_branch,
          'en',
        )
        if (readme) {
          lines.push('### README', '', readme.trim(), '')
        }
      } else {
        const description = repo.description || ''
        lines.push(
          `- [${repo.name}](${canonicalOrigin}/projects/${repo.name})${description ? `: ${description}` : ''}`,
        )
      }
    }
    lines.push('')
  }

  // Uses
  const usesDoc = getDocBySlug('en', 'pages', 'uses')
  if (usesDoc) {
    if (includeFullContent) {
      const { content: rawContent } = matter(usesDoc.content)
      lines.push('## Uses', '', '---', '', rawContent.trim(), '')
    } else {
      lines.push(
        '## Uses',
        '',
        `- [What I use](${canonicalOrigin}/uses): ${usesDoc.meta.description || 'Hardware and tools I use daily'}`,
      )
    }
  }

  return lines.join('\n')
}
