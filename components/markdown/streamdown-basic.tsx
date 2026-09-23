'use client'

import type { PluginConfig } from 'streamdown'
import { createCodePlugin } from '@streamdown/code'
import { createCjkPlugin } from '@streamdown/cjk'
import { StreamdownView, type StreamdownRendererProps } from './streamdown-view'

const plugins: PluginConfig = {
  code: createCodePlugin({ themes: ['vitesse-light', 'vitesse-dark'] }),
  cjk: createCjkPlugin(),
}

export function StreamdownBasic(props: StreamdownRendererProps) {
  return <StreamdownView {...props} plugins={plugins} />
}
