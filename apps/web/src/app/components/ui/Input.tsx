'use client'
import * as React from 'react'
import { cn } from './cn'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => {
  return (
    <input
      ref={ref}
      {...rest}
      className={cn(
        'h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
        className,
      )}
    />
  )
})
Input.displayName = 'Input'