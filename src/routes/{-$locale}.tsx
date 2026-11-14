import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { defaultLocale, isLocale, localeCookie } from '#/locale'

export const Route = createFileRoute('/{-$locale}')({
  params: {
    parse: ({ locale }) => {
      if (locale !== undefined && !isLocale(locale)) return false
      return { locale }
    },
  },
  beforeLoad: ({ params }) => ({ locale: params.locale ?? defaultLocale }),
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useRouteContext()
  const otherLocale = locale === 'zh' ? 'en' : 'zh'
  const localeParams = { locale: locale === 'zh' ? locale : undefined }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <nav
        className="mb-6 flex flex-wrap gap-4"
        aria-label={locale === 'zh' ? '主导航' : 'Main navigation'}
      >
        <Link to="/{-$locale}" params={localeParams}>
          Guany
        </Link>
        <Link to="/{-$locale}/projects" params={localeParams}>
          {locale === 'zh' ? '项目' : 'Projects'}
        </Link>
        <Link to="/{-$locale}/docs/$" params={{ ...localeParams, _splat: 'getting-started' }}>
          {locale === 'zh' ? '文档' : 'Docs'}
        </Link>
        <Link
          to="."
          params={(params) => ({
            ...params,
            locale: otherLocale === 'en' ? undefined : otherLocale,
          })}
          search
          hash
          preload={false}
          lang={otherLocale}
          onClick={(event) => {
            if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
            document.cookie = `${localeCookie}=${otherLocale}; Path=/; SameSite=Lax`
          }}
        >
          {otherLocale === 'zh' ? '中文' : 'English'}
        </Link>
      </nav>
      <Outlet />
    </main>
  )
}
