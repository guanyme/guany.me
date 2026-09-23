'use client'

import dynamic from 'next/dynamic'
import { StreamdownBasic } from './streamdown-basic'
import type { StreamdownRendererProps } from './streamdown-view'

// The math and mermaid plugins, along with the katex styles, add a hundred or two hundred KB after gzip, and most pages don't need them.
// Check the content first to decide which renderer to use; the unused one won't be included in this page's initial load.
//
// Must use dynamic() in a client component: client components imported by a server component are all counted as page
// dependencies, regardless of which one is actually rendered, so on-demand splitting won't work.
const StreamdownFull = dynamic(() =>
  import('./streamdown-full').then((m) => m.StreamdownFull),
)

// The math plugin only recognizes $$ (singleDollarTextMath is disabled by default), so checking for $$ is enough.
function needsFullRenderer(content: string) {
  return content.includes('$$') || /^\s*(```|~~~)\s*mermaid\b/m.test(content)
}

export function StreamdownRenderer(props: StreamdownRendererProps) {
  return needsFullRenderer(props.content) ? (
    <StreamdownFull {...props} />
  ) : (
    <StreamdownBasic {...props} />
  )
}
