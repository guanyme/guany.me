import { lazy, Suspense, useMemo, useState, type ComponentProps } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { createClientOnlyFn } from '@tanstack/react-start'
import { createCodePlugin } from '@streamdown/code'
import { createCjkPlugin } from '@streamdown/cjk'
import { useTheme } from 'next-themes'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import {
  Streamdown,
  defaultComponents,
  defaultUrlTransform,
  type StreamdownProps,
} from 'streamdown'
import { publicMarkdownUrl } from '#/lib/remote-markdown'
import { m } from '#/paraglide/messages.js'
import { localizeHref, type Locale } from '#/paraglide/runtime.js'
import { MarkdownLinkDialog } from './markdown-link-dialog'
import { rehypeHeadings } from './headings'

const loadFullRenderer = createClientOnlyFn(() => import('./markdown-full'))
const FullRenderer = lazy(loadFullRenderer)

const basicPlugins = {
  code: createCodePlugin({ themes: ['vitesse-light', 'vitesse-dark'] }),
  cjk: createCjkPlugin(),
}

interface MarkdownViewProps {
  children: string
  trusted?: boolean
  repositoryReadme?: boolean
  baseUrl?: string
  locale?: Locale
  className?: string
}

function MarkdownAnchor({
  node: _node,
  className,
  locale,
  ...props
}: ComponentProps<typeof defaultComponents.a> & { locale?: Locale }) {
  const { href } = props
  const [confirming, setConfirming] = useState(false)
  const external = href && /^(https?:|\/\/)/i.test(href)
  const headingAnchor = !!props['aria-label'] && href?.startsWith('#')

  return (
    <>
      <a
        {...props}
        className={
          headingAnchor
            ? className
            : `font-medium wrap-anywhere text-primary underline ${className ?? ''}`
        }
        onClick={
          external
            ? (event) => {
                if (event.target instanceof Element && event.target.closest('button')) {
                  event.preventDefault()
                  return
                }
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return
                event.preventDefault()
                setConfirming(true)
              }
            : undefined
        }
      />
      {external && confirming && (
        <MarkdownLinkDialog
          isOpen
          url={href}
          locale={locale}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            window.open(href, '_blank', 'noopener,noreferrer')
            setConfirming(false)
          }}
        />
      )}
    </>
  )
}

const readmeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      ['className', 'block', 'hidden', 'dark:hidden', 'dark:block'],
    ],
  },
}

const localizedPaths = /^\/(?:docs|projects|uses|md)(?:[/?#]|$)/

export function MarkdownView({
  children,
  trusted = false,
  repositoryReadme = false,
  baseUrl,
  locale,
  className,
}: MarkdownViewProps) {
  const { resolvedTheme } = useTheme()
  const rehypePlugins = useMemo<StreamdownProps['rehypePlugins']>(() => {
    if (trusted) return [rehypeRaw, rehypeUnwrapImages, [rehypeHeadings, { locale }]]
    if (repositoryReadme) {
      return [
        rehypeRaw,
        [rehypeSanitize, readmeSchema],
        rehypeUnwrapImages,
        [rehypeHeadings, { locale }],
      ]
    }
    if (baseUrl) return [rehypeSanitize]
  }, [trusted, repositoryReadme, baseUrl, locale])

  const components = useMemo(
    () => ({
      a: (props: ComponentProps<typeof defaultComponents.a>) => (
        <MarkdownAnchor {...props} locale={locale} />
      ),
    }),
    [locale],
  )

  const props: StreamdownProps = {
    children,
    className,
    mode: 'static',
    shikiTheme: ['vitesse-light', 'vitesse-dark'],
    tableMaxHeight: 0,
    codeBlockMaxHeight: 0,
    mermaid: { config: { theme: resolvedTheme === 'dark' ? 'dark' : 'default' } },
    skipHtml: !trusted && !repositoryReadme,
    rehypePlugins,
    components,
    translations: {
      close: m.link_safety_close({}, { locale }),
      copied: m.copy_copied({}, { locale }),
      copyCode: m.markdown_copy_code({}, { locale }),
      copyLink: m.link_safety_copy_link({}, { locale }),
      downloadFile: m.markdown_download_file({}, { locale }),
      downloadImage: m.markdown_download_image({}, { locale }),
      openLink: m.link_safety_open_link({}, { locale }),
    },
    urlTransform: (url, key, node) => {
      if (url.startsWith('#')) return url
      let resolved = url
      if (baseUrl) {
        try {
          const target = new URL(url, baseUrl)
          if (key === 'href' && /\.mdx?$/i.test(target.pathname)) {
            const allowed = publicMarkdownUrl(target.href)
            if (allowed) {
              const hash = allowed.hash
              allowed.hash = ''
              const preview = `/md?${new URLSearchParams({ url: allowed.href })}${hash}`
              return localizeHref(preview, { locale })
            }
          }
          resolved = target.href
        } catch {
          return
        }
      } else if (locale && key === 'href' && localizedPaths.test(url)) {
        resolved = localizeHref(url, { locale })
      }

      return defaultUrlTransform(resolved, key, node)
    },
  }

  const basic = <Streamdown {...props} plugins={basicPlugins} />
  if (!children.includes('$$') && !/^\s*(?:`{3,}|~{3,})\s*mermaid\b/m.test(children)) return basic

  return (
    <ClientOnly fallback={basic}>
      <Suspense fallback={basic}>
        <FullRenderer {...props} plugins={basicPlugins} trusted={trusted} />
      </Suspense>
    </ClientOnly>
  )
}
