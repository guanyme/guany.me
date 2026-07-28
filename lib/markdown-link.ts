/** In-site markdown links: same-tab navigation, no external-link modal. */
export function isInternalMarkdownLink(url: string): boolean {
  if (url.startsWith('/') || url.startsWith('#')) return true
  if (!url.startsWith('//') && !/^[a-z][a-z0-9+.-]*:/i.test(url)) return true
  return false
}
