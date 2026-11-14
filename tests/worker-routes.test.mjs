import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const origin = process.env.WORKER_PREVIEW_URL ?? 'http://127.0.0.1:4179'

const cases = [
  {
    name: 'unprefixed English homepage',
    path: '/',
    status: 200,
    language: 'en',
    htmlLang: 'en',
    vary: true,
  },
  {
    name: 'Chinese browser redirect',
    path: '/',
    status: 307,
    language: 'zh-CN,en;q=0.8',
    location: '/zh',
  },
  {
    name: 'language preference priority',
    path: '/',
    status: 200,
    language: 'zh-CN',
    cookie: 'NEXT_LOCALE=en',
    htmlLang: 'en',
  },
  {
    name: 'language preference redirect',
    path: '/',
    status: 307,
    cookie: 'NEXT_LOCALE=zh',
    location: '/zh',
  },
  {
    name: 'explicit locale response and cookie',
    path: '/zh',
    status: 200,
    htmlLang: 'zh',
    setCookie: 'NEXT_LOCALE=zh',
  },
  {
    name: 'canonical English query preservation',
    path: '/en/projects?keyword=guany',
    status: 307,
    location: '/projects?keyword=guany',
  },
  {
    name: 'Chinese docs index redirect',
    path: '/zh/docs',
    status: 307,
    location: '/zh/docs/getting-started',
  },
  {
    name: 'English docs index redirect',
    path: '/docs',
    status: 307,
    location: '/docs/getting-started',
  },
  {
    name: 'bundled document SSR',
    path: '/zh/docs/herdr',
    status: 200,
    htmlLang: 'zh',
    body: /<h1[^>]*>Herdr<\/h1>/,
  },
  {
    name: 'English raw Markdown bypasses language negotiation',
    path: '/docs/herdr.md',
    status: 200,
    language: 'zh-CN',
    markdown: 'en',
  },
  {
    name: 'explicit English raw Markdown remains available',
    path: '/en/docs/herdr.md',
    status: 200,
    language: 'zh-CN',
    markdown: 'en',
  },
  { name: 'Chinese raw Markdown', path: '/zh/docs/herdr.md', status: 200, markdown: 'zh' },
  {
    name: 'unknown localized document',
    path: '/zh/docs/unknown-document',
    status: 404,
    htmlLang: 'zh',
  },
  { name: 'unknown raw Markdown', path: '/zh/docs/unknown-document.md', status: 404 },
  { name: 'unknown raw Markdown locale', path: '/fr/docs/herdr.md', status: 404 },
  { name: 'unknown HTML locale', path: '/fr/docs/herdr', status: 404 },
  {
    name: 'dotted project slug',
    path: '/zh/projects/guany.me',
    status: 200,
    htmlLang: 'zh',
    body: /<h1[^>]*>guany\.me<\/h1>/,
  },
  {
    name: 'encoded project slug',
    path: '/projects/guany%2Eme',
    status: 200,
    htmlLang: 'en',
    body: /<h1[^>]*>guany\.me<\/h1>/,
  },
  { name: 'unknown project', path: '/projects/unknown-project', status: 404, htmlLang: 'en' },
  {
    name: 'static avatar skips locale negotiation',
    path: '/avatar.png',
    status: 200,
    language: 'zh-CN',
    media: 'image/png',
  },
  {
    name: 'typed locale link preserves project search',
    path: '/zh/projects?keyword=guany',
    status: 200,
    htmlLang: 'zh',
    body: /href="\/projects\?keyword=guany"[^>]*>English<\/a>/,
  },
]

for (const scenario of cases) {
  test(scenario.name, async () => {
    const response = await fetch(new URL(scenario.path, origin), {
      redirect: 'manual',
      headers: {
        'Accept-Language': scenario.language ?? 'en',
        ...(scenario.cookie ? { Cookie: scenario.cookie } : {}),
      },
    })

    assert.equal(response.status, scenario.status)
    assert.equal(response.headers.get('location'), scenario.location ?? null)
    if (scenario.htmlLang) assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/)
    if (scenario.media) assert.equal(response.headers.get('content-type'), scenario.media)
    if (scenario.vary) assert.match(response.headers.get('vary') ?? '', /Accept-Language, Cookie/i)
    if (scenario.setCookie) {
      assert.ok(response.headers.get('set-cookie')?.startsWith(scenario.setCookie))
      assert.match(response.headers.get('cache-control') ?? '', /private, no-store/)
    }
    if (scenario.markdown) {
      const source = await readFile(
        new URL(`../content/${scenario.markdown}/docs/herdr.md`, import.meta.url),
        'utf8',
      )
      const frontmatterEnd = source.indexOf('\n---', 3)
      assert.match(response.headers.get('content-type') ?? '', /^text\/markdown\b/)
      assert.equal(await response.text(), source.slice(frontmatterEnd + 4).trimStart())
    } else if (scenario.htmlLang || scenario.body) {
      const body = await response.text()
      if (scenario.htmlLang) assert.ok(body.includes(`<html lang="${scenario.htmlLang}">`))
      if (scenario.body) assert.match(body, scenario.body)
    }
  })
}
