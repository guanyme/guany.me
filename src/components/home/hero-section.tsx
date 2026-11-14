import { BookMarked, MapPin, Users } from 'lucide-react'
import { m } from '#/paraglide/messages.js'
import type { Locale } from '#/paraglide/runtime.js'
import type { GitHubUser } from '#/types/github'

interface HeroSectionProps {
  locale: Locale
  user: GitHubUser | null
  backgroundUrl?: string
  backgroundPosition?: string
}

export function HeroSection({
  locale,
  user,
  backgroundUrl,
  backgroundPosition = 'center',
}: HeroSectionProps) {
  return (
    <section className="relative">
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: backgroundPosition }}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/30 to-background/95" />

      <div className="relative z-10 flex min-h-125 items-center justify-center px-5 py-20">
        <div className="animate-fade-in-up flex flex-col items-center text-center">
          <div className="mb-6">
            <img
              src="/avatar.png"
              alt="Guany"
              width={128}
              height={128}
              className="size-32 rounded-full shadow-xl ring-4 ring-white/80 dark:ring-white/20"
            />
          </div>
          <h1 className="mb-3 text-4xl font-bold md:text-5xl">Guany</h1>
          <p className="mb-6 max-w-md text-lg text-muted-foreground">
            {user?.bio || m.home_description({}, { locale })}
          </p>
          {user && (
            <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
              {user.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookMarked className="size-4" />
                <span>{m.home_repos({ count: user.public_repos }, { locale })}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>{m.home_followers({ count: user.followers }, { locale })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
