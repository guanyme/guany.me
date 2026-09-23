import matter from 'gray-matter'
import { getTranslations } from 'next-intl/server'
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
  const t = await getTranslations({ locale: 'en', namespace: 'docs' })
  // 分组和入口页的 titleKey 是 i18n key，其余条目的 titleKey 本身就是显示名
  const label = (key: string) => (t.has(key) ? t(key) : key)
  const today = new Date().toISOString().split('T')[0]
  const lines: string[] = [
    "# Guany's website",
    '',
    '> Website with projects, docs, and uses',
    '',
    `> Author: Guany`,
    `> Source: ${canonicalOrigin}`,
    `> License: MIT`,
    `> Updated: ${today}`,
    '',
    ...(includeFullContent ? ['> Full text of all content below', ''] : []),
    'Every doc is also available as Markdown by appending `.md` to its URL, e.g. ' +
      `${canonicalOrigin}/docs/zsh.md. Chinese versions live under /zh, e.g. ` +
      `${canonicalOrigin}/zh/docs/zsh.md.`,
    '',
  ]

  // Docs
  lines.push('## Docs', '')

  for (const group of docsConfig) {
    if (!includeFullContent) {
      lines.push(`### ${label(group.titleKey)}`, '')
    }

    for (const item of group.items) {
      const doc = getDocBySlug('en', 'docs', item.slug)
      if (!doc) continue

      if (includeFullContent) {
        const { content: rawContent } = matter(doc.content)
        // 站内相对链接（./zsh、./zsh#anchor）脱离页面就失效，改成绝对的 .md 地址
        const body = rawContent
          .trim()
          .replace(
            /\]\(\.\/([a-z0-9-]+)(?:#[^)]*)?\)/g,
            (_, slug) => `](${canonicalOrigin}/docs/${slug}.md)`,
          )
        lines.push(
          '---',
          '',
          `Source: ${canonicalOrigin}/docs/${item.slug}.md`,
          '',
          body,
          '',
        )
      } else {
        const description = doc.meta.description || ''
        lines.push(
          `- [${label(item.titleKey)}](${canonicalOrigin}/docs/${item.slug}.md)${description ? `: ${description}` : ''}`,
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
