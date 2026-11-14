import { createFileRoute } from '@tanstack/react-router'
import { m } from '#/paraglide/messages.js'

export const Route = createFileRoute('/{-$locale}/')({ component: Home })

function Home() {
  const { locale } = Route.useRouteContext()
  return (
    <>
      <h1 className="text-4xl font-bold">Guany</h1>
      <p className="mt-4">{m.home_description({}, { locale })}</p>
    </>
  )
}
