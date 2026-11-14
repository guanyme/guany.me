import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { isLocale } from '#/paraglide/runtime.js'
import { getContent } from './docs.server'

export const getDocumentForRoute = createServerFn({ method: 'GET' })
  .validator((data: { locale: unknown; slug: unknown; collection: unknown }) => {
    if (!isLocale(data.locale) || typeof data.slug !== 'string') throw notFound()
    const collection = data.collection
    if (collection !== 'docs' && collection !== 'pages') throw notFound()
    return { locale: data.locale, slug: data.slug, collection } satisfies {
      locale: typeof data.locale
      slug: string
      collection: 'docs' | 'pages'
    }
  })
  .handler(({ data }) => {
    const document = getContent(data.locale, data.collection, data.slug)
    if (!document) throw notFound()
    return document
  })
