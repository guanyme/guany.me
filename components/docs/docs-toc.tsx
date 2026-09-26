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

    // Do not write the URL on first load: if we put the hash in the address bar as soon as the page loads, then on refresh or when navigating back from
    // history, the browser will automatically jump to that anchor, making it seem like "the page scrolls by itself as soon as you open it."
    // Start syncing only after the user has actually scrolled.
    let userHasScrolled = false

    // The current page's path. If the old instance has a queued callback after navigating, it must not write the old anchor to the new page.
    const pathname = window.location.pathname

    // Keep the address bar in sync with the current section, so links to specific positions can be copied and shared at any time.
    // Use replaceState rather than pushState: scrolling is a continuous action, and pushState would fill up the browser's
    // history, making the Back button effectively useless.
    // Also, don't use location.hash = x — that makes the browser jump to the anchor, forcibly jolting the page while scrolling,
    // and also triggers the hashchange listener below.
    const syncHash = (id: string) => {
      if (!userHasScrolled || !id || window.location.pathname !== pathname)
        return
      const next = `#${id}`
      if (window.location.hash === next) return
      window.history.replaceState(null, '', next)
    }

    // Cache heading positions. Previously, every scroll ran querySelectorAll and read offsetTop,
    // and offsetTop is a layout property, so frequent reads repeatedly forced synchronous layout. With 25
    // headings, a single run took 0.232ms; while scrolling, that is about 60-120 times per second — burning 21ms per second for nothing, while a frame
    // has a budget of just 16.7ms. Caching reduces the time per run to 0.0015ms.
    let positions: { id: string; top: number }[] = []

    const measure = () => {
      positions = (
        Array.from(
          document.querySelectorAll(
            'article h2[id], article h3[id], article h4[id]',
          ),
        ) as HTMLElement[]
      ).map((h) => ({ id: h.id, top: getAbsoluteTop(h) }))
    }

    const handleScroll = () => {
      // Skip this scroll check if a link was just clicked
      if (justClicked) {
        justClicked = false
        return
      }

      const headings = positions
      if (headings.length === 0) return

      const scrollY = window.scrollY
      const innerHeight = window.innerHeight
      const scrollHeight = document.documentElement.scrollHeight
      // Only highlight the last item when the page is scrollable and scrolled to the bottom
      const canScroll = scrollHeight > innerHeight
      const isBottom = canScroll && scrollY + innerHeight >= scrollHeight - 10

      // Highlight the last item at the bottom of the page
      if (isBottom) {
        const lastId = headings[headings.length - 1].id
        setActiveId(lastId)
        syncHash(lastId)
        return
      }

      // Find the heading corresponding to the current scroll position.
      // Keep it consistent with the stop position calculated by applyScrollMargins in streamdown-renderer:
      // header 64px + the spacing above the heading (at least 24px). If the detection offset is smaller, after jumping
      // the previous section will be highlighted.
      const scrollOffset = 88
      let activeId = headings[0].id

      for (const heading of headings) {
        if (heading.top > scrollY + scrollOffset + 4) {
          break
        }
        activeId = heading.id
      }

      setActiveId(activeId)
      syncHash(activeId)
    }

    // Update the highlight immediately when the hash changes (on TOC link clicks)
    const handleHashChange = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1))
      if (hash && toc.some((item) => item.id === hash)) {
        justClicked = true
        setActiveId(hash)
      }
    }

    measure()
    handleScroll()

    // rAF throttling: scroll events fire more often than the rendering frame rate, so calculating multiple times per frame is wasted work.
    let ticking = false
    let rafId = 0
    const onScroll = () => {
      if (ticking) return
      ticking = true
      rafId = requestAnimationFrame(() => {
        ticking = false
        handleScroll()
      })
    }

    // Images, code highlighting, and font loading can all change headings' absolute positions, so the cache must be invalidated accordingly.
    const articleEl = document.querySelector('article')
    const ro = articleEl ? new ResizeObserver(() => measure()) : null
    ro?.observe(articleEl as Element)

    // Only count deliberate user input, not scroll events themselves: when changing pages, Next scrolls the page back to the top,
    // and rendering new content can passively change scrollY; both trigger scroll events. If syncing starts based on those, a heading will be written
    // to the new page's address bar, and streamdown-renderer will then compensate for the hash by jumping;
    // if both documents have an anchor with the same name, changing pages will jump straight to that heading.
    const userInputEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown']
    const markScrolled = () => {
      userHasScrolled = true
    }
    for (const type of userInputEvents) {
      window.addEventListener(type, markScrolled, { passive: true, once: true })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      cancelAnimationFrame(rafId)
      for (const type of userInputEvents) {
        window.removeEventListener(type, markScrolled)
      }
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      window.removeEventListener('hashchange', handleHashChange)
      ro?.disconnect()
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
    <aside className="fixed top-24 hidden max-h-[calc(100vh-6rem)] w-60 flex-col xl:right-4 xl:flex 2xl:right-[calc((100vw-80rem)/2+1rem)]">
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
          <nav
            ref={navRef}
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
