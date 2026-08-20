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

// 获取元素的绝对顶部位置（参考 VitePress 实现）
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
    // 标记是否刚点击了 TOC 链接
    let justClicked = false

    const handleScroll = () => {
      // 如果刚点击了链接，跳过这次滚动检测
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
      // 只有页面可滚动且滚动到底部时才高亮最后一个
      const canScroll = scrollHeight > innerHeight
      const isBottom = canScroll && scrollY + innerHeight >= scrollHeight - 10

      // 页面底部时高亮最后一个
      if (isBottom) {
        setActiveId(headings[headings.length - 1].id)
        return
      }

      // 找到当前滚动位置对应的标题
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

    // hash 变化时（点击 TOC 链接）立即更新高亮
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

  // 目录很长时，高亮项可能落在 TOC 可视区之外，这里把它带回视野。
  //
  // 刻意不做动画：这个滚动由阅读行为被动触发，而非用户主动请求。加平滑动画会
  // 让页面和目录两处同时运动，反而分散注意力；浏览器原生 smooth 时长约 500ms，
  // 也超出微交互 150-300ms 的合理区间。瞬时定位读者不会察觉，只会觉得目录
  // 「总在正确位置」——Tailwind Docs、MDN 走的都是这个路子。
  //
  // 用 container.scrollTop 而非 scrollIntoView：后者在部分浏览器上会连带滚动
  // 祖先元素（这里就是整个页面），把阅读位置拽走。
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

    // 只在高亮项彻底移出可视区时才动。若改成「接近边缘就滚」，读者在章节
    // 交界处上下微调时目录会反复抽动。
    const fullyVisible =
      relativeTop >= viewTop && relativeTop + linkRect.height <= viewBottom
    if (fullyVisible) return

    // 落到可视区上方三分之一处，留出后文的上下文，也降低下次触发的频率。
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
          {/* 滚动容器是这里而不是 aside：复制按钮和标题要钉在顶部。
              min-h-0 不能省 —— flex 子项默认 min-height:auto，不加它就不会
              收缩，overflow 永远不触发。 */}
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
