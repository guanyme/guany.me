import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/')({ component: Home })

function Home() {
  const { locale } = Route.useRouteContext()
  return (
    <>
      <h1 className="text-4xl font-bold">Guany</h1>
      <p className="mt-4">{locale === 'zh' ? 'Guany 的网站' : 'Guany’s website'}</p>
    </>
  )
}
