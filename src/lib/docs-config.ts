import { m } from '#/paraglide/messages.js'
import type { Locale } from '#/paraglide/runtime.js'

export interface DocItem {
  titleKey: string
  slug: string
}

export interface DocGroup {
  titleKey: string
  items: DocItem[]
}

export const docsIndexSlug = 'getting-started'

export const docsConfig: DocGroup[] = [
  {
    titleKey: 'guide',
    items: [{ titleKey: 'introduction', slug: docsIndexSlug }],
  },
  {
    titleKey: 'environment',
    items: [
      { titleKey: 'macOS', slug: 'macos' },
      { titleKey: 'Linux', slug: 'linux' },
      { titleKey: 'Ubuntu', slug: 'ubuntu' },
      { titleKey: 'Windows', slug: 'windows' },
      { titleKey: 'WSL', slug: 'wsl' },
      { titleKey: 'Surge', slug: 'surge' },
      { titleKey: 'Zsh', slug: 'zsh' },
      { titleKey: 'PowerShell', slug: 'powershell' },
      { titleKey: 'Herdr', slug: 'herdr' },
      { titleKey: 'Ghostty', slug: 'ghostty' },
      { titleKey: 'Warp', slug: 'warp' },
      { titleKey: 'Windows Terminal', slug: 'windows-terminal' },
      { titleKey: 'VS Code', slug: 'vscode' },
      { titleKey: 'Git', slug: 'git' },
      { titleKey: 'SSH', slug: 'ssh' },
      { titleKey: 'Docker', slug: 'docker' },
      { titleKey: 'mise', slug: 'mise' },
      { titleKey: 'fnm', slug: 'fnm' },
      { titleKey: 'ni', slug: 'ni' },
      { titleKey: 'Vite+', slug: 'viteplus' },
      { titleKey: 'Codex', slug: 'codex' },
      { titleKey: 'Claude Code', slug: 'claude-code' },
      { titleKey: 'Grok', slug: 'grok' },
      { titleKey: 'fastfetch', slug: 'fastfetch' },
      { titleKey: 'Raycast', slug: 'raycast' },
      { titleKey: 'ZeroTier', slug: 'zerotier' },
      { titleKey: 'Ollama', slug: 'ollama' },
    ],
  },
]

export function getDocNavigation(slug: string) {
  const flatItems = docsConfig.flatMap((group) => group.items)
  const index = flatItems.findIndex((item) => item.slug === slug)

  if (index === -1) return { prev: null, next: null }

  return {
    prev: index > 0 ? flatItems[index - 1] : null,
    next: index < flatItems.length - 1 ? flatItems[index + 1] : null,
  }
}

export function docItemTitle(item: DocItem, locale: Locale) {
  if (item.titleKey === 'introduction') return m.docs_introduction({}, { locale })
  if (item.titleKey === 'Vite+') return m.docs_vite_plus({}, { locale })
  return item.titleKey
}
