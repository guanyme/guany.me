import { siteUrl } from '@/lib/site'

export function webSiteJsonLd({
  name,
  description,
  locale,
}: {
  name: string
  description: string
  locale: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url: siteUrl,
    inLanguage: locale === 'zh' ? 'zh' : 'en',
    author: {
      '@type': 'Person',
      name: 'Guany',
      url: siteUrl,
    },
  }
}

export function techArticleJsonLd({
  title,
  description,
  url,
  dateModified,
  locale,
}: {
  title: string
  description?: string
  url: string
  dateModified?: string | null
  locale: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    ...(description && { description }),
    url,
    inLanguage: locale === 'zh' ? 'zh' : 'en',
    ...(dateModified && { dateModified }),
    author: {
      '@type': 'Person',
      name: 'Guany',
      url: siteUrl,
    },
  }
}

export function softwareJsonLd({
  name,
  description,
  url,
  codeRepository,
  programmingLanguage,
}: {
  name: string
  description?: string | null
  url: string
  codeRepository: string
  programmingLanguage?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name,
    ...(description && { description }),
    url,
    codeRepository,
    ...(programmingLanguage && { programmingLanguage }),
    author: {
      '@type': 'Person',
      name: 'Guany',
      url: siteUrl,
    },
  }
}
