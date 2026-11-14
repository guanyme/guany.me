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
    body: /<h1[^>]*>Guany<\/h1>/,
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
    body: /<h1[^>]*>Guany<\/h1>/,
  },
  {
    name: 'explicit Chinese URL overrides an English cookie',
    path: '/zh/projects',
    status: 200,
    cookie: 'NEXT_LOCALE=en',
    htmlLang: 'zh',
    setCookie: 'NEXT_LOCALE=zh',
    body: /<h1[^>]*>项目<\/h1>/,
  },
  {
    name: 'localized trailing slash redirect records the language preference',
    path: '/zh/projects/',
    status: 307,
    fetchDestination: 'document',
    location: '/zh/projects',
    setCookie: 'NEXT_LOCALE=zh',
  },
  { name: 'unrecognized English alias path', path: '/en/no-such-route', status: 404 },
  { name: 'locale prefixes are case-sensitive', path: '/ZH/projects', status: 404 },
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
    name: 'document request combines the Chinese docs index and trailing slash redirect',
    path: '/docs/?keyword=herdr&topic=ssh',
    language: 'zh-CN',
    fetchDestination: 'document',
    status: 307,
    location: '/zh/docs/getting-started?keyword=herdr&topic=ssh',
    vary: true,
  },
  {
    name: 'Chinese cookie selects the docs destination without a browser fetch destination',
    path: '/docs/',
    cookie: 'NEXT_LOCALE=zh',
    status: 307,
    location: '/zh/docs/getting-started',
  },
  {
    name: 'explicit Chinese docs index overrides the English cookie in one redirect',
    path: '/zh/docs/?keyword=herdr',
    cookie: 'NEXT_LOCALE=en',
    fetchDestination: 'document',
    status: 307,
    location: '/zh/docs/getting-started?keyword=herdr',
    setCookie: 'NEXT_LOCALE=zh',
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
  {
    name: 'English raw Markdown with a trailing slash bypasses language negotiation',
    path: '/docs/herdr.md/',
    language: 'zh-CN',
    fetchDestination: 'document',
    status: 200,
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
    name: 'English uses page',
    path: '/uses',
    status: 200,
    htmlLang: 'en',
    body: /<h1[^>]*>Things I Use<\/h1>/,
  },
  {
    name: 'Chinese uses page',
    path: '/zh/uses',
    status: 200,
    htmlLang: 'zh',
    body: /<h1[^>]*>我在使用的东西<\/h1>/,
  },
  {
    name: 'uses locale redirect',
    path: '/uses',
    language: 'zh-CN',
    status: 307,
    location: '/zh/uses',
  },
  {
    name: 'uses page combines the locale and trailing slash redirect',
    path: '/uses/?source=docs',
    language: 'zh-CN',
    fetchDestination: 'document',
    status: 307,
    location: '/zh/uses?source=docs',
  },
  {
    name: 'remote markdown page combines the locale and trailing slash redirect',
    path: '/md/?url=https%3A%2F%2Fexample.com',
    language: 'zh-CN',
    status: 307,
    location: '/zh/md?url=https%3A%2F%2Fexample.com',
  },
  {
    name: 'verification page combines the locale and trailing slash redirect',
    path: '/auth/verified/',
    language: 'zh-CN',
    status: 307,
    location: '/zh/auth/verified',
  },
  {
    name: 'Chinese verification page',
    path: '/zh/auth/verified',
    status: 200,
    htmlLang: 'zh',
    body: /<h1[^>]*>邮箱已验证<\/h1>/,
  },
  {
    name: 'Chinese remote markdown page',
    path: '/zh/md',
    status: 200,
    htmlLang: 'zh',
    body: /请提供 markdown 链接/,
  },
  {
    name: 'English llms index',
    path: '/llms.txt',
    status: 200,
    body: /https:\/\/guany\.me\/docs\/herdr/,
  },
  { name: 'full llms export', path: '/llms-full.txt', status: 200, body: /Herdr App/ },
  {
    name: 'robots',
    path: '/robots.txt',
    status: 200,
    body: /Sitemap: https:\/\/guany\.me\/sitemap\.xml/,
  },
  { name: 'sitemap', path: '/sitemap.xml', status: 200, body: /https:\/\/guany\.me\/zh\/uses/ },
  { name: 'web manifest', path: '/manifest.webmanifest', status: 200, body: /"start_url":\s*"\/"/ },
  {
    name: 'static avatar skips locale negotiation',
    path: '/avatar.png',
    status: 200,
    language: 'zh-CN',
    media: 'image/png',
  },
  {
    name: 'localized language menu trigger renders on the projects page',
    path: '/zh/projects?keyword=guany',
    status: 200,
    htmlLang: 'zh',
    body: /<button(?=[^>]*aria-label="语言")(?=[^>]*aria-haspopup="menu")/,
  },
]

for (const scenario of cases) {
  test(scenario.name, async () => {
    const response = await fetch(new URL(scenario.path, origin), {
      redirect: 'manual',
      headers: {
        'Accept-Language': scenario.language ?? 'en',
        ...(scenario.cookie ? { Cookie: scenario.cookie } : {}),
        ...(scenario.fetchDestination ? { 'Sec-Fetch-Dest': scenario.fetchDestination } : {}),
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
      if (scenario.htmlLang) assert.match(body, new RegExp(`<html lang="${scenario.htmlLang}"[ >]`))
      if (scenario.body) assert.match(body, scenario.body)
    }
  })
}

test('the English alias stays English after its redirect', async () => {
  const headers = {
    'Accept-Language': 'zh-CN',
    'Sec-Fetch-Dest': 'document',
    Cookie: 'NEXT_LOCALE=zh',
  }
  const alias = await fetch(new URL('/en/projects?keyword=guany', origin), {
    redirect: 'manual',
    headers,
  })
  assert.equal(alias.status, 307)
  const location = alias.headers.get('location')
  assert.equal(location, '/projects?keyword=guany')
  const preference = alias.headers.get('set-cookie')?.split(';')[0]
  assert.equal(preference, 'NEXT_LOCALE=en')

  const canonical = await fetch(new URL(location, origin), {
    redirect: 'manual',
    headers: { ...headers, Cookie: preference },
  })
  assert.equal(canonical.status, 200)
  const body = await canonical.text()
  assert.match(body, /<html lang="en"[ >]/)
  assert.match(body, /<h1[^>]*>Projects<\/h1>/)
})

test('the English docs index alias reaches the English document in one redirect', async () => {
  const headers = {
    'Accept-Language': 'zh-CN',
    'Sec-Fetch-Dest': 'document',
    Cookie: 'NEXT_LOCALE=zh',
  }
  const response = await fetch(new URL('/en/docs/?keyword=herdr', origin), {
    redirect: 'manual',
    headers,
  })
  assert.equal(response.status, 307)
  const location = response.headers.get('location')
  assert.equal(location, '/docs/getting-started?keyword=herdr')
  const preference = response.headers.get('set-cookie')?.split(';')[0]
  assert.equal(preference, 'NEXT_LOCALE=en')
  assert.match(response.headers.get('cache-control') ?? '', /private, no-store/)

  const document = await fetch(new URL(location, origin), {
    redirect: 'manual',
    headers: { ...headers, Cookie: preference },
  })
  assert.equal(document.status, 200)
  assert.match(await document.text(), /<html lang="en"[ >]/)
})
