'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useCopy } from '@/lib/use-copy'
import { Button } from '@/components/ui/button'

interface TocItem {
  level: number
  text: string
  id: string
}

interface DocsTocProps {
  toc: TocItem[]
  rawContent?: string
}

// Get the element's absolute top position (based on the VitePress implementation)
function getAbsoluteTop(element: HTMLElement): number {
  let offsetTop = 0
  let el: HTMLElement | null = element
  while (el && el !== document.body) {
    offsetTop += el.offsetTop
    el = el.offsetParent as HTMLElement | null
  }
  return offsetTop
}

export function DocsToc({ toc, rawContent }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id || '')
  const navRef = useRef<HTMLElement | null>(null)
  const [copied, copy] = useCopy()
  const t = useTranslations('docs')
  const tCopy = useTranslations('copy')

  useEffect(() => {
    // Mark whether a TOC link was just clicked
    let justClicked = false

    const handleScroll = () => {
      // Skip this scroll check if a link was just clicked
      if (justClicked) {
        justClicked = false
        return
      }

      const headings = Array.from(
        document.querySelectorAll(
          'article h2[id], article h3[id], article h4[id]',
        ),
      ) as HTMLElement[]

      if (headings.length === 0) return

      const scrollY = window.scrollY
      const innerHeight = window.innerHeight
      const scrollHeight = document.documentElement.scrollHeight
      // Only highlight the last item when the page is scrollable and scrolled to the bottom
      const canScroll = scrollHeight > innerHeight
      const isBottom = canScroll && scrollY + innerHeight >= scrollHeight - 10

      // Highlight the last item at the bottom of the page
      if (isBottom) {
        setActiveId(headings[headings.length - 1].id)
        return
      }

      // Find the heading corresponding to the current scroll position
      const scrollOffset = 100
      let activeId = headings[0].id

      for (const heading of headings) {
        const top = getAbsoluteTop(heading)
        if (top > scrollY + scrollOffset + 4) {
          break
        }
        activeId = heading.id
      }

      setActiveId(activeId)
    }

    // Update the highlight immediately when the hash changes (on TOC link clicks)
    const handleHashChange = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1))
      if (hash && toc.some((item) => item.id === hash)) {
        justClicked = true
        setActiveId(hash)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [toc])

  // When the TOC is long, the highlighted item may be outside its visible area, so bring it back into view here.
  //
  // Intentionally no animation: this scroll is passively triggered by reading behavior, not explicitly requested by the user. Adding a smooth animation would
  // make the page and the table of contents move at the same time, distracting from the content; the browser's native smooth scrolling takes about 500ms,
  // which also exceeds the reasonable 150-300ms range for micro-interactions. Readers won't notice an instant jump; they'll just feel that the table of contents is
  // "always in the right place" — that's the approach used by Tailwind Docs and MDN.
  //
  // Use container.scrollTop rather than scrollIntoView: in some browsers, the latter also scrolls
  // ancestor elements (here, the entire page), pulling the reading position away.
  useEffect(() => {
    const container = navRef.current
    if (!container || !activeId) return

    const link = container.querySelector<HTMLElement>(
      `a[href="#${CSS.escape(activeId)}"]`,
    )
    if (!link) return

    const containerRect = container.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    const relativeTop = linkRect.top - containerRect.top + container.scrollTop
    const viewTop = container.scrollTop
    const viewBottom = viewTop + container.clientHeight

    // Only move when the highlighted item has completely left the viewport. If we instead scrolled when it "neared the edge," the table of contents would
    // jerk back and forth as readers made small adjustments around section boundaries.
    const fullyVisible =
      relativeTop >= viewTop && relativeTop + linkRect.height <= viewBottom
    if (fullyVisible) return

    // Position it one-third of the way down the visible area to leave room for the context below and reduce how often this is triggered again.
    const next = relativeTop - container.clientHeight / 3
    const max = container.scrollHeight - container.clientHeight
    container.scrollTop = Math.max(0, Math.min(next, max))
  }, [activeId])

  if (toc.length === 0 && !rawContent) {
    return null
  }

  return (
    <aside
      className="fixed top-24 hidden max-h-[calc(100vh-6rem)] w-60 flex-col xl:right-4 xl:flex 2xl:right-[calc((100vw-80rem)/2+1rem)]"
    >
      {rawContent && (
        <div className="mb-4 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full gap-2 text-xs"
            onClick={() => rawContent && copy(rawContent)}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? tCopy('copied') : tCopy('copyMarkdown')}
          </Button>
        </div>
      )}
      {toc.length > 0 && (
        <>
          <h4 className="mb-3 shrink-0 font-semibold">{t('pageNav')}</h4>
          {/* The scroll container is here, not aside: the copy button and heading need to stay pinned at the top.
              min-h-0 is essential — flex children default to min-height:auto; without it, they won't
              shrink, and overflow will never be triggered. */}
          <nav ref={navRef} className="min-h-0 flex-1 overflow-y-auto pr-2 pb-8">
            <ul className="space-y-2 text-sm">
              {toc.map((item, index) => (
                <li
                  key={`${item.id}-${index}`}
                  style={{ paddingLeft: `${(item.level - 2) * 0.75}rem` }}
                >
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      'block py-1 transition-colors',
                      activeId === item.id
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
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
