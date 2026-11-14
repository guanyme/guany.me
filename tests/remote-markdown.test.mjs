import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchRemoteMarkdown } from '../src/server/remote-markdown.server.ts'

const publicSource = 'https://raw.githubusercontent.com/guanyme/guany.me/main/README.md'

test('rejects unsupported remote sources before starting a network request', async ({ mock }) => {
  const request = mock.method(globalThis, 'fetch', () => {
    throw new Error('unexpected network request')
  })

  for (const url of [
    'file:///etc/passwd',
    'http://127.1/readme.md',
    'http://[::1]/readme.md',
    'http://2130706433/readme.md',
    'http://169.254.169.254/readme.md',
    'https://raw.githubusercontent.com.evil.example/readme.md',
    'https://raw.githubusercontent.com@private.example/readme.md',
    'https://name:token@raw.githubusercontent.com/a/b/readme.md',
    'https://raw.githubusercontent.com:8080/a/b/readme.md',
    'https://gitlab.com/api/v4/user',
  ]) {
    assert.deepEqual(await fetchRemoteMarkdown(url), { kind: 'unsupported-url' })
  }

  assert.equal(request.mock.callCount(), 0)
})

test('rejects a redirect to a private address and cancels the response body', async ({ mock }) => {
  let canceled = false
  const request = mock.method(
    globalThis,
    'fetch',
    () =>
      new Response(
        new ReadableStream({
          cancel: () => {
            canceled = true
          },
        }),
        {
          status: 302,
          headers: { Location: 'http://localhost/readme.md' },
        },
      ),
  )

  assert.deepEqual(await fetchRemoteMarkdown(publicSource), { kind: 'unsupported-url' })
  assert.equal(request.mock.callCount(), 1)
  assert.equal(canceled, true)
})

test('follows an allowed redirect under one time budget and returns its final base URL', async ({
  mock,
}) => {
  const nextUrl = 'https://raw.githubusercontent.com/guanyme/guany.me/main/README.zh.md'
  const request = mock.method(globalThis, 'fetch', (url) =>
    url.href === publicSource
      ? new Response(null, { status: 307, headers: { Location: 'README.zh.md' } })
      : new Response('# 中文\n', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }),
  )

  assert.deepEqual(await fetchRemoteMarkdown(publicSource), {
    kind: 'ready',
    markdown: '# 中文\n',
    url: nextUrl,
  })
  const [first, second] = request.mock.calls
  assert.equal(first.arguments[1].redirect, 'manual')
  assert.equal(first.arguments[1].signal, second.arguments[1].signal)
})

test('cancels a chunked response above one MiB without relying on Content-Length', async ({
  mock,
}) => {
  let canceled = false
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1024 * 1024))
      controller.enqueue(new Uint8Array([65]))
    },
    cancel() {
      canceled = true
    },
  })
  mock.method(
    globalThis,
    'fetch',
    () => new Response(body, { headers: { 'Content-Type': 'text/plain' } }),
  )

  assert.deepEqual(await fetchRemoteMarkdown(publicSource), { kind: 'fetch-failed' })
  assert.equal(canceled, true)
})
