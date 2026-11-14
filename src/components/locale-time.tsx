import { useSyncExternalStore } from 'react'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

function formatRelative(date: string, locale: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  for (const [unit, ms] of UNITS) {
    const value = Math.floor(diff / ms)
    if (value >= 1) return rtf.format(-value, unit)
  }

  return rtf.format(0, 'second')
}

const subscribe = () => () => {}

interface LocaleTimeProps {
  date: string
  locale: string
}

export function LocaleTime({ date, locale }: LocaleTimeProps) {
  const loc = new Intl.Locale(locale).toString()
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  return (
    <time
      dateTime={date}
      title={new Date(date).toLocaleString(loc, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
      suppressHydrationWarning
    >
      {inBrowser
        ? formatRelative(date, loc)
        : new Date(date).toLocaleDateString(loc, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
    </time>
  )
}
