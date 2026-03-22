'use client'

import { DashboardSidebar } from './DashboardSidebar'

export function DashboardShell({
  title,
  subtitle,
  children,
  backHref,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  backHref?: string
}) {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{title}</h1>
            {subtitle ? <p className="text-sm text-[color:var(--muted)]">{subtitle}</p> : null}
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

