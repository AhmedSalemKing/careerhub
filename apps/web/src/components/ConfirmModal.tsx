'use client'
import { useEffect } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen, title, message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  confirmDestructive = false,
  onConfirm, onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card, #12121f)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: confirmDestructive
            ? 'rgba(239,68,68,0.12)' : 'rgba(81,32,200,0.12)',
          border: `1px solid ${confirmDestructive
            ? 'rgba(239,68,68,0.3)' : 'rgba(81,32,200,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
        }}>
          {confirmDestructive ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#f87171" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        <h3 style={{
          fontSize: '1.1rem', fontWeight: 700,
          margin: '0 0 8px', color: 'var(--foreground)',
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '0.9rem', color: 'var(--muted-foreground)',
          margin: '0 0 1.75rem', lineHeight: 1.6,
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--muted-foreground)',
              fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: confirmDestructive ? '#ef4444' : '#5120c8',
              border: 'none',
              color: '#fff',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: confirmDestructive
                ? '0 4px 12px rgba(239,68,68,0.3)'
                : '0 4px 12px rgba(81,32,200,0.3)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
