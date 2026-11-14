import { Menu, X } from 'lucide-react'
import { useRef } from 'react'
import { useMatch } from '@tanstack/react-router'
import { m } from '#/paraglide/messages.js'
import { baseLocale } from '#/paraglide/runtime.js'
import { DocsNav } from './docs-nav'

export function MobileNav({ className = '' }: { className?: string }) {
  const match = useMatch({ from: '/{-$locale}', shouldThrow: false })
  const locale = match?.context.locale ?? baseLocale
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <div className={`lg:hidden ${className}`}>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-md hover:bg-accent"
        aria-label={m.nav_docs({}, { locale })}
        onClick={() => dialog.current?.showModal()}
      >
        <Menu className="size-5" />
      </button>
      <dialog
        ref={dialog}
        aria-label={m.nav_docs({}, { locale })}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(80vw,24rem)] max-w-none border-r bg-background text-foreground backdrop:bg-black/60"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close()
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3 font-semibold">
            {m.nav_docs({}, { locale })}
            <button
              type="button"
              aria-label={m.link_safety_close({}, { locale })}
              className="rounded p-1 hover:bg-accent"
              onClick={() => dialog.current?.close()}
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <DocsNav locale={locale} onNavigate={() => dialog.current?.close()} />
          </div>
        </div>
      </dialog>
    </div>
  )
}
