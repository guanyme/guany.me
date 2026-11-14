import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CopyMarkdownButton } from '#/components/copy-markdown-button'
import type { extractToc } from '#/components/markdown/headings'
import { m } from '#/paraglide/messages.js'
import type { Locale } from '#/paraglide/runtime.js'

interface DocsTocProps {
  toc: ReturnType<typeof extractToc>
  markdown: string
  locale: Locale
}

export function DocsToc({ toc, markdown, locale }: DocsTocProps) {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(toc[0]?.id)
  useEffect(() => {
    let scrolled = false
    let frame = 0
    const ids = toc.map(({ id }) => id)

    const trackHeading = () => {
      const headings = ids.flatMap((id) => document.getElementById(id) ?? [])
      const root = document.documentElement
      const atBottom =
        root.scrollHeight > window.innerHeight &&
        window.scrollY + window.innerHeight >= root.scrollHeight - 10
      const active = atBottom
        ? headings.at(-1)
        : (headings.filter((heading) => heading.getBoundingClientRect().top <= 92).at(-1) ??
          headings[0])
      if (!active) return

      setActiveId(active.id)
      const hash = encodeURIComponent(active.id)
      if (scrolled && window.location.hash !== `#${hash}`) {
        void navigate({
          hash,
          search: true,
          replace: true,
          resetScroll: false,
          hashScrollIntoView: false,
        })
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(trackHeading)
    }
    const markUserScroll = () => {
      scrolled = true
    }
    const onHashChange = () => {
      scrolled = false
      cancelAnimationFrame(frame)
      const active = ids.find((id) => window.location.hash === `#${encodeURIComponent(id)}`)
      if (active) setActiveId(active)
    }

    trackHeading()
    onHashChange()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', markUserScroll, { passive: true })
    window.addEventListener('touchmove', markUserScroll, { passive: true })
    window.addEventListener('hashchange', onHashChange)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', markUserScroll)
      window.removeEventListener('touchmove', markUserScroll)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [navigate, toc])

  return (
    <aside className="fixed top-24 right-4 hidden max-h-[calc(100vh-6rem)] w-60 flex-col xl:flex 2xl:right-[calc((100vw-80rem)/2+1rem)]">
      <CopyMarkdownButton content={markdown} locale={locale} className="mb-4 w-full shrink-0" />
      {toc.length > 0 && (
        <>
          <h4 className="mb-3 shrink-0 font-semibold">{m.docs_page_nav({}, { locale })}</h4>
          <nav
            aria-label={m.docs_page_nav({}, { locale })}
            className="min-h-0 flex-1 overflow-y-auto pr-2 pb-8"
          >
            <ul className="space-y-2 text-sm">
              {toc.map((item, index) => (
                <li
                  key={`${item.id}-${index}`}
                  style={{ paddingLeft: `${(item.level - 2) * 0.75}rem` }}
                >
                  <a
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? 'location' : undefined}
                    className={`block py-1 transition-colors ${activeId === item.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </aside>
  )
}
