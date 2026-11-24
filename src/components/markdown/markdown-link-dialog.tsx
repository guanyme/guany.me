import { useEffect, useId, useRef } from 'react'
import { Copy, ExternalLink, X } from 'lucide-react'
import type { LinkSafetyModalProps } from 'streamdown'
import { Button } from '#/components/ui/button'
import { useCopy } from '#/lib/use-copy'
import { m } from '#/paraglide/messages.js'
import type { Locale } from '#/paraglide/runtime.js'

export function MarkdownLinkDialog({
  isOpen,
  onClose,
  onConfirm,
  url,
  locale,
}: LinkSafetyModalProps & {
  locale?: Locale
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const [status, copy] = useCopy()

  useEffect(() => {
    if (isOpen && !dialog.current?.open) dialog.current?.showModal()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      className="fixed m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/50"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold">
          <ExternalLink className="size-5" />
          {m.link_safety_title({}, { locale })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={m.link_safety_close({}, { locale })}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      <p id={descriptionId} className="mb-4 text-muted-foreground">
        {m.link_safety_description({}, { locale })}
      </p>
      <div className="mb-4 rounded bg-muted p-3 text-sm break-all">{url}</div>
      <div className="flex gap-2">
        <Button variant="outline" type="button" onClick={() => void copy(url)} className="flex-1">
          <Copy data-icon="inline-start" />
          {m.link_safety_copy_link({}, { locale })}
        </Button>
        <Button
          type="button"
          onClick={() => {
            dialog.current?.close()
            onConfirm()
          }}
          className="flex-1"
        >
          <ExternalLink data-icon="inline-start" />
          {m.link_safety_open_link({}, { locale })}
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground [&:not(:empty)]:mt-3">
        {status === 'copied' && m.copy_copied({}, { locale })}
        {status === 'error' && m.copy_failed({}, { locale })}
      </p>
    </dialog>
  )
}
