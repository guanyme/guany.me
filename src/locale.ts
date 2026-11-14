export const locales = ['en', 'zh'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'
export const localeCookie = 'NEXT_LOCALE'

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value)
}
