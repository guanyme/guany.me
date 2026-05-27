'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { THEME_COLOR } from '@/lib/site'

export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) return
    const color = resolvedTheme === 'dark' ? THEME_COLOR.dark : THEME_COLOR.light
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = color
  }, [resolvedTheme])

  return null
}
