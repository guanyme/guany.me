import type { Metadata, Viewport } from 'next'
import { Inter, Fira_Code } from 'next/font/google'
import { notFound } from 'next/navigation'
import {
  setRequestLocale,
  getTranslations,
  getMessages,
} from 'next-intl/server'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteHeader } from '@/components/layout/site-header'
import { routing } from '@/i18n/routing'
import { getUser } from '@/lib/github'
import { siteUrl, THEME_COLOR } from '@/lib/site'
import { webSiteJsonLd } from '@/lib/json-ld'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})
const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR.dark },
  ],
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const user = await getUser()

  const title = t('siteTitle')
  const description = user?.bio || t('siteDescription')
  const localePrefix = locale === 'en' ? '' : `/${locale}`

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    appleWebApp: {
      statusBarStyle: 'default',
    },
    openGraph: {
      type: 'website',
      siteName: title,
      locale: locale === 'zh' ? 'zh' : 'en_US',
      url: `${siteUrl}${localePrefix}`,
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}${localePrefix}`,
      languages: {
        en: `${siteUrl}/`,
        zh: `${siteUrl}/zh`,
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const [user, messages, t] = await Promise.all([
    getUser(),
    getMessages(),
    getTranslations({ locale, namespace: 'metadata' }),
  ])

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
    >
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(
                  webSiteJsonLd({
                    name: t('siteTitle'),
                    description: user?.bio || t('siteDescription'),
                    locale,
                  }),
                ).replace(/</g, '\\u003c'),
              }}
            />
            <div className="flex min-h-full flex-col">
              <SiteHeader avatar="/avatar.png" name="Guany" />
              <main className="flex-1 pt-16">{children}</main>
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
