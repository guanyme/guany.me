import { createFileRoute } from '@tanstack/react-router'
import { CircleCheck } from 'lucide-react'
import { siteHead } from '#/lib/site'
import { m } from '#/paraglide/messages.js'

export const Route = createFileRoute('/{-$locale}/auth/verified')({
  head: ({ match }) => {
    const { locale } = match.context
    return siteHead({
      locale,
      pathname: '/auth/verified',
      title: m.auth_verified_title({}, { locale }),
    })
  },
  component: VerifiedPage,
})

function VerifiedPage() {
  const { locale } = Route.useRouteContext()
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <CircleCheck className="size-16 text-green-500" aria-hidden />
        <h1 className="text-2xl font-bold">{m.auth_verified_title({}, { locale })}</h1>
        <p className="text-muted-foreground">
          {m.auth_verified_description({}, { locale })}
          <br />
          {m.auth_verified_hint({}, { locale })}
        </p>
      </div>
    </div>
  )
}
