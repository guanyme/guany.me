import type { Root } from 'hast'
import { visit } from 'unist-util-visit'
import { m } from '#/paraglide/messages.js'
import type { Locale } from '#/paraglide/runtime.js'

const customId = /\s*\{#([^}]+)\}\s*$/

function headingParts(text: string) {
  const custom = text.match(customId)
  return {
    text: text.replace(customId, ''),
    id:
      custom?.[1] ??
      text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, ''),
  }
}

export function extractToc(markdown: string) {
  const headings: { level: number; id: string; text: string }[] = []
  let fence: { marker: string; length: number } | undefined

  for (const line of markdown.split('\n')) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (marker) {
      if (!fence) fence = { marker: marker[1][0], length: marker[1].length }
      else if (
        marker[1][0] === fence.marker &&
        marker[1].length >= fence.length &&
        !marker[2].trim()
      ) {
        fence = undefined
      }
      continue
    }

    if (fence) continue
    const heading = line.match(/^(#{2,4})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      const text = heading[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_]/g, '')
      headings.push({ level: heading[1].length, ...headingParts(text) })
    }
  }
  return headings
}

export function rehypeHeadings({ locale }: { locale?: Locale }) {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (!/^h[2-6]$/.test(node.tagName)) return
      let title = ''
      visit(node, 'text', ({ value }) => {
        title += value
      })
      const { id } = headingParts(title.trim())
      if (!id) return

      visit(node, 'text', (text) => {
        text.value = text.value.replace(customId, '')
      })

      node.properties.id = id
      node.properties.className = [
        ...(Array.isArray(node.properties.className) ? node.properties.className : []),
        'group',
      ]
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          'aria-label': m.docs_heading_link({ id }, { locale }),
          className: [
            'ml-2',
            'inline-flex',
            'align-middle',
            'text-sm',
            'text-muted-foreground',
            'opacity-0',
            'transition-opacity',
            'group-hover:opacity-100',
            'focus-visible:opacity-100',
          ],
        },
        children: [{ type: 'text', value: '#' }],
      })
    })
  }
}
