'use client'
import { useEffect } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

interface ToastProps {
  message: string
  show: boolean
  onClose: () => void
  type?: 'success' | 'error'
}

export default function Toast({ message, show, onClose, type = 'success' }: ToastProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 4000)
      return () => clearTimeout(t)
    }
  }, [show, onClose])

  const bg = type === 'error' ? '#dc2626' : '#16a34a'
  const shadow = type === 'error' ? 'rgba(220,38,38,0.35)' : 'rgba(22,163,74,0.35)'
  const Icon = type === 'error' ? XCircle : CheckCircle2

  return (
    <div style={{
      position: 'fixed',
      top: show ? '72px' : '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
      transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: bg,
      color: '#fff',
      padding: '14px 22px',
      borderRadius: '12px',
      boxShadow: `0 8px 32px ${shadow}`,
      fontFamily: 'inherit',
      fontSize: '15px',
      fontWeight: '600',
      minWidth: '280px',
      maxWidth: '480px',
      whiteSpace: 'nowrap',
    }}>
      <Icon size={22} strokeWidth={2.5} />
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#fff', opacity: 0.8, padding: '0', display: 'flex'
      }}>
        <X size={18} />
      </button>
    </div>
  )
}
