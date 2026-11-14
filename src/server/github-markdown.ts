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

function isRelativePath(url: string): boolean {
  return !/^(https?:\/\/|#|mailto:|tel:|data:)/i.test(url)
}

function getExtension(path: string): string {
  const match = path.match(/\.([^./?#]+)(?:[?#]|$)/)
  return match ? match[1].toLowerCase() : ''
}

function getRawUrl(fullName: string, branch: string, path: string): string {
  const cleanPath = path.replace(/^\.\//, '').replace(/^\//, '')
  return `https://raw.githubusercontent.com/${fullName}/${branch}/${cleanPath}`
}

function getBlobUrl(fullName: string, branch: string, path: string): string {
  const cleanPath = path.replace(/^\.\//, '').replace(/^\//, '')
  return `https://github.com/${fullName}/blob/${branch}/${cleanPath}`
}

function resolveUrl(url: string, fullName: string, branch: string, forEmbed: boolean): string {
  if (!isRelativePath(url)) return url

  if (forEmbed) {
    return getRawUrl(fullName, branch, url)
  }

  const ext = getExtension(url)
  if (VIEWABLE_EXTENSIONS.has(ext)) {
    return getBlobUrl(fullName, branch, url)
  }
  return getRawUrl(fullName, branch, url)
}

export function processReadmeContent(content: string, fullName: string, branch: string): string {
  const result = content
    .replace(/<a\s[^>]*>\s*<picture>([\s\S]*?)<\/picture>\s*<\/a>/gi, (_, inner) => {
      const darkMatch = inner.match(/srcset=["']([^"']+)["']/)
      const lightMatch = inner.match(/<img[\s\S]*?src=["']([^"']+)["']/)
      const altMatch = inner.match(/alt=["']([^"']*)["']/)
      if (!darkMatch || !lightMatch) return `<picture>${inner}</picture>`
      const dark = resolveUrl(darkMatch[1], fullName, branch, true)
      const light = resolveUrl(lightMatch[1], fullName, branch, true)
      const alt = altMatch?.[1] || ''
      return `<img class="block dark:hidden" alt="${alt}" src="${light}" />\n<img class="hidden dark:block" alt="${alt}" src="${dark}" />`
    })
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
      if (code) return code
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

export function extractTagline(content: string): string | null {
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
    if (trimmed.startsWith('![')) continue
    return trimmed
  }
  return null
}
