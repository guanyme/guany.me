import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// 解析 {#custom-id} 语法，返回 [显示文本, 自定义ID | null]
export const customIdRegex = /\s*\{#([^}]+)\}\s*$/

function getTextContent(node: Element): string {
  let text = ''
  visit(node, 'text', (textNode: { value: string }) => {
    text += textNode.value
  })
  return text.trim()
}

// 从节点中移除 {#id} 文本
function removeCustomIdText(node: Element) {
  visit(node, 'text', (textNode: { value: string }) => {
    textNode.value = textNode.value.replace(customIdRegex, '')
  })
}

export function rehypeCustomSlug() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const match = node.tagName.match(/^h([2-6])$/)
      if (!match) return

      const text = getTextContent(node)

      // 检查是否有自定义 ID
      const customMatch = text.match(customIdRegex)
      let id: string
      if (customMatch) {
        id = customMatch[1]
        removeCustomIdText(node)
      } else {
        id = slugify(text)
      }

      node.properties = node.properties || {}
      node.properties.id = id
      node.properties.className = [
        ...(Array.isArray(node.properties.className)
          ? node.properties.className
          : []),
        'group',
      ]

      // 在标题末尾追加锚点。放在 AST 层而不是用自定义 React 组件：
      // streamdown 的标题样式（字号、字重、间距）写在它自己的组件内部，
      // 不通过 props 传出，一旦用自定义组件替换渲染就会全部丢失，标题会
      // 退化成和正文一样的 16px/400。
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          'data-heading-anchor': '',
          'aria-label': `Link to ${id}`,
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
