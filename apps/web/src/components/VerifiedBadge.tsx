'use client'
interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export default function VerifiedBadge({ size = 'md', showTooltip = true }: VerifiedBadgeProps) {
  const sizes = { sm: 14, md: 18, lg: 22 }
  const px = sizes[size]
  
  return (
    <div
      title={showTooltip ? 'موثق الهوية رسميا' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: px, height: px, borderRadius: '50%',
        background: 'linear-gradient(135deg, #5120c8 0%, #2BBFA3 100%)',
        flexShrink: 0, cursor: 'default',
        boxShadow: '0 2px 8px rgba(81,32,200,0.4)',
      }}
    >
      <svg width={px * 0.6} height={px * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  )
}