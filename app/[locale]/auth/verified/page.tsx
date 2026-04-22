import { useTranslations } from 'next-intl'
import { CircleCheck } from 'lucide-react'

export default function VerifiedPage() {
  const t = useTranslations('auth.verified')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <CircleCheck className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
          <br />
          {t('hint')}
        </p>
      </div>
    </div>
  )
}
