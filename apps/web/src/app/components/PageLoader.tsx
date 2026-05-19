'use client'
import { useEffect, useState } from 'react'

export function PageLoader({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!show) {
      setFading(true)
      const t = setTimeout(() => setVisible(false), 400)
      return () => clearTimeout(t)
    } else {
      setVisible(true)
      setFading(false)
    }
  }, [show])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'var(--background)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Logo — transparent bg, no blend mode */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <img
          src="/logo.png"
          alt="DeveWay"
          style={{
            height: 64,
            width: 'auto',
            objectFit: 'contain',
            background: 'transparent',
          }}
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = 'none'
            const fallback = el.nextElementSibling as HTMLElement
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        {/* Fallback text if image fails */}
        <span
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: 'var(--foreground)',
            letterSpacing: '-0.02em',
          }}
        >
          DeveWay
        </span>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 28,
          color: 'var(--foreground)',
          letterSpacing: '-0.02em',
        }}>
          DeveWay
        </span>
      </div>

      {/* Loading bar */}
      <div style={{
        width: 200,
        height: 3,
        background: 'var(--surface-2)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: '#5120c8',
          borderRadius: 99,
          animation: 'deveway-load 1.6s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <PageLoader show={loading} />
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease 0.1s' }}>
        {children}
      </div>
    </>
  )
}