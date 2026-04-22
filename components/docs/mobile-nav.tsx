'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { docsConfig } from '@/lib/docs-config'

export function MobileNav({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('docs')

  return (
    <div className={cn('lg:hidden', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="p-0">
          <SheetHeader className="border-b border-border pr-14">
            <SheetTitle>{t('title')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('pageNav')}
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto p-4">
            <nav className="flex flex-col gap-6">
              {docsConfig.map((group) => (
                <div key={`mobile-group-${group.titleKey}`}>
                  <h4 className="mb-2 font-semibold">{t(group.titleKey)}</h4>
                  <ul className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const href = `/docs/${item.slug}`
                      const isActive = pathname === href

                      return (
                        <li key={`mobile-${item.slug}`}>
                          <Link
                            href={href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'block rounded-md px-3 py-2 text-sm transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                            )}
                          >
                            {t.has(item.titleKey)
                              ? t(item.titleKey)
                              : item.titleKey}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
