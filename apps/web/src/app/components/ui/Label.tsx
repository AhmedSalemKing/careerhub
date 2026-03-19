'use client'

import * as React from 'react'
import { cn } from './cn'

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { className, ...rest } = props
  return <label {...rest} className={cn('text-sm font-semibold text-foreground', className)} />
}

