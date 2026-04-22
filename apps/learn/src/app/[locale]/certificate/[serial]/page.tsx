'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { get } from '../../../../lib/api'
import {
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Award,
  Calendar,
  User,
  BookOpen,
  Shield,
  FileText,
  Share2,
} from 'lucide-react'

interface VerifyResult {
  valid: boolean
  studentName: string
  courseTitle: string
  instructorName: string
  issueDate: string
  verifyCode: string
  certificateUrl: string
}

export default function CertificateVerifyPage() {
  const params = useParams()
  const verifyCode = params.serial as string
  const [cert, setCert] = useState<VerifyResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await get<{ success: boolean; data: VerifyResult }>(
          `/certificates/verify/${verifyCode}`,
        )
        const d = res.data
        if (d?.success && d?.data?.valid) {
          setCert(d.data)
        } else {
          setError('الشهادة غير موجودة أو رمز التحقق غير صحيح')
        }
      } catch {
        setError('حدث خطأ أثناء التحقق')
      } finally {
        setLoading(false)
      }
    }
    if (verifyCode) verify()
  }, [verifyCode])

  const downloadAsPNG = async (url: string) => {
    setDownloading(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `certificate-${verifyCode}.png`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      window.open(url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  const downloadAsPDF = (url: string) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(
      '<html><head><title>Certificate</title>' +
      '<style>* { margin: 0; padding: 0; box-sizing: border-box; } body { background: white; } ' +
      'img { width: 100%; height: auto; display: block; } ' +
      '@media print { body { margin: 0; } img { width: 100vw; } }</style></head>' +
      `<body><img src="${url}" onload="window.print()" /></body></html>`
    )
    win.document.close()
  }

  const shareLink = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: 'شهادة DeveWay', url })
    } else {
      navigator.clipboard?.writeText(url)
      alert('تم نسخ الرابط')
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1221',
        }}
      >
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '3px solid #5120c8',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p>جاري التحقق من الشهادة...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f1221 0%, #1a1040 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        direction: 'rtl',
      }}
    >
      <div style={{ maxWidth: '680px', width: '100%' }}>
        {error ? (
          /* ── INVALID ── */
          <div
            style={{
              background: '#161929',
              borderRadius: '24px',
              padding: '48px',
              textAlign: 'center',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <XCircle size={80} color="#ef4444" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>
              شهادة غير صالحة
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>{error}</p>
          </div>
        ) : cert ? (
          /* ── VALID ── */
          <div>
            {/* Success header */}
            <div
              style={{
                background: 'rgba(22,163,74,0.1)',
                border: '1px solid rgba(22,163,74,0.3)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <CheckCircle2 size={40} color="#16a34a" />
              <div>
                <h2
                  style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}
                >
                  شهادة موثقة وصالحة
                </h2>
                <p style={{ color: '#86efac', margin: '4px 0 0', fontSize: '14px' }}>
                  تم التحقق من صحة هذه الشهادة بنجاح
                </p>
              </div>
            </div>

            {/* Certificate image */}
            {cert.certificateUrl && (
              <div
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  marginBottom: '24px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <img
                  src={cert.certificateUrl}
                  alt="certificate"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            )}

            {/* Details */}
            <div
              style={{
                background: '#161929',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                تفاصيل الشهادة
              </h3>
              {[
                { icon: <User size={18} color="#5120c8" />, label: 'اسم الطالب', value: cert.studentName },
                { icon: <BookOpen size={18} color="#5120c8" />, label: 'الكورس', value: cert.courseTitle },
                { icon: <User size={18} color="#5120c8" />, label: 'المحاضر', value: cert.instructorName },
                {
                  icon: <Calendar size={18} color="#5120c8" />,
                  label: 'تاريخ الإصدار',
                  value: new Date(cert.issueDate).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                },
                { icon: <Shield size={18} color="#5120c8" />, label: 'رمز التحقق', value: cert.verifyCode, mono: true },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 0',
                    borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      background: 'rgba(81,32,200,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>
                      {item.label}
                    </div>
                    <div
                      style={{
                        color: '#f1f5f9',
                        fontSize: '15px',
                        fontWeight: '600',
                        fontFamily: (item as any).mono ? 'monospace' : 'inherit',
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {cert.certificateUrl && (
                <button
                  onClick={() => downloadAsPNG(cert.certificateUrl)}
                  disabled={downloading}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    background: '#5120c8',
                    color: '#fff',
                    borderRadius: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    opacity: downloading ? 0.7 : 1,
                  }}
                >
                  <Download size={18} />
                  {downloading ? 'جاري التحميل...' : 'تحميل PNG'}
                </button>
              )}
              {cert.certificateUrl && (
                <button
                  onClick={() => downloadAsPDF(cert.certificateUrl)}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                  }}
                >
                  <FileText size={18} /> طباعة / PDF
                </button>
              )}
              <button
                onClick={shareLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  background: 'transparent',
                  color: '#fff',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                <Share2 size={18} />
              </button>
              {cert.certificateUrl && (
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    background: 'transparent',
                    color: '#fff',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <ExternalLink size={18} />
                </a>
              )}
            </div>

            {/* Branding */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '24px',
                color: '#4b5563',
                fontSize: '13px',
              }}
            >
              <Award size={16} style={{ display: 'inline', marginLeft: '6px' }} />
              صادرة من منصة DeveWay التعليمية
            </div>
          </div>
        ) : null}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
