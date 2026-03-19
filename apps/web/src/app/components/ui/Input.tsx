'use client'

import * as React from 'react'
import { cn } from './cn'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      {...rest}
      className={cn(
        'h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
        className,
      )}
    />
  )
}

