import { Link } from '@tanstack/react-router'
import { docItemTitle, docsConfig } from '#/lib/docs-config'
import { m } from '#/paraglide/messages.js'
import { baseLocale, type Locale } from '#/paraglide/runtime.js'

export function DocsNav({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  return (
    <nav className="space-y-6" aria-label={m.nav_docs({}, { locale })}>
      {docsConfig.map((group) => (
        <div key={group.titleKey}>
          <h4 className="mb-2 font-semibold">
            {group.titleKey === 'guide'
              ? m.docs_guide({}, { locale })
              : m.docs_environment({}, { locale })}
          </h4>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/{-$locale}/docs/$"
                  params={{ locale: locale === baseLocale ? undefined : locale, _splat: item.slug }}
                  onClick={onNavigate}
                  activeOptions={{ exact: true }}
                  className="block rounded-md px-3 py-2 text-sm transition-colors"
                  activeProps={{ className: 'bg-primary/10 text-primary' }}
                  inactiveProps={{
                    className: 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  }}
                >
                  {docItemTitle(item, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
