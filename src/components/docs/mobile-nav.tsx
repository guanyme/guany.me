import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useMatch } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages.js'
import { baseLocale } from '#/paraglide/runtime.js'
import { DocsNav } from './docs-nav'

export function MobileNav({ className }: { className?: string }) {
  const match = useMatch({ from: '/{-$locale}', shouldThrow: false })
  const locale = match?.context.locale ?? baseLocale
  const [open, setOpen] = useState(false)
  const title = m.nav_docs({}, { locale })

  return (
    <div className={cn('lg:hidden', className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label={title} />}>
          <Menu aria-hidden />
        </SheetTrigger>
        <SheetContent side="left" closeLabel={m.link_safety_close({}, { locale })}>
          <SheetHeader className="border-b pr-14">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className="sr-only">
              {m.docs_page_nav({}, { locale })}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <DocsNav locale={locale} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
