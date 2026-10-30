'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const AIInterviewPage = dynamic(() => import('./AIInterviewPage'), { ssr: false })

function AssessmentContent() {
  const params = useSearchParams()
  const mode   = params.get('mode') ?? undefined
  const router = useRouter()

  if (mode === 'interview' || mode === 'quiz') {
    return <AIInterviewPage mode={mode} />
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--background)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 10px', color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
          اكتشف مسارك المهني
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted-foreground)', margin: '0 0 4px', fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
          مع مساعدك الذكي في DeveWay
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
          اختر الطريقة التي تناسبك لاكتشاف فرصك المهنية.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, width: '100%', maxWidth: 640 }}>

        {/* Interview Card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 10px', color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            مقابلة مع AI
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.7, flex: 1, fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            حاور مساعدك الذكي في حوار تفاعلي يستكشف اهتماماتك وخبراتك ويقدم توصيات مخصصة.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 300 }}>المدة التقريبية: 25-30 دقيقة</span>
          </div>
          <button
            onClick={() => router.push('?mode=interview')}
            style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4338ca)', color: '#fff', fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}
          >
            ابدأ المقابلة
          </button>
        </div>

        {/* Quiz Card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(43,191,163,0.1)',
            border: '1px solid rgba(43,191,163,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2bbfa3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 10px', color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            اختبار تفاعلي
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.7, flex: 1, fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            أسئلة ذكية تتكيف مع إجاباتك لتحديد أنسب المسارات المهنية لك بدقة عالية.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 300 }}>المدة التقريبية: 15-20 دقيقة</span>
          </div>
          <button
            onClick={() => router.push('?mode=quiz')}
            style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontWeight: 300, fontSize: 14, cursor: 'pointer', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}
          >
            ابدأ الاختبار
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 300 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        التوصيات مبنية على المعلومات التي تشاركها معنا، وهي إرشاد مهني وليست ضماناً لوظيفة معينة.
      </div>
    </div>
  )
}

export function AssessmentInner() {
  return (
    <Suspense fallback={null}>
      <AssessmentContent />
    </Suspense>
  )
}
