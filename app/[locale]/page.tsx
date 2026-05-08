import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { HeroSection } from '@/components/home/hero-section'
import {
  ProjectsSection,
  ProjectsSectionSkeleton,
} from '@/components/home/projects-section'
import { SiteFooter } from '@/components/layout/site-footer'
import { getUser } from '@/lib/github'
import { getHeroBackground } from '@/lib/hero'

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [user, hero] = await Promise.all([getUser(), getHeroBackground(locale)])

  return (
    <>
      <HeroSection
        user={user}
        backgroundUrl={hero?.url}
        backgroundPosition={hero?.position}
      />
      <Suspense fallback={<ProjectsSectionSkeleton />}>
        <ProjectsSection />
      </Suspense>
      <SiteFooter avatar={user?.avatar_url} name={user?.name || undefined} />
    </>
  )
}
