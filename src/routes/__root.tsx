import { HeadContent, Scripts, createRootRoute, useParams } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { m } from '#/paraglide/messages.js'
import { baseLocale, isLocale } from '#/paraglide/runtime.js'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Guany',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  const { locale } = useParams({ strict: false })
  return <p>{m.not_found({}, { locale: isLocale(locale) ? locale : baseLocale })}</p>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { locale } = useParams({ strict: false })

  return (
    <html lang={isLocale(locale) ? locale : baseLocale}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
