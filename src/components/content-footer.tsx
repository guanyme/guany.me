import { ChevronLeft, ChevronRight, SquarePen } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { m } from '#/paraglide/messages.js'
import { baseLocale, type Locale } from '#/paraglide/runtime.js'
import { LocaleTime } from '#/components/locale-time'

interface NavItem {
  title: string
  slug: string
}

interface ContentFooterProps {
  editUrl: string
  locale: Locale
  lastUpdated?: string | null
  collection?: 'docs' | 'projects'
  prev?: NavItem
  next?: NavItem
}

export function ContentFooter({
  editUrl,
  locale,
  lastUpdated,
  collection = 'docs',
  prev,
  next,
}: ContentFooterProps) {
  return (
    <>
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <SquarePen className="size-3.5" />
          {m.common_edit_on_github({}, { locale })}
        </a>
        {lastUpdated && (
          <span className="text-muted-foreground">
            {m.common_last_updated({}, { locale })}:{' '}
            <LocaleTime date={lastUpdated} locale={locale} />
          </span>
        )}
      </div>
      {(prev || next) && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {prev && <NavLink item={prev} locale={locale} collection={collection} direction="prev" />}
          {next && <NavLink item={next} locale={locale} collection={collection} direction="next" />}
        </div>
      )}
    </>
  )
}

function NavLink({
  item,
  locale,
  direction,
  collection,
}: {
  item: NavItem
  locale: Locale
  direction: 'prev' | 'next'
  collection: 'docs' | 'projects'
}) {
  const routeLocale = locale === baseLocale ? undefined : locale
  const target =
    collection === 'docs'
      ? ({ to: '/{-$locale}/docs/$', params: { locale: routeLocale, _splat: item.slug } } as const)
      : ({
          to: '/{-$locale}/projects/$slug',
          params: { locale: routeLocale, slug: item.slug },
        } as const)
  const next = direction === 'next'
  return (
    <Link
      {...target}
      className={`group flex flex-col gap-1 rounded-md border p-3 transition-colors hover:border-foreground/20 ${next ? 'col-start-2 items-end text-right' : ''}`}
    >
      <span className="text-xs text-muted-foreground">
        {next ? m.common_next_page({}, { locale }) : m.common_prev_page({}, { locale })}
      </span>
      <span className="flex items-center gap-1 text-sm font-medium text-primary">
        {!next && <ChevronLeft className="size-4 shrink-0" />}
        {item.title}
        {next && <ChevronRight className="size-4 shrink-0" />}
      </span>
    </Link>
  )
}
