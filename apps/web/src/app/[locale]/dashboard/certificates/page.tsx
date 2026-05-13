'use client'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../../stores/authStore'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'

export default function CertificatesPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { user, hydrate } = useAuthStore()

  useEffect(() => { hydrate() }, [hydrate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      const token =
        (typeof window !== 'undefined'
          ? localStorage.getItem('deveway_token') ||
            localStorage.getItem('careerhub_token') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token') ||
            ''
          : '')

      console.log('[Certificates] User:', user?.id, user?.email)
      console.log('[Certificates] Token exists:', !!token)

      const res = await fetch('https://deve-way.onrender.com/api/certificates/my', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        console.error('[Certificates] API error:', res.status, res.statusText)
        throw new Error(`API error: ${res.status}`)
      }

      const json = await res.json()
      console.log('[Certificates] API response:', JSON.stringify(json).slice(0, 300))

      const certs = json?.data ?? json?.certificates ?? json ?? []
      console.log('[Certificates] Parsed certificates count:', certs.length)
      return certs
    },
    enabled: !!user?.id,
    retry: 1,
  })

  const certificates = Array.isArray(data) ? data : []

  const getDownloadUrl = (url: string, filename: string) => {
    if (!url || !url.includes('/upload/')) return url
    const safeName = encodeURIComponent(filename).replace(/%20/g, '_')
    return url.replace('/upload/', `/upload/fl_attachment:${safeName}/`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      padding: '32px 24px 120px',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      {/* PAGE HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 4px', color: '#f1f5f9' }}>
            {isAr ? 'شهاداتي' : 'My Certificates'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem', margin: 0 }}>
            {isAr
              ? `${certificates.length} شهادة مكتسبة`
              : `${certificates.length} certificates earned`}
          </p>
        </div>
        <a href={`/${locale}/dashboard/my-courses`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px', borderRadius: '10px',
            background: 'rgba(81,32,200,0.12)',
            border: '1px solid rgba(81,32,200,0.25)',
            color: '#a78bfa', textDecoration: 'none',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {isAr ? 'كورساتي' : 'My Courses'}
        </a>
      </div>

      {isLoading ? (
        /* LOADING STATE */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              <div style={{ height:'120px', background:'rgba(81,32,200,0.06)',
                animation:'pulse 1.5s infinite' }}/>
              <div style={{ padding:'1.25rem' }}>
                <div style={{ height:'16px', borderRadius:'8px', marginBottom:'8px',
                  background:'rgba(255,255,255,0.06)', width:'70%',
                  animation:'pulse 1.5s infinite' }}/>
                <div style={{ height:'12px', borderRadius:'6px', marginBottom:'1rem',
                  background:'rgba(255,255,255,0.04)', width:'40%',
                  animation:'pulse 1.5s infinite' }}/>
                <div style={{ height:'36px', borderRadius:'9px',
                  background:'rgba(255,255,255,0.04)',
                  animation:'pulse 1.5s infinite' }}/>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* ERROR STATE */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '16px',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', color: '#f1f5f9' }}>
            {isAr ? 'حدث خطأ في تحميل الشهادات' : 'Error loading certificates'}
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
            {isAr ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later'}
          </p>
        </div>
      ) : certificates.length === 0 ? (
        /* EMPTY STATE */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '16px',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'rgba(81,32,200,0.1)',
            border: '1px solid rgba(81,32,200,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="8" r="6"/>
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', color: '#f1f5f9' }}>
            {isAr ? 'لا توجد شهادات بعد' : 'No certificates yet'}
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem',
            maxWidth: '320px', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            {isAr
              ? 'أكمل أي كورس للحصول على شهادتك الأولى'
              : 'Complete any course to earn your first certificate'}
          </p>
          <a href={`/${locale}/courses`}
            style={{
              padding: '10px 24px', borderRadius: '10px',
              background: '#5120c8', color: '#fff',
              textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
            }}>
            {isAr ? 'استعرض الكورسات' : 'Browse Courses'}
          </a>
        </div>
      ) : (
        /* CERTIFICATES GRID */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {certificates.map((cert: any) => (
            <div key={cert.id} style={{
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(81,32,200,0.4)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(81,32,200,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            >
              {/* Certificate preview banner */}
              <div style={{
                height: '120px',
                background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1054 50%, #1a0a2e 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.15,
                  backgroundImage: 'repeating-linear-gradient(45deg, #5120c8 0, #5120c8 1px, transparent 0, transparent 50%)',
                  backgroundSize: '20px 20px',
                }}/>
                <div style={{
                  position: 'relative', zIndex: 1, textAlign: 'center',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'rgba(251,191,36,0.15)',
                    border: '2px solid rgba(251,191,36,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="12" cy="8" r="6"/>
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                    </svg>
                  </div>
                  <p style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.1em', margin: 0 }}>
                    {isAr ? 'شهادة إتمام' : 'CERTIFICATE OF COMPLETION'}
                  </p>
                </div>
              </div>

              {/* Card content */}
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{
                  fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.4,
                  color: '#f1f5f9',
                }}>
                  {isAr
                    ? (cert.course?.titleAr || cert.course?.title)
                    : (cert.course?.titleEn || cert.course?.title)}
                </h3>

                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)',
                  margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {(cert.createdAt || cert.issuedAt)
                    ? new Date(cert.createdAt || cert.issuedAt).toLocaleDateString(
                        isAr ? 'ar-SA' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )
                    : ''}
                </p>

                {/* Verification ID */}
                {(cert.verificationCode || cert.serialNumber) && (
                  <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#666680" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span style={{ fontSize: '0.72rem', color: '#888',
                      fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {cert.verificationCode || cert.serialNumber}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {cert.certificateUrl && (
                    <a
                      href={getDownloadUrl(
                        cert.certificateUrl,
                        `${isAr ? (cert.course?.titleAr || cert.course?.title) : (cert.course?.titleEn || cert.course?.title) || 'certificate'}-${cert.verificationCode || cert.serialNumber}`
                      )}
                      download
                      style={{
                        flex: 1, padding: '9px', borderRadius: '9px',
                        background: '#5120c8', color: '#fff',
                        textDecoration: 'none', textAlign: 'center',
                        fontSize: '0.82rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '6px',
                      }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      {isAr ? 'تحميل الشهادة' : 'Download Certificate'}
                    </a>
                  )}
                  {cert.certificateUrl && (
                    <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '9px 14px', borderRadius: '9px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--muted-foreground)',
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.82rem', fontWeight: 500,
                      }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {isAr ? 'عرض' : 'View'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
