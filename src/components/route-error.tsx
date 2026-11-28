import { useParams, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages.js'
import { baseLocale, isLocale } from '#/paraglide/runtime.js'

export function RouteError() {
  const { locale: param } = useParams({ strict: false })
  const locale = isLocale(param) ? param : baseLocale
  const router = useRouter()

  return (
    <div className="mx-auto max-w-7xl space-y-3 p-6" role="alert">
      <p>{m.route_error({}, { locale })}</p>
      <Button variant="link" onClick={() => void router.invalidate()}>
        {m.try_again({}, { locale })}
      </Button>
    </div>
  )
}
