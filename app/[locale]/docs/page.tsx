import { redirect } from '@/i18n/navigation'

// This route only redirects and has no UI to validate for instant navigation.
export const instant = false

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect({ href: '/docs/getting-started', locale })
}
