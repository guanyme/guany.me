import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import {
  HeroSection,
  HeroSectionSkeleton,
} from '@/components/home/hero-section'
import {
  ProjectsSection,
  ProjectsSectionSkeleton,
} from '@/components/home/projects-section'
import { SiteFooter } from '@/components/layout/site-footer'
import { getUser } from '@/lib/github'
import { getHeroBackground } from '@/lib/hero'

// Data fetching is moved down here: awaiting inside the page component would block the entire route's first byte,
// making Suspense effectively useless—it can only suspend its own subtree, not something the parent has already awaited.
async function Hero({ locale }: { locale: string }) {
  const [user, hero] = await Promise.all([getUser(), getHeroBackground(locale)])
  return (
    <>
      {hero?.url && (
        // React 19 hoists this <link> into <head> automatically, giving the
        // hero wallpaper an LCP-friendly preload.
        <link rel="preload" as="image" href={hero.url} fetchPriority="high" />
      )}
      <HeroSection
        user={user}
        backgroundUrl={hero?.url}
        backgroundPosition={hero?.position}
      />
    </>
  )
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Suspense fallback={<HeroSectionSkeleton />}>
        <Hero locale={locale} />
      </Suspense>
      <Suspense fallback={<ProjectsSectionSkeleton />}>
        <ProjectsSection />
      </Suspense>
      <SiteFooter avatar="/avatar.png" name="Guany" />
    </>
  )
}
