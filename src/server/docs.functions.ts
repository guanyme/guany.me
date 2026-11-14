import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { isLocale } from '#/paraglide/runtime.js'
import { getDocument } from './docs.server'

export const getDocumentForRoute = createServerFn({ method: 'GET' })
  .validator((data: { locale: unknown; slug: unknown }) => {
    if (!isLocale(data.locale) || typeof data.slug !== 'string') throw notFound()
    return { locale: data.locale, slug: data.slug }
  })
  .handler(({ data }) => {
    const markdown = getDocument(data.locale, data.slug)
    if (!markdown) throw notFound()
    return markdown
  })
