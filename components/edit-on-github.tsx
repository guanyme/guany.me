import { SquarePen } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface EditOnGitHubProps {
  url: string
  locale: string
}

export async function EditOnGitHub({ url, locale }: EditOnGitHubProps) {
  const t = await getTranslations({ locale, namespace: 'common' })

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <SquarePen className="size-3.5" />
      {t('editOnGitHub')}
    </a>
  )
}
