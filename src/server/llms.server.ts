import '@tanstack/react-start/server-only'

import { docsConfig, docItemTitle } from '#/lib/docs-config'
import { siteUrl } from '#/lib/site'
import { m } from '#/paraglide/messages.js'
import { baseLocale } from '#/paraglide/runtime.js'
import { getContent } from './docs.server'
import { getRepoReadme, getRepos } from './github.server'

const english = { locale: baseLocale }
const README_CONCURRENCY = 4

export async function getLlmsResponse({ full }: { full: boolean }) {
  const today = new Date().toISOString().slice(0, 10)
  const lines = [
    `# ${m.metadata_site_title({}, english)}`,
    '',
    '> Website with projects, docs, and uses',
    '',
    '> Author: Guany',
    `> Source: ${siteUrl}`,
    '> License: MIT',
    `> Updated: ${today}`,
    '',
    ...(full ? ['> Full text of all content below', ''] : []),
    'Every doc is also available as Markdown by appending `.md` to its URL, e.g. ' +
      `${siteUrl}/docs/zsh.md. Chinese versions live under /zh, e.g. ` +
      `${siteUrl}/zh/docs/zsh.md.`,
    '',
    `## ${m.nav_docs({}, english)}`,
    '',
  ]

  for (const group of docsConfig) {
    if (!full) {
      const title = group.titleKey === 'guide' ? m.docs_guide : m.docs_environment
      lines.push(`### ${title({}, english)}`, '')
    }
    for (const item of group.items) {
      const doc = getContent(baseLocale, 'docs', item.slug)
      if (!doc) continue

      const source = `${siteUrl}/docs/${item.slug}.md`
      if (full) {
        const body = doc.markdown
          .trim()
          .replace(/\]\(\.\/([a-z0-9-]+)(?:#([^)]*))?\)/g, (_, slug, anchor) => {
            return `](${siteUrl}/docs/${slug}.md${anchor ? `#${anchor}` : ''})`
          })
        lines.push('---', '', `Source: ${source}`, '', body, '')
      } else {
        lines.push(entry(docItemTitle(item, baseLocale), source, doc.description))
      }
    }
    lines.push('')
  }

  const repos = await getRepos()
  if (repos.length) {
    lines.push(`## ${m.projects_title({}, english)}`, '')

    if (full) {
      for (let offset = 0; offset < repos.length; offset += README_CONCURRENCY) {
        const batch = repos.slice(offset, offset + README_CONCURRENCY)
        const sections = await Promise.all(
          batch.map(async (repo) => {
            const readme = await getRepoReadme(repo.full_name, repo.default_branch, baseLocale)
            return [
              '---',
              '',
              `## ${repo.name}`,
              '',
              ...(repo.description ? [repo.description, ''] : []),
              `- Repo: ${repo.html_url}`,
              ...(repo.homepage ? [`- Homepage: ${repo.homepage}`] : []),
              ...(repo.language ? [`- Language: ${repo.language}`] : []),
              `- Stars: ${repo.stargazers_count}`,
              '',
              ...(readme ? ['### README', '', readme.trim(), ''] : []),
            ]
          }),
        )
        lines.push(...sections.flat())
      }
    } else {
      for (const repo of repos) {
        lines.push(
          entry(
            repo.name,
            `${siteUrl}/projects/${encodeURIComponent(repo.name)}`,
            repo.description,
          ),
        )
      }
    }
    lines.push('')
  }

  const uses = getContent(baseLocale, 'pages', 'uses')
  if (uses) {
    lines.push(`## ${m.uses_title({}, english)}`, '')
    if (full) lines.push('---', '', uses.markdown.trim(), '')
    else {
      lines.push(
        entry('What I use', `${siteUrl}/uses`, uses.description || m.uses_description({}, english)),
      )
    }
  }

  if (!full) {
    lines.push(
      '',
      '## Optional',
      '',
      entry(
        'Full text',
        `${siteUrl}/llms-full.txt`,
        'All docs, projects and uses in a single file',
      ),
    )
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

function entry(label: string, url: string, description?: string | null) {
  return `- [${label}](${url})${description ? `: ${description}` : ''}`
}
