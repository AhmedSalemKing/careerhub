'use client'
import { useState, useEffect } from 'react'

export default function AdminCurrencyToggle() {
  const [market, setMarket] = useState<'SAR' | 'EGP'>('SAR')

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)market=([^;]*)/)?.[1]?.trim()
    setMarket(m === 'EGP' ? 'EGP' : 'SAR')
  }, [])

  const toggle = () => {
    const next = market === 'SAR' ? 'EGP' : 'SAR'
    document.cookie = `market=${next};path=/;max-age=${60 * 60 * 24 * 7};samesite=lax`
    setMarket(next)
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      title={market === 'SAR' ? 'Switch to EGP view' : 'Switch to SAR view'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--foreground)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(81,32,200,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
      {market === 'SAR' ? 'SAR ر.س' : 'EGP ج.م'}
    </button>
  )
}
