const sourcePaths = new Map([
  ['raw.githubusercontent.com', /^\/.+\/[^/]+$/],
  ['gist.githubusercontent.com', /^\/[^/]+\/[^/]+\/raw(?:\/|$)/],
  ['gitlab.com', /^\/.+\/-\/raw\//],
  ['codeberg.org', /^\/[^/]+\/[^/]+\/raw\//],
  ['cdn.jsdelivr.net', /^\/(?:gh|npm|wp)\//],
])

export function publicMarkdownUrl(value: string, base?: URL): URL | undefined {
  if (value.length > 4096) return undefined
  const url = URL.parse(value, base)
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) return undefined
  if (url.port || url.username || url.password) return undefined
  if (!sourcePaths.get(url.hostname)?.test(url.pathname)) return undefined

  url.protocol = 'https:'
  return url
}
