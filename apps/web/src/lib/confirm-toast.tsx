import toast from 'react-hot-toast'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  confirmColor?: string
  onConfirm: () => void
}

export function confirmToast(options: ConfirmOptions) {
  const { title, message, confirmLabel, cancelLabel, confirmColor = '#dc2626', onConfirm } = options

  toast.custom((t: any) => (
    <div style={{
      minWidth: 260,
      padding: '12px 16px',
      borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      background: '#1c1c1e',
      border: '1px solid #38383a',
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#f5f5f7', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#98989d', marginBottom: 12 }}>{message}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => { toast.dismiss(t.id); onConfirm() }}
          style={{
            flex: 1, padding: '8px', borderRadius: 8, background: confirmColor,
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{
            flex: 1, padding: '8px', borderRadius: 8, background: '#2c2c2e',
            color: '#f5f5f7', border: '1px solid #38383a', cursor: 'pointer', fontSize: 13,
          }}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  ), { duration: 30000, style: { padding: 0, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } })
}
