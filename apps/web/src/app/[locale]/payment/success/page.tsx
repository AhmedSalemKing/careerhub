'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Video, Radio, MapPin, Calendar, ArrowRight, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()

  const sessionId = searchParams.get('session_id')
  const type = searchParams.get('type') || 'course'
  const courseId = searchParams.get('courseId')
  const courseType = searchParams.get('courseType') || 'recorded'
  const consultingSessionId = searchParams.get('sessionId')

  const [countdown, setCountdown] = useState(5)
  const [redirecting, setRedirecting] = useState(false)

  const bg = 'var(--background)'
  const cardBg = 'var(--card)'
  const border = 'var(--border)'
  const text = 'var(--foreground)'
  const subtext = 'var(--muted)'

  const learnBase = 'https://devewayhub.vercel.app'

  const getRedirectUrl = () => {
    if (type === 'consulting') {
      return `/${locale}/dashboard/my-sessions`
    }
    if (courseType === 'live') return `${learnBase}/${locale}/live/${courseId}`
    if (courseType === 'offline') return `${learnBase}/${locale}/courses/${courseId}`
    return `${learnBase}/${locale}/learn/${courseId}`
  }

  const getTypeConfig = () => {
    if (type === 'consulting') return { icon: Calendar, color: '#5120c8', ar: 'جلسة استشارية', en: 'Consulting Session' }
    if (courseType === 'live') return { icon: Radio, color: '#dc2626', ar: 'بث مباشر', en: 'Live Session' }
    if (courseType === 'offline') return { icon: MapPin, color: '#16a34a', ar: 'مقر فعلي', en: 'Physical Course' }
    return { icon: Video, color: '#5120c8', ar: 'كورس مسجل', en: 'Recorded Course' }
  }

  const config = getTypeConfig()
  const Icon = config.icon
  const redirectUrl = getRedirectUrl()

  useEffect(() => {
    // Best-effort cross-domain hint — works if both domains share a parent
    if (type !== 'consulting' && courseId) {
      try { localStorage.setItem('enrollment_updated', Date.now().toString()) } catch(_) {}
    }

    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          setRedirecting(true)
          if (type === 'consulting') {
            router.push(redirectUrl)
          } else {
            // redirectUrl already includes enrolled param for cache invalidation
            window.location.href = redirectUrl
          }
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>

        {/* Success icon */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <CheckCircle2 size={48} color="#16a34a" />
          </div>
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: '50%', background: cardBg, border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={config.color} />
          </div>
        </div>

        {/* Title */}
        <h1 style={{ color: text, fontSize: 26, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {isAr ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
        </h1>
        <p style={{ color: subtext, fontSize: 14, margin: '0 0 28px', lineHeight: 1.7 }}>
          {type === 'consulting'
            ? (isAr ? 'تم تأكيد جلستك الاستشارية. ستتلقى إشعارا عند إضافة رابط الاجتماع.' : 'Your consulting session is confirmed. You will be notified when the meeting link is added.')
            : courseType === 'live'
              ? (isAr ? 'تم تأكيد اشتراكك. يمكنك الانضمام للبث المباشر الآن.' : 'Enrollment confirmed. You can join the live stream now.')
              : courseType === 'offline'
                ? (isAr ? 'تم حجز مقعدك بنجاح. تحقق من بريدك الإلكتروني للتفاصيل.' : 'Your seat is booked! Check your email for details.')
                : (isAr ? 'تم تأكيد اشتراكك. يمكنك البدء بالتعلم فورا.' : 'Enrollment confirmed. You can start learning now.')}
        </p>

        {/* Type badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: `${config.color}10`, border: `1px solid ${config.color}25`, marginBottom: 28 }}>
          <Icon size={14} color={config.color} />
          <span style={{ color: config.color, fontSize: 13, fontWeight: 700 }}>{isAr ? config.ar : config.en}</span>
        </div>

        {/* Card */}
        <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
              {isAr ? 'تم التأكيد' : 'Confirmed'}
            </span>
          </div>
          <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
            {isAr
              ? `سيتم تحويلك تلقائيا خلال ${countdown} ثواني...`
              : `Redirecting automatically in ${countdown} seconds...`}
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!redirecting ? (
            <button
              onClick={() => {
                setRedirecting(true)
                if (type === 'consulting') router.push(redirectUrl)
                else window.location.href = redirectUrl
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 12, background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              {type === 'consulting'
                ? (isAr ? 'عرض جلساتي' : 'View My Sessions')
                : courseType === 'live'
                  ? (isAr ? 'انضم للبث الآن' : 'Join Live Now')
                  : (isAr ? 'ابدأ التعلم' : 'Start Learning')}
              <ArrowRight size={15} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: subtext, fontSize: 13 }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              {isAr ? 'جاري التحويل...' : 'Redirecting...'}
            </div>
          )}

          <button onClick={() => router.push(`/${locale}/dashboard`)} style={{ padding: '12px 24px', borderRadius: 12, background: 'transparent', color: subtext, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {isAr ? 'الداشبورد' : 'Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}
