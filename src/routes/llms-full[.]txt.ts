import { createFileRoute } from '@tanstack/react-router'
import { getLlmsResponse } from '#/server/llms.server'

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: () => getLlmsResponse({ full: true }),
    },
  },
})
