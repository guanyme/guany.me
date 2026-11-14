import 'katex/dist/katex.min.css'
import { createMathPlugin } from '@streamdown/math'
import { createMermaidPlugin } from '@streamdown/mermaid'
import { Streamdown, type StreamdownProps } from 'streamdown'

const math = createMathPlugin()
const mermaid = createMermaidPlugin({ config: { securityLevel: 'strict' } })

export default function MarkdownFull({
  plugins,
  trusted,
  ...props
}: StreamdownProps & { trusted: boolean }) {
  return <Streamdown {...props} plugins={{ ...plugins, math, ...(trusted && { mermaid }) }} />
}
