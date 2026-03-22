'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default'

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'default' | 'sm' | 'lg'; asChild?: boolean }) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

  const sizes: Record<'default' | 'sm' | 'lg', string> = {
    default: 'h-11 px-4',
    sm: 'h-9 px-3 text-xs',
    lg: 'h-12 px-6 text-base',
  }

  const styles: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary:
      'border border-[color:var(--border)] bg-[color:var(--surface)] text-foreground hover:bg-[color:var(--surface-2)]',
    ghost: 'bg-transparent text-foreground hover:bg-[color:var(--surface-2)]',
    danger: 'bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger)]/90',
    outline: 'border border-[color:var(--border)] bg-transparent text-foreground hover:bg-[color:var(--surface-2)]',
    default: 'bg-primary text-white hover:bg-primary/90',
  }

  const Comp = asChild ? Slot : 'button'
  return <Comp {...props} className={cn(base, sizes[size], styles[variant], className)} />
}
