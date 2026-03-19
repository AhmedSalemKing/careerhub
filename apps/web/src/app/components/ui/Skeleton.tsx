'use client'

import { cn } from './cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[color:var(--surface-2)]', className)} />
}

