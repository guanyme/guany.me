import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopy(timeout = 2000): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text: string) => {
      await navigator.clipboard.writeText(text)
      clearTimeout(timer.current)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), timeout)
    },
    [timeout],
  )

  return [copied, copy]
}
