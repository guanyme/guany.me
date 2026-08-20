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

// 数据获取下沉到这里：放在页面组件里 await 会阻塞整个路由的首字节，
// Suspense 也就形同虚设——它只能挂起自己的子树，挂不住父级已经 await 完的东西。
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
