import { m } from '#/paraglide/messages.js'
import type { Locale } from '#/paraglide/runtime.js'

export function SiteFooter({
  locale,
  copyrightYear,
  avatar,
  name = 'Guany',
}: {
  locale: Locale
  copyrightYear: number
  avatar?: string
  name?: string
}) {
  return (
    <footer className="border-t border-border px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            {avatar && (
              <img src={avatar} alt="" width={24} height={24} className="size-6 rounded-full" />
            )}
            <span className="text-sm text-muted-foreground">
              © {copyrightYear} {name}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">{m.footer_license({}, { locale })}</div>
        </div>
      </div>
    </footer>
  )
}
