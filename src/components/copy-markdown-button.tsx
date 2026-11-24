import { Check, Copy } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages.js'
import { type Locale } from '#/paraglide/runtime.js'
import { useCopy } from '#/lib/use-copy'

interface CopyMarkdownButtonProps {
  content: string
  locale?: Locale
  className?: string
}

export function CopyMarkdownButton({ content, locale, className }: CopyMarkdownButtonProps) {
  const [status, copy] = useCopy()
  const copied = status === 'copied'
  const feedback = copied ? m.copy_copied({}, { locale }) : m.copy_failed({}, { locale })
  return (
    <Button
      variant="outline"
      type="button"
      className={className}
      onClick={() => void copy(content)}
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      <span aria-live="polite">
        {status === 'idle' ? m.copy_copy_markdown({}, { locale }) : feedback}
      </span>
    </Button>
  )
}
