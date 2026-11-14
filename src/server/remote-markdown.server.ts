import { publicMarkdownUrl } from '../lib/remote-markdown.ts'

const MAX_REDIRECTS = 3
const MAX_BYTES = 1024 * 1024
const TIMEOUT_MS = 8000
const redirectStatuses = new Set([301, 302, 303, 307, 308])
const markdownTypes = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/octet-stream',
])

export type RemoteMarkdownResult =
  | { kind: 'ready'; markdown: string; url: string }
  | { kind: 'unsupported-url' }
  | { kind: 'fetch-failed' }

export async function fetchRemoteMarkdown(value: string): Promise<RemoteMarkdownResult> {
  let url = publicMarkdownUrl(value)
  if (!url) return { kind: 'unsupported-url' }

  const signal = AbortSignal.timeout(TIMEOUT_MS)
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const response = await fetch(url, { redirect: 'manual', signal })
      if (redirectStatuses.has(response.status)) {
        await response.body?.cancel()
        const location = response.headers.get('location')
        if (location === null || hop === MAX_REDIRECTS) break
        const nextUrl = publicMarkdownUrl(location, url)
        if (!nextUrl) return { kind: 'unsupported-url' }
        url = nextUrl
        continue
      }

      const type = response.headers.get('content-type')?.split(';')[0]?.toLowerCase().trim()
      const size = Number(response.headers.get('content-length'))
      if (!response.ok || (type && !markdownTypes.has(type)) || size > MAX_BYTES) {
        await response.body?.cancel()
        break
      }

      const markdown = await readMarkdown(response.body)
      if (markdown) return { kind: 'ready', markdown, url: url.href }
      break
    }
  } catch {
    return { kind: 'fetch-failed' }
  }
  return { kind: 'fetch-failed' }
}

async function readMarkdown(body: Response['body']): Promise<string | undefined> {
  if (!body) return undefined
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let markdown = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return markdown + decoder.decode()

      size += value.byteLength
      if (size > MAX_BYTES) {
        await reader.cancel()
        return undefined
      }
      markdown += decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }
}
