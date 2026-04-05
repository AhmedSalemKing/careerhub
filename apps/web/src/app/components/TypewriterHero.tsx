'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface TypewriterHeroProps {
  text?: string
  color?: string
  className?: string
  speed?: number
  cursorHideDelay?: number
  glow?: boolean
  glowIntensity?: number
}

export function TypewriterHero({
  text = 'DeveWay',
  color = '#5120c8',
  className = '',
  speed = 120,
  cursorHideDelay = 2200,
  glow = true,
  glowIntensity = 0.35,
}: TypewriterHeroProps) {
  const [displayed, setDisplayed] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const aliveRef = useRef(true)

  const cleanup = useCallback(() => {
    aliveRef.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  useEffect(() => {
    aliveRef.current = true
    indexRef.current = 0
    setDisplayed('')
    setCursorVisible(true)

    if (!text) { cleanup(); return }

    const type = () => {
      if (!aliveRef.current) return
      const i = indexRef.current

      if (i < text.length) {
        const firstCharDelay = i === 0 ? 200 : 0
        const char = text[i]
        const isUppercase = char === char.toUpperCase() && char !== char.toLowerCase()
        const jitter = (Math.random() - 0.4) * 60
        const uppercaseBonus = isUppercase ? 30 : 0

        timerRef.current = setTimeout(() => {
          if (!aliveRef.current) return
          indexRef.current++
          setDisplayed(text.slice(0, indexRef.current))
          type()
        }, speed + firstCharDelay + jitter + uppercaseBonus)
      } else {
        timerRef.current = setTimeout(() => {
          if (!aliveRef.current) return
          setCursorVisible(false)
        }, cursorHideDelay)
      }
    }

    timerRef.current = setTimeout(type, 400)
    return cleanup
  }, [text, speed, cursorHideDelay, cleanup])

  const glowOpacity = glow
    ? Math.min(indexRef.current / text.length, 1) * glowIntensity
    : 0
  const glowColor = color + Math.round(glowOpacity * 255).toString(16).padStart(2, '0')

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        style={{
          fontFamily: "'28DaysLater', sans-serif",
          color: color,
          display: 'inline-block',
          minWidth: '200px',
          letterSpacing: '0.02em',
          lineHeight: 1.1,
          textShadow: glow
            ? `0 0 20px ${glowColor}, 0 0 40px ${color}10`
            : 'none',
          transition: 'text-shadow 0.3s ease',
        }}
      >
        {displayed}
        {cursorVisible && (
          <span
            style={{
              display: 'inline-block',
              width: 3,
              height: '0.85em',
              background: `linear-gradient(180deg, ${color}, ${color}88)`,
              marginLeft: 3,
              verticalAlign: 'middle',
              borderRadius: '2px',
              animation: 'dw-blink 0.7s step-end infinite',
              boxShadow: `0 0 6px ${color}60`,
            }}
          />
        )}
      </span>

      <style>{`
        @keyframes dw-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </span>
  )
}