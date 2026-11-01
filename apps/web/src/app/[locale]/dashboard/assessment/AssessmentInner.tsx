'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const AIInterviewPage = dynamic(() => import('./AIInterviewPage'), { ssr: false })
const CompassFlow = dynamic(() => import('./compass/CompassFlow').then(m => ({ default: m.CompassFlow })), { ssr: false })

function AssessmentContent() {
  const params = useSearchParams()
  const mode   = params.get('mode') ?? undefined
  const router = useRouter()

  if (mode === 'compass') {
    return <CompassFlow />
  }

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
      padding: '40px 20px 60px',
      background: 'var(--background)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 460 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'color-mix(in srgb, var(--primary) 10%, var(--card))',
          border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px color-mix(in srgb, var(--primary) 12%, transparent)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
          </svg>
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 900, margin: '0 0 12px',
          color: 'var(--foreground)',
          fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
          letterSpacing: '-0.02em', lineHeight: 1.15,
        }}>
          اكتشف مسارك المهني
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted-foreground)', margin: '0 0 6px', fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif', lineHeight: 1.65 }}>
          مع مساعدك الذكي رشيد في DeveWay
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif', lineHeight: 1.65 }}>
          اختر الطريقة التي تناسبك لاكتشاف فرصك المهنية
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16, width: '100%', maxWidth: 760 }}>

        {/* Interview Card */}
        <div style={{
          background: 'var(--card)',
          border: '1.5px solid color-mix(in srgb, var(--primary) 30%, var(--border))',
          borderRadius: 22, padding: '26px 22px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--primary) 7%, transparent)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
              مقابلة مع AI
            </h2>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: 10,
              fontWeight: 500, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--primary)',
              border: '1px solid color-mix(in srgb, var(--primary) 22%, transparent)',
            }}>الأشهر</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.7, flex: 1, fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            حاور مساعدك الذكي في حوار تفاعلي يستكشف اهتماماتك وخبراتك ويقدم توصيات مخصصة.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>المدة التقريبية: 25-30 دقيقة</span>
          </div>
          <button
            onClick={() => router.push('?mode=interview')}
            style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}
          >
            ابدأ المقابلة
          </button>
        </div>

        {/* Quiz Card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 22, padding: '26px 22px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'color-mix(in srgb, var(--foreground) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--foreground) 12%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px', color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            اختبار تفاعلي
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.7, flex: 1, fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            أسئلة ذكية تتكيف مع إجاباتك لتحديد أنسب المسارات المهنية لك بدقة عالية.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>المدة التقريبية: 15-20 دقيقة</span>
          </div>
          <button
            onClick={() => router.push('?mode=quiz')}
            style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontWeight: 300, fontSize: 14, cursor: 'pointer', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}
          >
            ابدأ الاختبار
          </button>
        </div>

        {/* Compass Card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 22, padding: '26px 22px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'color-mix(in srgb, var(--foreground) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--foreground) 12%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
              بوصلة المسار
            </h2>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: 10,
              fontWeight: 500, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
              background: 'color-mix(in srgb, var(--foreground) 8%, transparent)',
              color: 'var(--muted-foreground)',
              border: '1px solid color-mix(in srgb, var(--foreground) 12%, transparent)',
            }}>جديد</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.7, flex: 1, fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            تقييم منهجي متعدد الأبعاد يقيس اهتماماتك ومهاراتك ودوافعك لبناء خارطة طريق دقيقة.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>المدة التقريبية: 20-25 دقيقة</span>
          </div>
          <button
            onClick={() => router.push('?mode=compass')}
            style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontWeight: 300, fontSize: 14, cursor: 'pointer', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}
          >
            ابدأ البوصلة
          </button>
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 300, fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif', maxWidth: 480, textAlign: 'center' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
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
