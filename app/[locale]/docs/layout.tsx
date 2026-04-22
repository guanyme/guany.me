import { setRequestLocale } from 'next-intl/server'
import { DocsSidebar } from '@/components/docs/docs-sidebar'

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20">
      <DocsSidebar />
      <div className="py-8 lg:ml-[17rem]">{children}</div>
    </div>
  )
}
