import { createServerFn } from '@tanstack/react-start'
import { fetchRemoteMarkdown } from './remote-markdown.server'

export const getRemoteMarkdown = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    if (typeof data !== 'string') throw new TypeError('Expected a Markdown URL')
    return data
  })
  .handler(({ data }) => fetchRemoteMarkdown(data))
