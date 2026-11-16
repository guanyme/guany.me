import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { sitePlugins } from './vite.shared.ts'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    ...sitePlugins(),
    tanstackStart(),
    nitro({
      preset: 'node-server',
      publicAssets: [{ dir: 'public', ignore: ['public/_headers'] }],
      routeRules: {
        '/.well-known/security.txt': { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
      },
    }),
    viteReact(),
  ],
})
