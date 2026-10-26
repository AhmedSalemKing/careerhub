'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCurrencyToggle() {
  const router = useRouter()
  const [market, setMarket] = useState<'EGP' | 'SAR'>('SAR')

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)market=([^;]*)/)?.[1]?.trim()
    setMarket(m === 'EGP' ? 'EGP' : 'SAR')
  }, [])

  const toggle = (next: 'EGP' | 'SAR') => {
    document.cookie = `market=${next};path=/;max-age=${60 * 60 * 24 * 7};samesite=lax`
    setMarket(next)
    window.dispatchEvent(new Event('marketchange'))
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {(['SAR', 'EGP'] as const).map((m) => (
        <button
          key={m}
          onClick={() => toggle(m)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: market === m ? 'var(--primary)' : 'transparent',
            color: market === m ? '#fff' : 'var(--foreground)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
        >
          {m === 'EGP' ? 'ج.م' : 'ر.س'}
        </button>
      ))}
    </div>
  )
}
