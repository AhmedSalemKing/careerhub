'use client'
import { useState, useEffect } from 'react'

interface TypewriterHeroProps {
  text?: string
  color?: string
  className?: string
}

export function TypewriterHero({
  text = 'DeveWay',
  color = 'var(--primary)',
  className = '',
}: TypewriterHeroProps) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setDone(true)
        setTimeout(() => setShowCursor(false), 2000)
      }
    }, 120)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span className={className}>
      <style>{`
        @keyframes dw-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
      <span
        style={{
          fontFamily: "'28DaysLater', sans-serif",
          color: color,
          display: 'inline-block',
          minWidth: '200px',
          letterSpacing: '0.02em',
          lineHeight: 1.1,
        }}
      >
        {displayed}
        {showCursor && (
          <span
            style={{
              display: 'inline-block',
              width: 3,
              height: '0.85em',
              background: color,
              marginLeft: 3,
              verticalAlign: 'middle',
              animation: 'dw-blink 0.7s step-end infinite',
            }}
          />
        )}
      </span>
    </span>
  )
}