import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/projects/$slug')({
  loader: ({ params }) => {
    if (params.slug !== 'guany.me') throw notFound()
    return { name: params.slug }
  },
  component: Project,
})

function Project() {
  const { name } = Route.useLoaderData()
  return <h1 className="text-3xl font-bold">{name}</h1>
}
