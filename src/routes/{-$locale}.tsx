import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Languages } from 'lucide-react'
import { SiteHeader } from '#/components/layout/site-header'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { m } from '#/paraglide/messages.js'
import { baseLocale, isLocale, locales, setLocale } from '#/paraglide/runtime.js'

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

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        locale={locale}
        languageSwitch={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={m.nav_language({}, { locale })} />
              }
            >
              <Languages aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {locales.map((language) => {
                  const isCurrent = language === locale

                  return (
                    <DropdownMenuItem
                      key={language}
                      lang={language}
                      aria-current={isCurrent ? 'true' : undefined}
                      className={isCurrent ? 'font-medium' : undefined}
                      render={
                        isCurrent ? undefined : (
                          <Link
                            to="."
                            params={(params) => ({
                              ...params,
                              locale: language === baseLocale ? undefined : language,
                            })}
                            search
                            hash
                            replace
                            preload={false}
                            onClick={(event) => {
                              if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
                                return
                              void setLocale(language, { reload: false })
                            }}
                          />
                        )
                      }
                    >
                      {m.language_name({}, { locale: language })}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  )
}
