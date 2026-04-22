import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  setRequestLocale,
  getTranslations,
  getMessages,
} from 'next-intl/server'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { SiteHeader } from '@/components/layout/site-header'
import { routing } from '@/i18n/routing'
import { getUser } from '@/lib/github'
import { siteUrl } from '@/lib/site'
import { webSiteJsonLd } from '@/lib/json-ld'

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
  const name = user?.name || 'Guany'

  const title = t('siteTitle', { name })
  const description = user?.bio || t('siteDescription', { name })
  const localePrefix = locale === 'en' ? '' : `/${locale}`

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: user?.avatar_url ? [{ url: '/api/avatar' }] : undefined,
    openGraph: {
      type: 'website',
      siteName: title,
      locale: locale === 'zh-cn' ? 'zh_CN' : 'en_US',
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
        'zh-CN': `${siteUrl}/zh-cn`,
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
  const name = user?.name || 'Guany'

  return (
    <NextIntlClientProvider messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webSiteJsonLd({
              name: t('siteTitle', { name }),
              description: user?.bio || t('siteDescription', { name }),
              locale,
            }),
          ).replace(/</g, '\\u003c'),
        }}
      />
      <div className="flex min-h-full flex-col">
        <SiteHeader avatar={user?.avatar_url} name={user?.name || undefined} />
        <main className="flex-1">{children}</main>
      </div>
    </NextIntlClientProvider>
  )
}
