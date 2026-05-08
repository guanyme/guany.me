import { cache } from 'react'
import type { GitHubRepo, GitHubUser } from '@/types/github'
import { fetchWithTimeout } from '@/lib/server-fetch'

const token = process.env.GITHUB_TOKEN

export const getUser = cache(async (): Promise<GitHubUser | null> => {
  if (!token) return null

  try {
    const res = await fetchWithTimeout('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
      timeoutMs: 5000,
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
})

async function getUsername(): Promise<string | null> {
  const user = await getUser()
  return user?.login || null
}

function mapRepo(repo: Record<string, unknown>): GitHubRepo {
  return {
    id: repo.id as number,
    name: repo.name as string,
    full_name: repo.full_name as string,
    html_url: repo.html_url as string,
    description: repo.description as string | null,
    homepage: repo.homepage as string | null,
    language: repo.language as string | null,
    stargazers_count: repo.stargazers_count as number,
    forks_count: repo.forks_count as number,
    updated_at: repo.updated_at as string,
    default_branch: (repo.default_branch as string) || 'main',
  }
}

export const getRepos = cache(async (): Promise<GitHubRepo[]> => {
  if (!token) return []

  const res = await fetchWithTimeout(
    'https://api.github.com/user/repos?sort=pushed&per_page=100&affiliation=owner',
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 1800 },
      timeoutMs: 8000,
    },
  )

  if (!res.ok) return []

  const data = await res.json()

  return data
    .filter((repo: Record<string, unknown>) => !repo.fork && !repo.private)
    .map(mapRepo)
})

export const getRepo = cache(
  async (name: string): Promise<GitHubRepo | null> => {
    if (!token) return null

    const username = await getUsername()
    if (!username) return null

    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${username}/${name}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 1800 },
        timeoutMs: 5000,
      },
    )

    if (!res.ok) return null

    const repo = await res.json()

    // Filter out forked and private repositories
    if (repo.fork || repo.private) return null

    return mapRepo(repo)
  },
)

// File types that can be viewed on GitHub blob pages
const VIEWABLE_EXTENSIONS = new Set([
  'md',
  'txt',
  'rst',
  'js',
  'ts',
  'jsx',
  'tsx',
  'py',
  'go',
  'rs',
  'java',
  'c',
  'cpp',
  'h',
  'hpp',
  'css',
  'html',
  'vue',
  'svelte',
  'json',
  'yaml',
  'yml',
  'toml',
  'xml',
  'sh',
  'bash',
  'zsh',
  'fish',
  'rb',
  'php',
  'swift',
  'kt',
  'scala',
  'clj',
  'ex',
  'exs',
  'erl',
  'hs',
  'ml',
  'r',
  'sql',
  'graphql',
])

