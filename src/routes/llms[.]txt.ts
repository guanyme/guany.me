import { createFileRoute } from '@tanstack/react-router'
import { getLlmsResponse } from '#/server/llms.server'

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () => getLlmsResponse({ full: false }),
    },
  },
})
