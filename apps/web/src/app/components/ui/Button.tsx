'use client'

import * as React from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

  const styles: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary:
      'border border-[color:var(--border)] bg-[color:var(--surface)] text-foreground hover:bg-[color:var(--surface-2)]',
    ghost: 'bg-transparent text-foreground hover:bg-[color:var(--surface-2)]',
    danger: 'bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger)]/90',
  }

  const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-11 px-4 text-sm rounded-xl',
    lg: 'h-14 px-6 text-base rounded-2xl',
  }

  return <button {...props} className={cn(base, styles[variant], sizes[size], className)} />
}

