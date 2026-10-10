'use client'

interface ScoreCircleProps {
  percentage: number
  passed?: boolean | null
  size?: number
}

export default function ScoreCircle({ percentage, passed, size = 88 }: ScoreCircleProps) {
  const stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const value = Math.max(0, Math.min(100, percentage))
  const offset = circumference - (value / 100) * circumference

  const color = passed === null || passed === undefined ? '#f59e0b' : passed ? '#10b981' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--surface-2)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>
      <span className="absolute text-lg font-extrabold text-foreground" style={{ color }}>
        {Math.round(value)}%
      </span>
    </div>
  )
}