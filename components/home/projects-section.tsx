import { getTranslations } from 'next-intl/server'
import { getRepos } from '@/lib/github'
import { ProjectCard } from './project-card'

export async function ProjectsSection() {
  const [repos, t] = await Promise.all([getRepos(), getTranslations('home')])

  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="animate-fade-in-up mb-10 text-center text-2xl font-semibold">
          {t('myProjects')}
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {repos.slice(0, 6).map((repo, index) => (
            <ProjectCard key={repo.id} repo={repo} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
