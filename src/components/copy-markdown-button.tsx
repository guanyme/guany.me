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

export function CopyMarkdownButton({ content, locale, className = '' }: CopyMarkdownButtonProps) {
  const [copied, copy] = useCopy()
  return (
    <Button
      unstyled
      type="button"
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring ${className}`}
      onClick={() => void copy(content)}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span aria-live="polite">
        {copied ? m.copy_copied({}, { locale }) : m.copy_copy_markdown({}, { locale })}
      </span>
    </Button>
  )
}
