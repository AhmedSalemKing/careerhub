'use client'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { useAuthStore } from '../../../../stores/authStore'
import { Award, Download, Shield, BookOpen, Calendar, CheckCircle2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CertificatesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user, hydrate } = useAuthStore()

  useEffect(() => { hydrate() }, [hydrate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      // Get token from storage - check all possible keys
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

      // Handle response: { success: true, data: [...] } or { data: [...] } or [...]
      const certs = json?.data ?? json?.certificates ?? json ?? []
      console.log('[Certificates] Parsed certificates count:', certs.length)
      return certs
    },
    enabled: !!user?.id,
    retry: 1,
  })

  const raw = data?.data ?? data?.certificates ?? data ?? []
  const certificates = Array.isArray(raw) ? raw : []

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0f1221' : '#fafafa',
        padding: '32px 24px 120px',
        direction: 'rtl',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'rgba(81,32,200,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={24} color="#5120c8" />
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: isDark ? '#f1f5f9' : '#0d0d0d',
              margin: 0,
            }}
          >
            شهاداتي
          </h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
          {certificates.length} شهادة مكتسبة
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '280px',
                borderRadius: '16px',
                background: isDark ? '#161929' : '#f0f0f0',
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            background: isDark ? '#161929' : '#ffffff',
            borderRadius: '20px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
          }}
        >
          <p style={{ color: '#ef4444', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            حدث خطأ في تحميل الشهادات
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {error.message || 'يرجى المحاولة مرة أخرى لاحقاً'}
          </p>
        </div>
      ) : certificates.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: isDark ? '#161929' : '#ffffff',
            borderRadius: '20px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
          }}
        >
          <Award size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
          <h3
            style={{
              color: isDark ? '#94a3b8' : '#6b7280',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px',
            }}
          >
            لا توجد شهادات بعد
          </h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            أكمل كورسًا للحصول على شهادتك الأولى
          </p>
          <Link
            href={`https://deveway-teal.vercel.app/ar/courses`}
            style={{
              padding: '12px 28px',
              background: '#5120c8',
              color: '#fff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BookOpen size={18} /> استكشف الكورسات
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {certificates.map((cert: any) => (
            <div
              key={cert.id}
              style={{
                background: isDark ? '#161929' : '#ffffff',
                borderRadius: '20px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow =
                  '0 12px 40px rgba(81,32,200,0.15)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              {/* Preview */}
              <div
                style={{
                  position: 'relative',
                  height: '180px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {cert.certificateUrl ? (
                  <img
                    src={cert.certificateUrl}
                    alt="certificate"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Award size={60} color="rgba(255,255,255,0.5)" />
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#16a34a',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} /> موثقة
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '20px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: isDark ? '#f1f5f9' : '#0d0d0d',
                    margin: '0 0 8px',
                    lineHeight: 1.4,
                  }}
                >
                  {cert.course?.titleAr || cert.course?.titleEn}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#6b7280',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  <Calendar size={14} />
                  {formatDate(cert.issuedAt)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={cert.certificateUrl}
                    download={`certificate-${cert.serialNumber}.png`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      background: '#5120c8',
                      color: '#fff',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    <Download size={15} /> تحميل
                  </a>
                  <a
                    href={`https://deveway-teal.vercel.app/ar/certificate/${cert.serialNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      background: 'transparent',
                      color: '#5120c8',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: '1px solid #5120c8',
                    }}
                  >
                    <Shield size={15} /> تحقق
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
