'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import toast from 'react-hot-toast'
import {
  Video, Radio, MapPin, Search, X, Clock, Users,
  Calendar, Play, ChevronRight, Wifi, WifiOff,
  Star, BookOpen, Lock, CheckCircle2, AlertCircle,
  DollarSign, Navigation
} from 'lucide-react'

const PRODUCTION_API_URL = 'https://deve-way.onrender.com/api'

const API_BASE = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  const url = (envUrl && envUrl.trim()) ? envUrl : PRODUCTION_API_URL
  const cleaned = url.replace(/\/+$/, '')
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
})()

const TABS = [
  { key: 'recorded', ar: 'كورسات مسجلة', en: 'Recorded Courses', icon: Video, color: '#5120c8' },
  { key: 'live', ar: 'بث مباشر', en: 'Live Sessions', icon: Radio, color: '#dc2626' },
  { key: 'offline', ar: 'مقرات فعلية', en: 'Physical Locations', icon: MapPin, color: '#16a34a' },
]

function getTitle(c: any, locale: string) {
  if (locale === 'ar') return c.titleAr || c.titleEn || c.title || 'Untitled'
  return c.titleEn || c.titleAr || c.title || 'Untitled'
}

// Helper function to redirect to Stripe Checkout
const redirectToCheckout = async (courseId: string, locale: string, token: string) => {
  try {
    const res = await fetch(`https://deve-way.onrender.com/api/payments/checkout/course/${courseId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locale })
    })
    const data = await res.json()
    if (data?.data?.url) {
      window.location.href = data.data.url // Stripe Checkout page
    } else {
      throw new Error(data.message || 'Failed to create checkout')
    }
  } catch(e: any) {
    console.error('[Checkout]', e)
    alert(e.message || (locale === 'ar' ? 'حدث خطأ في الدفع' : 'Payment error'))
  }
}

export default function CoursesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'recorded' | 'live' | 'offline'>('recorded')
  const [search, setSearch] = useState('')
  const [token, setToken] = useState('')

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  useEffect(() => {
    const t = localStorage.getItem('token') || sessionStorage.getItem('token') ||
      localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || ''
    setToken(t)
  }, [])

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['courses', activeTab, search, token],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' })
      if (activeTab === 'recorded') params.set('type', 'recorded')
      else params.set('type', activeTab)
      if (search) params.set('search', search)

      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/courses?${params}`, { headers })
      const data = await res.json()
      return data?.data?.courses ?? data?.courses ?? data?.data ?? []
    },
    staleTime: 60000,
    refetchInterval: false,
  })

  const filtered = courses.filter((c: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.title || c.titleEn || '').toLowerCase().includes(q) ||
      (c.description || c.descriptionEn || '').toLowerCase().includes(q) ||
      (c.instructor?.profile?.firstName || '').toLowerCase().includes(q)
  })

  const activeTabConfig = TABS.find(t => t.key === activeTab)!

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes liveGlow { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .live-dot { animation: liveGlow 2s infinite; }
        .course-card { animation: cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Hero */}
      <div style={{ borderBottom: `1px solid ${border}`, background: cardBg, padding: '48px 24px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: text, fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {isAr ? 'اكتشف كورساتك' : 'Discover Your Courses'}
          </h1>
          <p style={{ color: subtext, fontSize: 14, margin: '0 0 24px', lineHeight: 1.7 }}>
            {isAr ? 'كورسات مسجلة، بث مباشر، ومقرات تدريبية فعلية  كل ما تحتاجه في مكان واحد' : 'Recorded, live, and in-person  everything you need in one place'}
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <Search size={15} color={subtext} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: 14, pointerEvents: 'none' }} />
            <input type="text" placeholder={isAr ? 'ابحث عن كورس...' : 'Search courses...'} value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '13px 44px', borderRadius: 12, border: `1.5px solid ${search ? '#5120c8' : border}`, background: isDark ? '#0d0d0d' : '#fafafa', color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'left' : 'right']: 14, background: 'none', border: 'none', cursor: 'pointer', color: subtext }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 0 }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? tab.color : subtext, borderBottom: `2.5px solid ${active ? tab.color : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', position: 'relative' }}>
                {tab.key === 'live' && (
                  <span style={{ position: 'absolute', top: 10, [isAr ? 'left' : 'right']: 12, width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} className="live-dot" />
                )}
                <Icon size={15} />
                {isAr ? tab.ar : tab.en}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Tab description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '14px 18px', borderRadius: 12, border: `1px solid ${activeTabConfig.color}25`, background: `${activeTabConfig.color}08` }}>
          <activeTabConfig.icon size={18} color={activeTabConfig.color} />
          <div>
            <span style={{ color: activeTabConfig.color, fontSize: 13, fontWeight: 700 }}>
              {activeTab === 'recorded' && (isAr ? 'فيديوهات مسجلة يمكنك مشاهدتها في أي وقت' : 'Recorded videos you can watch anytime')}
              {activeTab === 'live' && (isAr ? 'جلسات مباشرة  انضم الآن أو شاهد القادمة' : 'Live sessions  join now or see upcoming')}
              {activeTab === 'offline' && (isAr ? 'كورسات في مقرات تدريبية فعلية  احجز مقعدك' : 'In-person training  book your seat')}
            </span>
            <span style={{ color: subtext, fontSize: 12, marginRight: isAr ? 0 : 8, marginLeft: isAr ? 8 : 0 }}>
              ({filtered.length} {isAr ? 'كورس' : 'courses'})
            </span>
          </div>
          {activeTab === 'live' && (
            <span style={{ marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
              {isAr ? 'تحديث تلقائي كل 15 ثانية' : 'Auto-refresh every 15s'}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: 300, borderRadius: 16, animation: 'pulse 1.5s infinite', background: isDark ? '#1a1a1a' : '#f4f4f8' }} />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <activeTabConfig.icon size={48} color={subtext} style={{ marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
              {isAr ? 'لا توجد كورسات' : 'No courses found'}
            </h3>
            <p style={{ color: subtext, fontSize: 13 }}>
              {search ? (isAr ? 'جرب كلمة بحث أخرى' : 'Try a different search') : (isAr ? 'لا توجد كورسات في هذا القسم بعد' : 'No courses in this section yet')}
            </p>
          </div>
        )}

        {/* RECORDED */}
        {!isLoading && activeTab === 'recorded' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {filtered.map((course: any, idx: number) => (
              <RecordedCard key={course.id} course={course} idx={idx} isDark={isDark} isAr={isAr} locale={locale} router={router} cardBg={cardBg} border={border} text={text} subtext={subtext} token={token} />
            ))}
          </div>
        )}

        {/* LIVE */}
        {!isLoading && activeTab === 'live' && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((course: any, idx: number) => (
              <LiveCard key={course.id} course={course} idx={idx} isDark={isDark} isAr={isAr} locale={locale} router={router} cardBg={cardBg} border={border} text={text} subtext={subtext} token={token} API={API_BASE} />
            ))}
          </div>
        )}

        {/* OFFLINE */}
        {!isLoading && activeTab === 'offline' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
            {filtered.map((course: any, idx: number) => (
              <OfflineCard key={course.id} course={course} idx={idx} isDark={isDark} isAr={isAr} locale={locale} router={router} cardBg={cardBg} border={border} text={text} subtext={subtext} token={token} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ========================
// RECORDED CARD
// ========================
function RecordedCard({ course, idx, isDark, isAr, locale, router, cardBg, border, text, subtext, token }: any) {
  const price = parseFloat(course.price || 0)
  const isEnrolled = course.isEnrolled || false

  return (
    <div className="course-card" style={{ animationDelay: `${(idx % 12) * 0.05}s`, background: cardBg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={() => router.push(`/${locale}/courses/${course.id}`)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(81,32,200,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 8px 28px rgba(0,0,0,0.4)' : '0 8px 28px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Thumbnail */}
      <div style={{ height: 160, background: course.thumbnail ? `url(${course.thumbnail}) center/cover no-repeat` : (isDark ? '#1a1a1a' : '#f4f4f8'), position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 10, [isAr ? 'right' : 'left']: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(81,32,200,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
          <Video size={10} />
          {isAr ? 'مسجل' : 'Recorded'}
        </div>
        {isEnrolled && (
          <div style={{ position: 'absolute', top: 10, [isAr ? 'left' : 'right']: 10, display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 20, background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
            <CheckCircle2 size={10} />
            {isAr ? 'مسجل' : 'Enrolled'}
          </div>
        )}
        {!course.thumbnail && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={32} color="rgba(255,255,255,0.3)" /></div>}
      </div>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ color: text, fontSize: 14, fontWeight: 800, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {getTitle(course, locale)}
        </h3>

        {course.instructor?.profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {course.instructor.profile.avatar
              ? <img src={course.instructor.profile.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800 }}>{course.instructor.profile.firstName?.[0]}</div>}
            <span style={{ color: subtext, fontSize: 12 }}>{course.instructor.profile.firstName} {course.instructor.profile.lastName}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {course._count?.lessons !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: subtext, fontSize: 11 }}>
              <BookOpen size={11} />{course._count.lessons} {isAr ? 'درس' : 'lessons'}
            </span>
          )}
          {course._count?.enrollments !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: subtext, fontSize: 11 }}>
              <Users size={11} />{course._count.enrollments} {isAr ? 'طالب' : 'students'}
            </span>
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#5120c8', fontSize: 16, fontWeight: 900 }}>
            {price > 0 ? `${price} ${isAr ? 'ر.س' : 'SAR'}` : (isAr ? 'مجاني' : 'Free')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
            {isEnrolled ? (isAr ? 'متابعة' : 'Continue') : (isAr ? 'عرض' : 'View')}
            <ChevronRight size={13} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================
// LIVE CARD
// ========================
function LiveCard({ course, idx, isDark, isAr, locale, router, cardBg, border, text, subtext, token, API }: any) {
  const [joining, setJoining] = useState(false)
  const price = parseFloat(course.price || 0)
  const isLive = course.liveStatus === 'live'
  const isScheduled = course.liveStatus === 'scheduled'
  const isEnrolled = course.isEnrolled || false
  const isPaid = isEnrolled

  const liveDate = course.liveStartTime ? new Date(course.liveStartTime) : null
  const now = new Date()
  const isUpcoming = liveDate && liveDate > now
  const timeUntil = liveDate ? liveDate.getTime() - now.getTime() : 0
  const hoursUntil = Math.floor(timeUntil / 3600000)
  const minutesUntil = Math.floor((timeUntil % 3600000) / 60000)

  const handleJoinLive = async () => {
    if (!token) {
      router.push(`/${locale}/auth/login?returnUrl=/${locale}/courses`)
      return
    }

    const price = parseFloat(course.price || '0')

    // If already enrolled or free, go directly to live
    if (isEnrolled || price === 0) {
      setJoining(true)
      try {
        // For free courses, enroll first
        if (!isEnrolled && price === 0) {
          await fetch(`${API_BASE}/courses/${course.id}/enroll`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          }).catch(() => {})
        }

        // Get Agora token and join
        const tokenRes = await fetch(`${API_BASE}/live/token/${course.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const tokenData = await tokenRes.json()

        if (tokenData?.data?.token) {
          sessionStorage.setItem('agora_token', tokenData.data.token)
          sessionStorage.setItem('agora_channel', tokenData.data.channelName)
          sessionStorage.setItem('agora_uid', String(tokenData.data.uid))
          sessionStorage.setItem('agora_appid', tokenData.data.appId)
          router.push(`/${locale}/live/${course.id}`)
        } else if (course.liveStatus === 'scheduled') {
          toast.success(isAr ? 'سيتم إشعارك عند بدء البث' : 'You will be notified when stream starts')
        } else {
          toast.error(isAr ? 'البث غير متاح حالياً' : 'Stream not available')
        }
      } catch (e: any) {
        toast.error(e.message || (isAr ? 'حدث خطأ' : 'Error occurred'))
      } finally {
        setJoining(false)
      }
      return
    }

    // Need to pay - redirect to Stripe Checkout
    setJoining(true)
    try {
      await redirectToCheckout(course.id, locale, token)
    } catch (e: any) {
      toast.error(e.message || (isAr ? 'حدث خطأ' : 'Error occurred'))
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="course-card" style={{ animationDelay: `${idx * 0.06}s`, background: cardBg, borderRadius: 18, border: `1.5px solid ${isLive ? 'rgba(220,38,38,0.5)' : border}`, overflow: 'hidden', boxShadow: isLive ? '0 0 0 4px rgba(220,38,38,0.06)' : 'none', transition: 'all 0.2s' }}>

      {/* Live/Scheduled Banner */}
      {isLive && (
        <div style={{ padding: '10px 20px', background: 'rgba(220,38,38,0.1)', borderBottom: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'block' }} className="live-dot" />
          <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 800 }}>
            {isAr ? 'البث مباشر الآن' : 'LIVE NOW'}
          </span>
          {course.liveViewerCount > 0 && (
            <span style={{ marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0, display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 11 }}>
              <Users size={11} />{course.liveViewerCount} {isAr ? 'مشاهد' : 'watching'}
            </span>
          )}
        </div>
      )}

      {isEnrolled && (
        <div style={{
          position: 'absolute', top: 8, [isAr?'left':'right']: 8,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 20,
          background: 'rgba(22,163,74,0.9)', color: '#fff',
          fontSize: 10, fontWeight: 700, zIndex: 10
        }}>
          <CheckCircle2 size={10} />
          {isAr ? 'مسجل' : 'Enrolled'}
        </div>
      )}

      {isScheduled && liveDate && (
        <div style={{ padding: '8px 20px', background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={13} color={subtext} />
          <span style={{ color: subtext, fontSize: 12, fontWeight: 600 }}>
            {isUpcoming
              ? (isAr ? `يبدأ خلال ${hoursUntil > 0 ? hoursUntil + ' ساعة و' : ''}${minutesUntil} دقيقة` : `Starts in ${hoursUntil > 0 ? hoursUntil + 'h ' : ''}${minutesUntil}m`)
              : (isAr ? 'مجدول' : 'Scheduled')}
          </span>
        </div>
      )}

      <div style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Thumbnail */}
        <div style={{ width: 120, height: 80, borderRadius: 12, background: course.thumbnail ? `url(${course.thumbnail}) center/cover no-repeat` : 'rgba(220,38,38,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {!course.thumbnail && <Radio size={28} color="rgba(220,38,38,0.5)" />}
          {isLive && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radio size={18} color="#fff" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ color: text, fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>
            {getTitle(course, locale)}
          </h3>
          {course.instructor?.profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {course.instructor.profile.avatar
                ? <img src={course.instructor.profile.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>{course.instructor.profile.firstName?.[0]}</div>}
              <span style={{ color: subtext, fontSize: 12 }}>{course.instructor.profile.firstName} {course.instructor.profile.lastName}</span>
            </div>
          )}
          {liveDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calendar size={12} color={subtext} />
              <span style={{ color: subtext, fontSize: 12 }}>
                {liveDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                {'  '}
                {liveDate.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {course.description && (
            <p style={{ color: subtext, fontSize: 12, lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {course.description || course.descriptionEn || course.descriptionAr}
            </p>
          )}

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: isLive ? '#dc2626' : '#5120c8', fontSize: 18, fontWeight: 900 }}>
              {price > 0 ? `${price} ${isAr ? 'ر.س' : 'SAR'}` : (isAr ? 'مجاني' : 'Free')}
            </div>

            {isLive && (
              <button onClick={handleJoinLive} disabled={joining} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 11,
                background: isPaid || price === 0 ? '#dc2626' : '#5120c8',
                color: '#ffffff', border: 'none', cursor: joining ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 800, opacity: joining ? 0.7 : 1,
              }}>
                {joining ? (isAr ? 'جاري الانضمام...' : 'Joining...') :
                  isPaid || price === 0
                    ? <><Radio size={14} />{isAr ? 'انضم الآن' : 'Join Live'}</>
                    : <><Lock size={13} />{isAr ? `ادفع ${price} ر.س وانضم` : `Pay ${price} SAR & Join`}</>}
              </button>
            )}

            {isScheduled && (
              <button onClick={() => {
                if (!token) { router.push(`/${locale}/login`); return }
                if (price > 0 && !isPaid) {
                  handleJoinLive()
                } else {
                  router.push(`/${locale}/courses/${course.id}`)
                }
              }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 11, background: price > 0 && !isPaid ? '#5120c8' : 'rgba(220,38,38,0.1)', color: price > 0 && !isPaid ? '#ffffff' : '#dc2626', border: price > 0 && !isPaid ? 'none' : '1px solid rgba(220,38,38,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                {price > 0 && !isPaid
                  ? <><Lock size={12} />{isAr ? 'سجل وانتظر البث' : 'Enroll & Wait'}</>
                  : <><Calendar size={12} />{isAr ? 'أضف للتقويم' : 'Add to Calendar'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================
// OFFLINE CARD
// ========================
function OfflineCard({ course, idx, isDark, isAr, locale, router, cardBg, border, text, subtext, token }: any) {
  const price = parseFloat(course.price || 0)
  const isEnrolled = course.isEnrolled || false
  const offlineDate = course.liveStartTime ? new Date(course.liveStartTime) : null
  const hasMap = course.locationLat && course.locationLng

  const handleBookSeat = async () => {
    if (!token) {
      router.push(`/${locale}/auth/login`)
      return
    }

    if (!isEnrolled && price > 0) {
      await redirectToCheckout(course.id, locale, token)
      return
    }

    if (!isEnrolled && price === 0) {
      try {
        await fetch(`${API_BASE}/courses/${course.id}/enroll`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        router.push(`/${locale}/courses/${course.id}`)
      } catch(e) {}
    } else {
      router.push(`/${locale}/courses/${course.id}`)
    }
  }

  return (
    <div className="course-card" style={{ animationDelay: `${(idx % 12) * 0.05}s`, background: cardBg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={() => router.push(`/${locale}/courses/${course.id}`)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 8px 28px rgba(0,0,0,0.4)' : '0 8px 28px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      
      {/* Map preview or thumbnail */}
      <div style={{ height: 140, background: course.thumbnail ? `url(${course.thumbnail}) center/cover no-repeat` : (isDark ? '#1a1a1a' : '#f0fdf4'), position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 10, [isAr ? 'right' : 'left']: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
          <MapPin size={10} />
          {isAr ? 'مقر فعلي' : 'Physical'}
        </div>
        {course.offlinePaymentType === 'on_site' && (
          <div style={{ position: 'absolute', top: 10, [isAr ? 'left' : 'right']: 10, padding: '4px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
            {isAr ? 'دفع في المقر' : 'Pay on site'}
          </div>
        )}
        {!course.thumbnail && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={40} color="rgba(22,163,74,0.3)" />
          </div>
        )}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {getTitle(course, locale)}
        </h3>

        {/* Location */}
        {course.locationName && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <MapPin size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ color: text, fontSize: 13, fontWeight: 700 }}>{course.locationName}</div>
              {course.locationAddress && <div style={{ color: subtext, fontSize: 11 }}>{course.locationAddress}</div>}
            </div>
          </div>
        )}

        {/* Date */}
        {offlineDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} color={subtext} />
            <span style={{ color: subtext, fontSize: 12 }}>
              {offlineDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              {'  '}
              {offlineDate.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Max attendees */}
        {course.maxAttendees && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} color={subtext} />
            <span style={{ color: subtext, fontSize: 12 }}>
              {isAr ? `الحد الأقصى: ${course.maxAttendees} شخص` : `Max: ${course.maxAttendees} attendees`}
            </span>
          </div>
        )}

        {/* Map link */}
        {hasMap && (
          <a
            href={`https://www.google.com/maps?q=${course.locationLat},${course.locationLng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#16a34a', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            <Navigation size={12} />
            {isAr ? 'عرض على خريطة Google' : 'View on Google Maps'}
          </a>
        )}

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ color: '#16a34a', fontSize: 16, fontWeight: 900 }}>
            {price > 0
              ? `${price} ${isAr ? 'ر.س' : 'SAR'}`
              : course.offlinePaymentType === 'on_site'
                ? (isAr ? 'دفع في المقر' : 'Pay on site')
                : (isAr ? 'مجاني' : 'Free')}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleBookSeat(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 9, background: isEnrolled ? 'rgba(22,163,74,0.1)' : '#16a34a', color: isEnrolled ? '#16a34a' : '#fff', border: isEnrolled ? '1px solid rgba(22,163,74,0.3)' : 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {isEnrolled
              ? <><CheckCircle2 size={12} />{isAr ? 'محجوز' : 'Booked'}</>
              : <><MapPin size={12} />{isAr ? 'احجز مقعدك' : 'Book Seat'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
