'use client'

import 'katex/dist/katex.min.css'
import type { PluginConfig } from 'streamdown'
import { createCodePlugin } from '@streamdown/code'
import { createMermaidPlugin } from '@streamdown/mermaid'
import { createMathPlugin } from '@streamdown/math'
import { createCjkPlugin } from '@streamdown/cjk'
import { StreamdownView, type StreamdownRendererProps } from './streamdown-view'

const plugins: PluginConfig = {
  code: createCodePlugin({ themes: ['vitesse-light', 'vitesse-dark'] }),
  mermaid: createMermaidPlugin(),
  math: createMathPlugin(),
  cjk: createCjkPlugin(),
}

export function StreamdownFull(props: StreamdownRendererProps) {
  return <StreamdownView {...props} plugins={plugins} />
}
