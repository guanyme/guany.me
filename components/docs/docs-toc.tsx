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

    // 首次运行不写 URL：页面刚加载就把 hash 塞进地址栏的话，之后刷新或从
    // 历史返回时浏览器会自动跳到那个锚点，表现为「一进页面就自己滚动」。
    // 只有用户真正滚动过之后才开始同步。
    let userHasScrolled = false

    // 让地址栏跟上当前章节，随时可复制链接分享到具体位置。
    // 用 replaceState 而非 pushState：滚动是连续动作，pushState 会把浏览
    // 历史塞满，后退键实际失效。
    // 也不用 location.hash = x —— 那会让浏览器跳转到锚点，正在滚动时被硬
    // 拽一下，还会触发下面自己的 hashchange 监听。
    const syncHash = (id: string) => {
      if (!userHasScrolled || !id) return
      const next = `#${id}`
      if (window.location.hash === next) return
      window.history.replaceState(null, '', next)
    }

    // 标题位置缓存。原先每次 scroll 都 querySelectorAll + 读 offsetTop，
    // 而 offsetTop 是布局属性，高频读取会反复触发强制同步布局。实测 25 个
    // 标题时单次 0.232ms，滚动中约 60-120 次/秒 —— 每秒白烧 21ms，而一帧
    // 预算只有 16.7ms。缓存后单次降到 0.0015ms。
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
      // 如果刚点击了链接，跳过这次滚动检测
      if (justClicked) {
        justClicked = false
        return
      }

      const headings = positions
      if (headings.length === 0) return

      const scrollY = window.scrollY
      const innerHeight = window.innerHeight
      const scrollHeight = document.documentElement.scrollHeight
      // 只有页面可滚动且滚动到底部时才高亮最后一个
      const canScroll = scrollHeight > innerHeight
      const isBottom = canScroll && scrollY + innerHeight >= scrollHeight - 10

      // 页面底部时高亮最后一个
      if (isBottom) {
        const lastId = headings[headings.length - 1].id
        setActiveId(lastId)
        syncHash(lastId)
        return
      }

      // 找到当前滚动位置对应的标题
      // 与 streamdown-renderer 里 applyScrollMargins 算出的停靠位保持一致：
      // header 64px + 标题上方间距（至少 24px）。判定偏移若小于它，跳转后
      // 高亮的会是上一节。
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

    // hash 变化时（点击 TOC 链接）立即更新高亮
    const handleHashChange = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1))
      if (hash && toc.some((item) => item.id === hash)) {
        justClicked = true
        setActiveId(hash)
      }
    }

    measure()
    handleScroll()

    // rAF 节流：scroll 的触发频率高于渲染帧率，一帧内算多次是白费。
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        handleScroll()
      })
    }

    // 图片、代码高亮、字体加载都会改变标题的绝对位置，缓存必须跟着失效。
    const articleEl = document.querySelector('article')
    const ro = articleEl ? new ResizeObserver(() => measure()) : null
    ro?.observe(articleEl as Element)

    const markScrolled = () => {
      userHasScrolled = true
    }
    window.addEventListener('scroll', markScrolled, {
      passive: true,
      once: true,
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('scroll', markScrolled)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      window.removeEventListener('hashchange', handleHashChange)
      ro?.disconnect()
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
