'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ComponentProps } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'next-themes'
import { Link } from '@/i18n/navigation'
import { isInternalMarkdownLink } from '@/lib/markdown-link'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  )
}
import {
  Streamdown,
  type PluginConfig,
  type LinkSafetyModalProps,
} from 'streamdown'
import rehypeRaw from 'rehype-raw'
import { rehypeCustomSlug } from '@/lib/rehype-custom-slug'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import { useTranslations } from 'next-intl'
import { ExternalLink, X, Copy } from 'lucide-react'

const rehypePlugins = [rehypeRaw, rehypeUnwrapImages, rehypeCustomSlug]

const linkClassName = 'wrap-anywhere font-medium text-primary underline'

function MarkdownLink({
  href,
  children,
  className,
  node: _node,
  ...rest
}: ComponentProps<'a'> & { node?: unknown }) {
  const [externalOpen, setExternalOpen] = useState(false)
  // Heading anchors are injected by rehypeCustomSlug and should not inherit the underline and primary color used for body links.
  const isHeadingAnchor =
    (rest as Record<string, unknown>)['data-heading-anchor'] !== undefined
  const classes = isHeadingAnchor
    ? className
    : cn(linkClassName, className)
  const incomplete = href === 'streamdown:incomplete-link'

  if (isHeadingAnchor) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  if (!href || incomplete) {
    return (
      <span
        className={classes}
        data-incomplete={incomplete || undefined}
        data-streamdown="link"
      >
        {children}
      </span>
    )
  }

  if (isInternalMarkdownLink(href)) {
    if (href.startsWith('/') && !href.startsWith('//')) {
      return (
        <Link href={href} className={classes} data-streamdown="link">
          {children}
        </Link>
      )
    }
    return (
      <a href={href} className={classes} data-streamdown="link" {...rest}>
        {children}
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        className={cn(classes, 'appearance-none text-left')}
        data-streamdown="link"
        onClick={() => setExternalOpen(true)}
      >
        {children}
      </button>
      <LinkSafetyModal
        url={href}
        isOpen={externalOpen}
        onClose={() => setExternalOpen(false)}
        onConfirm={() => {
          window.open(href, '_blank', 'noreferrer')
          setExternalOpen(false)
        }}
      />
    </>
  )
}

const markdownComponents = { a: MarkdownLink }

function LinkSafetyModal({
  url,
  isOpen,
  onClose,
  onConfirm,
}: LinkSafetyModalProps) {
  const t = useTranslations('linkSafety')
  if (!isOpen || typeof document === 'undefined') return null

  const handleCopy = () => {
    void navigator.clipboard.writeText(url)
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            <span className="text-lg font-semibold">{t('title')}</span>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <span className="mb-4 block text-muted-foreground">
          {t('description')}
        </span>
        <div className="mb-4 rounded bg-muted p-3 text-sm break-all">{url}</div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded border px-4 py-2 hover:bg-muted"
          >
            <Copy className="h-4 w-4" />
            {t('copyLink')}
          </button>
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          >
            <ExternalLink className="h-4 w-4" />
            {t('openLink')}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export interface StreamdownRendererProps {
  content: string
  className?: string
  /** Render mode, static by default; AI features can pass streaming later */
  mode?: 'streaming' | 'static'
  /** Enable when rendering untrusted content; uses Streamdown's default security rehype plugin */
  untrusted?: boolean
}

export function StreamdownView({
  content,
  className,
  mode = 'static',
  untrusted = false,
  plugins,
}: StreamdownRendererProps & { plugins: PluginConfig }) {
  const mounted = useMounted()
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const trimmedContent = content.trim().replace(/\n{3,}/g, '\n\n')
  // Use 'default' during SSR, and the actual theme only after the client has mounted
  const mermaidTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'default'

  // Dynamically set scroll-margin-top based on the actual header height + the heading's marginTop
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let hashHandled = false

    const applyScrollMargins = () => {
      const header = document.querySelector('header')
      const headerHeight = header?.offsetHeight ?? 64
      const headings = container.querySelectorAll<HTMLElement>(
        'h2[id], h3[id], h4[id], h5[id], h6[id]',
      )
      // Anchor offset = header height + the heading's own margin-top.
      // This preserves the heading's margin visually, naturally leaving some space between
      // the text and the header (currently 64 + 24 = 88px, matching VitePress's measured 24px gap).
      for (const h of headings) {
        if (h.style.scrollMarginTop) continue
        const marginTop = parseFloat(getComputedStyle(h).marginTop) || 0
        h.style.scrollMarginTop = `${headerHeight + marginTop}px`
      }
      // Compensate for initial hash navigation
      if (!hashHandled && headings.length > 0) {
        hashHandled = true
        const hash = decodeURIComponent(window.location.hash.slice(1))
        if (hash) {
          const target = document.getElementById(hash)
          if (target) target.scrollIntoView()
        }
      }
    }

    applyScrollMargins()
    // Streamdown may render asynchronously or replace the DOM, so keep observing
    const observer = new MutationObserver(applyScrollMargins)
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [content])

  return (
    <div ref={containerRef} className={className}>
      <Streamdown
        mode={mode}
        key={mermaidTheme}
        plugins={plugins}
        mermaid={{ config: { theme: mermaidTheme } }}
        // Since streamdown 2.6, tables are limited to 300px in height and code blocks to 400px by default; content beyond that scrolls
        // within the container. The statistics cards laid out in tables in the README get clipped, so restore full expansion here.
        tableMaxHeight={0}
        codeBlockMaxHeight={0}
        rehypePlugins={untrusted ? undefined : rehypePlugins}
        components={markdownComponents}
      >
        {trimmedContent}
      </Streamdown>
    </div>
  )
}
