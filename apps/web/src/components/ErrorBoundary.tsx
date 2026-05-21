'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '32px', textAlign: 'center',
          background: 'var(--surface)', borderRadius: '16px',
          border: '1px solid var(--border)', margin: '16px 0',
        }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            حدث خطأ في تحميل هذا القسم
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: '12px', padding: '8px 20px',
              borderRadius: '8px', border: 'none',
              background: '#5120C8', color: '#fff',
              cursor: 'pointer', fontSize: '13px',
            }}>
            إعادة المحاولة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
