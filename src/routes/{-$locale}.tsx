import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { m } from '#/paraglide/messages.js'
import { baseLocale, isLocale, setLocale } from '#/paraglide/runtime.js'

export const Route = createFileRoute('/{-$locale}')({
  params: {
    parse: ({ locale }) => {
      if (locale !== undefined && !isLocale(locale)) return false
      return { locale }
    },
  },
  beforeLoad: ({ params }) => ({ locale: params.locale ?? baseLocale }),
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useRouteContext()
  const otherLocale = locale === 'zh' ? 'en' : 'zh'
  const localeParams = { locale: locale === baseLocale ? undefined : locale }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <nav className="mb-6 flex flex-wrap gap-4" aria-label={m.nav_label({}, { locale })}>
        <Link to="/{-$locale}" params={localeParams}>
          Guany
        </Link>
        <Link to="/{-$locale}/projects" params={localeParams}>
          {m.projects_title({}, { locale })}
        </Link>
        <Link to="/{-$locale}/docs/$" params={{ ...localeParams, _splat: 'getting-started' }}>
          {m.nav_docs({}, { locale })}
        </Link>
        <Link
          to="."
          params={(params) => ({
            ...params,
            locale: otherLocale === baseLocale ? undefined : otherLocale,
          })}
          search
          hash
          preload={false}
          lang={otherLocale}
          onClick={(event) => {
            if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
            void setLocale(otherLocale, { reload: false })
          }}
        >
          {m.language_name({}, { locale: otherLocale })}
        </Link>
      </nav>
      <Outlet />
    </main>
  )
}
