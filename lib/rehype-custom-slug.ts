import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Parse the {#custom-id} syntax and return [display text, custom ID | null]
export const customIdRegex = /\s*\{#([^}]+)\}\s*$/

function getTextContent(node: Element): string {
  let text = ''
  visit(node, 'text', (textNode: { value: string }) => {
    text += textNode.value
  })
  return text.trim()
}

// Remove the {#id} text from the node
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

      // Check whether a custom ID is present
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

      // Append an anchor to the end of the heading. Do this at the AST layer rather than using a custom React component:
      // streamdown's heading styles (font size, weight, spacing) are defined inside its own component,
      // not exposed through props. Replacing the renderer with a custom component would make all of them disappear, and the heading would
      // default to the same 16px/400 as the body text.
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
