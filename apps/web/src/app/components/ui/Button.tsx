'use client'

import * as React from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    'inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

  const styles: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary:
      'border border-[color:var(--border)] bg-[color:var(--surface)] text-foreground hover:bg-[color:var(--surface-2)]',
    ghost: 'bg-transparent text-foreground hover:bg-[color:var(--surface-2)]',
    danger: 'bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger)]/90',
  }

  return <button {...props} className={cn(base, styles[variant], className)} />
}

