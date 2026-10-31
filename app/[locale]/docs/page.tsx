import { redirect } from '@/i18n/navigation'

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect({ href: '/docs/getting-started', locale })
}
