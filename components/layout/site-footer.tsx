import Image from 'next/image'
import { cacheLife } from 'next/cache'
import { useTranslations } from 'next-intl'

interface SiteFooterProps {
  avatar?: string
  name?: string
}

export function SiteFooter({ avatar, name }: SiteFooterProps) {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-border px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            {avatar && (
              <Image
                src={avatar}
                alt="logo"
                width={24}
                height={24}
                className="size-6 rounded-full"
              />
            )}
            <span className="text-sm text-muted-foreground">
              © <CopyrightYear /> {name || 'Guany'}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">{t('license')}</div>
        </div>
      </div>
    </footer>
  )
}

// Cached for a day so the prerendered footer still rolls over to the new year
async function CopyrightYear() {
  'use cache'
  cacheLife('days')
  return new Date().getFullYear()
}
