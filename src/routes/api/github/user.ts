import { createFileRoute } from '@tanstack/react-router'
import { getUser } from '#/server/github.server'

export const Route = createFileRoute('/api/github/user')({
  server: {
    handlers: {
      GET: async () => {
        const user = await getUser()
        return user
          ? Response.json(user)
          : Response.json({ error: 'Failed to fetch GitHub user' }, { status: 502 })
      },
    },
  },
})
