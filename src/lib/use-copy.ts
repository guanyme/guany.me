import { useCallback, useEffect, useRef, useState } from 'react'

type CopyStatus = 'idle' | 'copied' | 'error'

export function useCopy(timeout = 2000): [CopyStatus, (text: string) => Promise<void>] {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        clearTimeout(timer.current)
        setStatus('copied')
        timer.current = setTimeout(() => setStatus('idle'), timeout)
      } catch {
        clearTimeout(timer.current)
        setStatus('error')
      }
    },
    [timeout],
  )

  return [status, copy]
}
