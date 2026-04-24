'use client'
interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  onAvatar?: boolean
}

export default function VerifiedBadge({ size = 'sm', showTooltip = true, onAvatar = false }: VerifiedBadgeProps) {
  const sizes = { xs: 16, sm: 20, md: 24, lg: 28 }
  const px = sizes[size]

  return (
    <div
      title={showTooltip ? 'موثق الهوية رسمياً' : undefined}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: '#5120c8',
        border: '2px solid #ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'default',
        boxShadow: '0 2px 8px rgba(81,32,200,0.5)',
        ...(onAvatar ? {
          position: 'absolute',
          bottom: 0,
          right: 0,
        } : {})
      }}
    >
      <svg
        width={px * 0.55}
        height={px * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  )
}