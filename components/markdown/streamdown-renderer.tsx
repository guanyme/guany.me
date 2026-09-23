'use client'

import dynamic from 'next/dynamic'
import { StreamdownBasic } from './streamdown-basic'
import type { StreamdownRendererProps } from './streamdown-view'

// math 和 mermaid 插件连同 katex 样式，gzip 后有一两百 KB，而大部分页面用不到。
// 看一眼内容再决定用哪个渲染器，没用到的那一套就不会进这个页面的首屏。
//
// 必须在客户端组件里用 dynamic()：服务端组件导入的客户端组件会全部算进页面
// 的依赖，不管实际渲染了哪一个，按需拆分不会生效。
const StreamdownFull = dynamic(() =>
  import('./streamdown-full').then((m) => m.StreamdownFull),
)

// math 插件只认 $$（singleDollarTextMath 默认关闭），所以检测 $$ 就够了。
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
