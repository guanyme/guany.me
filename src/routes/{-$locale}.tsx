import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '#/components/layout/site-header'
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

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        locale={locale}
        languageSwitch={
          <Link
            className="inline-flex h-8 items-center rounded-lg px-2 text-sm hover:bg-muted"
            to="."
            params={(params) => ({
              ...params,
              locale: otherLocale === baseLocale ? undefined : otherLocale,
            })}
            search
            hash
            preload={false}
            lang={otherLocale}
            title={m.nav_language({}, { locale })}
            onClick={(event) => {
              if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
              void setLocale(otherLocale, { reload: false })
            }}
          >
            {m.language_name({}, { locale: otherLocale })}
          </Link>
        }
      />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  )
}
