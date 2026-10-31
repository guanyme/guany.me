import { DocsSidebar } from '@/components/docs/docs-sidebar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <DocsSidebar />
      <div className="py-8 lg:ml-[17rem]">{children}</div>
    </div>
  )
}
