import { useEffect, useRef } from 'react'
import { Copy, ExternalLink, X } from 'lucide-react'
import type { LinkSafetyModalProps } from 'streamdown'
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

  useEffect(() => {
    if (isOpen && !dialog.current?.open) dialog.current?.showModal()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      className="fixed m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/50"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ExternalLink className="size-5" />
          {m.link_safety_title({}, { locale })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={m.link_safety_close({}, { locale })}
          className="rounded p-1 hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="mb-4 text-muted-foreground">{m.link_safety_description({}, { locale })}</p>
      <div className="mb-4 rounded bg-muted p-3 text-sm break-all">{url}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(url)}
          className="flex flex-1 items-center justify-center gap-2 rounded border px-4 py-2 hover:bg-muted"
        >
          <Copy className="size-4" />
          {m.link_safety_copy_link({}, { locale })}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex flex-1 items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          <ExternalLink className="size-4" />
          {m.link_safety_open_link({}, { locale })}
        </button>
      </div>
    </dialog>
  )
}