// Check whether this is a relative path
function isRelativePath(url: string): boolean {
  return !/^(https?:\/\/|#|mailto:|tel:|data:)/i.test(url)
}

// Get the file extension
function getExtension(path: string): string {
  const match = path.match(/\.([^./?#]+)(?:[?#]|$)/)
  return match ? match[1].toLowerCase() : ''
}

// Generate a raw URL (for embedding resources)
function getRawUrl(fullName: string, branch: string, path: string): string {
  const cleanPath = path.replace(/^\.\//, '').replace(/^\//, '')
  return `https://raw.githubusercontent.com/${fullName}/${branch}/${cleanPath}`
}

// Generate a blob URL (for links to viewable files)
function getBlobUrl(fullName: string, branch: string, path: string): string {
  const cleanPath = path.replace(/^\.\//, '').replace(/^\//, '')
  return `https://github.com/${fullName}/blob/${branch}/${cleanPath}`
}

// Resolve a relative path to a full URL
function resolveUrl(
  url: string,
  fullName: string,
  branch: string,
  forEmbed: boolean,
): string {
  if (!isRelativePath(url)) return url

  if (forEmbed) {
    // Always use raw URLs for embedded resources
    return getRawUrl(fullName, branch, url)
  }

  // Links: use blob URLs for viewable files and raw URLs for everything else
  const ext = getExtension(url)
  if (VIEWABLE_EXTENSIONS.has(ext)) {
    return getBlobUrl(fullName, branch, url)
  }
  return getRawUrl(fullName, branch, url)
}

function processReadmeContent(
  content: string,
  fullName: string,
  branch: string,
): string {
  // Handle <picture> tags (dark/light mode images)
  const result = content
    .replace(
      /<a\s[^>]*>\s*<picture>([\s\S]*?)<\/picture>\s*<\/a>/gi,
      (_, inner) => {
        const darkMatch = inner.match(/srcset=["']([^"']+)["']/)
        const lightMatch = inner.match(/<img[\s\S]*?src=["']([^"']+)["']/)
        const altMatch = inner.match(/alt=["']([^"']*)["']/)
        if (!darkMatch || !lightMatch) return `<picture>${inner}</picture>`
        const dark = resolveUrl(darkMatch[1], fullName, branch, true)
        const light = resolveUrl(lightMatch[1], fullName, branch, true)
        const alt = altMatch?.[1] || ''
        return `<img class="block dark:hidden" alt="${alt}" src="${light}" />\n<img class="hidden dark:block" alt="${alt}" src="${dark}" />`
      },
    )
    .replace(/<picture>([\s\S]*?)<\/picture>/gi, (_, inner) => {
      const darkMatch = inner.match(/srcset=["']([^"']+)["']/)
      const lightMatch = inner.match(/<img[\s\S]*?src=["']([^"']+)["']/)
      const altMatch = inner.match(/alt=["']([^"']*)["']/)
      if (!darkMatch || !lightMatch) return `<picture>${inner}</picture>`
      const dark = resolveUrl(darkMatch[1], fullName, branch, true)
      const light = resolveUrl(lightMatch[1], fullName, branch, true)
      const alt = altMatch?.[1] || ''
      return `<img class="block dark:hidden" alt="${alt}" src="${light}" />\n<img class="hidden dark:block" alt="${alt}" src="${dark}" />`
    })

  // Handle uniformly: return code blocks as-is, replace relative paths in all other content
  return result.replace(
    /(```[\s\S]*?```|`[^`]+`)|(src=["'])([^"']+)(["'])|(href=["'])([^"']+)(["'])|(!\[[^\]]*\]\()([^)]+)(\))|(?<!!)(\[[^\]]*\]\()([^)]+)(\))/g,
    (
      match,
      code,
      srcPre,
      srcUrl,
      srcSuf,
      hrefPre,
      hrefUrl,
      hrefSuf,
      imgPre,
      imgUrl,
      imgSuf,
      linkPre,
      linkUrl,
      linkSuf,
    ) => {
      if (code) return code // Return code blocks as-is
      if (srcUrl && isRelativePath(srcUrl))
        return `${srcPre}${getRawUrl(fullName, branch, srcUrl)}${srcSuf}`
      if (hrefUrl && isRelativePath(hrefUrl))
        return `${hrefPre}${resolveUrl(hrefUrl, fullName, branch, false)}${hrefSuf}`
      if (imgUrl && isRelativePath(imgUrl))
        return `${imgPre}${getRawUrl(fullName, branch, imgUrl)}${imgSuf}`
      if (linkUrl && isRelativePath(linkUrl))
        return `${linkPre}${resolveUrl(linkUrl, fullName, branch, false)}${linkSuf}`
      return match
    },
  )
}

async function fetchReadmeByName(
  fullName: string,
  filename: string,
): Promise<string | null> {
  if (!token) return null
  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${fullName}/contents/${filename}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.raw+json',
      },
      next: { revalidate: 3600 },
      timeoutMs: 5000,
    },
  )
  if (!res.ok) return null
  return res.text()
}

// Extract the tagline that follows the H1 title in a README. Convention:
//
//   # ProjectName
//
//   🤖 Short description here
//
//   <picture>...</picture>
//
// Skip blank lines, headings, lists, tables, blockquotes, code fences,
// and HTML/Markdown image blocks; the first remaining line is the tagline.
function extractTagline(content: string): string | null {
  const lines = content.split(/\r?\n/)
  let pastTitle = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (!pastTitle) {
      if (/^#\s+/.test(trimmed)) pastTitle = true
      continue
    }
    if (!trimmed) continue
    if (/^[<#|*\->`+]/.test(trimmed)) continue
    if (/^!\[/.test(trimmed)) continue
    return trimmed
  }
  return null
}

export const getRepoTagline = cache(
  async (
    fullName: string,
    defaultBranch: string,
    locale: string,
  ): Promise<string | null> => {
    const readme = await getRepoReadme(fullName, defaultBranch, locale)
    if (!readme) return null
    return extractTagline(readme)
  },
)

const fetchDefaultReadme = cache(
  async (fullName: string): Promise<string | null> => {
    if (!token) return null
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${fullName}/readme`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.raw+json',
        },
        next: { revalidate: 3600 },
        timeoutMs: 5000,
      },
    )
    if (!res.ok) return null
    return res.text()
  },
)

export const getRepoReadme = cache(
  async (
    fullName: string,
    defaultBranch: string,
    locale?: string,
  ): Promise<string | null> => {
    if (!token) return null

    // For non-default locales, race the localized README and the default one
    // in parallel so we save a round-trip when the localized variant exists.
    // The fallback fetch is cheap (cached + GitHub bills nothing for reads).
    if (locale && locale !== 'en') {
      const [localized, fallback] = await Promise.all([
        fetchReadmeByName(fullName, `README.${locale}.md`),
        fetchDefaultReadme(fullName),
      ])
      const content = localized ?? fallback
      if (!content) return null
      return processReadmeContent(content, fullName, defaultBranch)
    }

    const content = await fetchDefaultReadme(fullName)
    if (!content) return null
    return processReadmeContent(content, fullName, defaultBranch)
  },
)
