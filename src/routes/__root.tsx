import { HeadContent, Scripts, createRootRoute, useParams } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ThemeProvider, useTheme } from 'next-themes'
import { useEffect } from 'react'
import { THEME_COLOR } from '#/lib/site'
import { m } from '#/paraglide/messages.js'
import { baseLocale, isLocale } from '#/paraglide/runtime.js'
import '@fontsource-variable/inter'
import '@fontsource-variable/fira-code'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function useDocumentLocale() {
  const { locale } = useParams({ strict: false })
  return isLocale(locale) ? locale : baseLocale
}

function NotFound() {
  const locale = useDocumentLocale()
  return <p className="mx-auto max-w-7xl p-6">{m.not_found({}, { locale })}</p>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const locale = useDocumentLocale()
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="font-sans antialiased"
    >
      <head>
        <HeadContent />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content={THEME_COLOR.light}
        />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_COLOR.dark} />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SyncThemeColor />
          {children}
        </ThemeProvider>
        <TanStackDevtools
          plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function SyncThemeColor() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') return
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = THEME_COLOR[resolvedTheme]
    }
  }, [resolvedTheme])

  return null
}
