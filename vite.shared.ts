import tailwindcss from '@tailwindcss/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

export function sitePlugins() {
  return [tailwindcss(), paraglideVitePlugin({ project: './project.inlang' })]
}
