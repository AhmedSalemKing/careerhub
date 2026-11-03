'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useLocale } from 'next-intl'

/** Floating assistant button. The assistant is not available in the learn app yet. */
export default function AiComingSoonButton() {
  const locale = useLocale()
  const [showTip, setShowTip] = useState(false)
  const label = locale === 'ar' ? 'المساعد الذكي' : 'AI assistant'

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 50 }}>
      {showTip && (
        <div
          role="status"
          style={{
            position: 'absolute', bottom: 56, left: 0, background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 400, color: 'var(--foreground)', whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--foreground) 15%, transparent)',
          }}
        >
          {locale === 'ar' ? 'سيتم تطويره قريباً' : 'Coming soon'}
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowTip((v) => !v)}
        onBlur={() => setTimeout(() => setShowTip(false), 200)}
        aria-label={label}
        title={label}
        style={{
          width: 48, height: 48, borderRadius: 14, background: 'var(--primary)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px color-mix(in srgb, var(--primary) 30%, transparent)',
        }}
      >
        <Sparkles size={20} color="#fff" />
      </button>
    </div>
  )
}
