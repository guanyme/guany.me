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
  const [copied, copy] = useCopy()
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      className={className}
      onClick={() => void copy(content)}
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      <span aria-live="polite">
        {copied ? m.copy_copied({}, { locale }) : m.copy_copy_markdown({}, { locale })}
      </span>
    </Button>
  )
}
