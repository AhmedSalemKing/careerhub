'use client'
import { CheckCircle2 } from 'lucide-react'

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export default function VerifiedBadge({ size = 'sm', showTooltip = true }: VerifiedBadgeProps) {
  const sizes: Record<string, number> = { xs: 14, sm: 16, md: 20, lg: 24 }
  const px = sizes[size] || 16

  return (
    <div
      title={showTooltip ? 'موثق الهوية رسمياً' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'default',
      }}
    >
      <CheckCircle2
        size={px}
        style={{
          color: '#5120c8',
          fill: 'rgba(81,32,200,0.12)',
          strokeWidth: 2.5,
        }}
      />
    </div>
  )
}