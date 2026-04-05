'use client'

// AdminShell is now a thin wrapper — the sidebar/layout is handled by
// apps/web/src/app/[locale]/admin/layout.tsx

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

