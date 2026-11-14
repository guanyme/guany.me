import { createFileRoute } from '@tanstack/react-router'
import { getRepos } from '#/server/github.server'

export const Route = createFileRoute('/api/github/repos')({
  server: {
    handlers: {
      GET: async () => {
        const repos = await getRepos()
        return repos.length
          ? Response.json(repos.slice(0, 6))
          : Response.json({ error: 'Failed to fetch GitHub repos' }, { status: 500 })
      },
    },
  },
})
