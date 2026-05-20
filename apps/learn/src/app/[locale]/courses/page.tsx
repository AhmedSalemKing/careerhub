'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../../lib/api'
import toast from 'react-hot-toast'
import {
  Video, Radio, MapPin, Search, X, Clock, Users,
  Calendar, Play, ChevronRight, Wifi, WifiOff,
  Star, BookOpen, Lock, CheckCircle2, AlertCircle,
  DollarSign, Navigation
} from 'lucide-react'
import { formatDate, formatTimeOnly } from '../../../lib/time'

const PRODUCTION_API_URL = 'https://deve-way.onrender.com/api'

const API_BASE = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  const url = (envUrl && envUrl.trim()) ? envUrl : PRODUCTION_API_URL
  const cleaned = url.replace(/\/+$/, '')
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
})()

const PAGE_SIZE = 15

const TABS = [
  { key: 'recorded', labelKey: 'recordedTab', icon: Video, color: '#5120c8' },
  { key: 'live', labelKey: 'liveTab', icon: Radio, color: '#dc2626' },
  { key: 'offline', labelKey: 'offlineTab', icon: MapPin, color: '#16a34a' },
]

const MAIN_CATS = [
  {
    id: 'programming',
    nameAr: 'البرمجة',
    keywords: [
      // Programming & Development
      'Software', 'Frontend', 'Backend', 'Mobile', 'Game', 'DevOps',
      'Database', 'Python', 'JavaScript', 'Java', 'Web', 'Full Stack',
      'API', 'Development', 'Engineer', 'C++', 'Control', 'Linux',
      'برمجة', 'تطوير', 'قواعد', 'مطور', 'هندسة',
      // Cybersecurity
      'Cyber', 'Security', 'Hacking', 'Penetration', 'Network',
      'Networking', 'Firewall', 'Ethical', 'OSCP', 'SOC', 'Kali',
      'أمن', 'سيبراني', 'اختراق', 'شبكات', 'حماية',
      // IT & Cloud
      'Cloud', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'DevOps',
      'IT', 'System', 'Hardware', 'Operating',
      // AI & Data
      'Machine Learning', 'ML', 'AI', 'Data Science', 'Data',
      'Intelligence', 'Deep Learning', 'Neural',
      'ذكاء', 'بيانات', 'تعلم الآلة',
      // Computer Science general
      'Computer', 'Algorithm', 'Programming', 'Quantum',
      'كومبيوتر', 'حاسوب', 'حاسب',
    ],
  },
  {
    id: 'design',
    nameAr: 'التصميم',
    keywords: ['Design', 'UI', 'UX', 'Motion', 'Graphic', 'تصميم', 'موشن'],
  },
  {
    id: 'marketing',
    nameAr: 'التسويق الرقمي',
    keywords: ['Marketing', 'SEO', 'Content', 'Advertising', 'تسويق', 'Digital'],
  },
  {
    id: 'business',
    nameAr: 'إدارة الأعمال',
    keywords: [
      'Business', 'Management', 'Project', 'Product', 'Entrepreneur',
      'Analysis', 'إدارة', 'أعمال', 'ريادة', 'تحليل', 'Data Science',
      'Machine Learning', 'ML', 'AI', 'Data', 'Science',
    ],
  },
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
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const tl = useTranslations('learn')
  const router = useRouter()
  const searchParams = useSearchParams()
  const enrolledCourseId = searchParams.get('enrolled')

  const [activeTab, setActiveTab] = useState<'recorded' | 'live' | 'offline'>('recorded')
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')
  const [level, setLevel] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  useEffect(() => {
    const t = localStorage.getItem('deveway_token') || localStorage.getItem('careerhub_token') ||
      localStorage.getItem('token') || sessionStorage.getItem('token') || ''
    setToken(t)
  }, [])
  const [selectedMainCat, setSelectedMainCat] = useState<string | null>(null)

  // Main fetch — re-runs when category or tab changes, with race-condition guard
  useEffect(() => {
    let mounted = true
    const fetchCourses = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params: any = { limit: 500, type: activeTab }
        console.log('[Fetch] params:', params)
        const res = await api.get('/courses', { params })
        if (!mounted) return
        const data = res?.data?.data?.courses ?? res?.data?.data ?? res?.data?.courses ?? []
        console.log('[Fetch] returned:', Array.isArray(data) ? data.length : '?', 'courses')
        if (Array.isArray(data)) {
          console.log('[Categories] sample:', data.slice(0, 3).map((c: any) => ({ id: c.id, category: c.category, categoryId: c.categoryId, title: c.titleEn || c.titleAr })))
        }
        setCourses(Array.isArray(data) ? data : [])
      } catch (e: any) {
        console.error('[Fetch] error:', e)
        if (mounted) setError(e?.message || 'Failed to load')
        if (mounted) setCourses([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    fetchCourses()
    return () => { mounted = false }
  }, [activeTab, fetchKey])

  // Clean up ?enrolled param after payment redirect
  useEffect(() => {
    if (enrolledCourseId) {
      const url = new URL(window.location.href)
      url.searchParams.delete('enrolled')
      url.searchParams.delete('t')
      window.history.replaceState({}, '', url.toString())
    }
  }, [enrolledCourseId])

  // Client-side filters
  const sortedCourses = useMemo(() => {
    console.log('[DEBUG] courses sample:', courses.slice(0, 5).map((c: any) => ({ title: c.titleEn || c.titleAr, category: c.category, categoryId: c.categoryId })))
    console.log('[DEBUG] selectedMainCat:', selectedMainCat)
    let result = courses.filter((c: any) => {
      if (search) {
        const q = search.toLowerCase()
        const ok = (c.title || c.titleEn || '').toLowerCase().includes(q) ||
          (c.description || c.descriptionEn || '').toLowerCase().includes(q) ||
          (c.instructor?.profile?.firstName || '').toLowerCase().includes(q)
        if (!ok) return false
      }
      if (level !== 'all' && c.level !== level) return false
      if (priceFilter === 'free' && Number(c.price || 0) > 0) return false
      if (priceFilter === 'paid' && Number(c.price || 0) <= 0) return false
      return true
    })
    if (selectedMainCat) {
      const mainCat = MAIN_CATS.find(c => c.id === selectedMainCat)
      if (mainCat) {
        result = result.filter(course => {
          const fields = [
            course.category,
            course.categoryId,
            course.titleEn,
            course.titleAr,
          ].filter(Boolean).join(' ').toLowerCase()
          return mainCat.keywords.some(kw => fields.includes(kw.toLowerCase()))
        })
      }
    }
    result = [...result].sort((a: any, b: any) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      if (sortBy === 'popular') return (b.enrollmentCount || b._count?.enrollments || 0) - (a.enrollmentCount || a._count?.enrollments || 0)
      return 0
    })
    return result
  }, [courses, search, level, priceFilter, sortBy, selectedMainCat])

  const filtered = sortedCourses

  // Reset pagination when any filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedMainCat, activeTab, level, priceFilter, sortBy, search])

  const visibleCourses = sortedCourses.slice(0, visibleCount)
  const hasMore = visibleCount < sortedCourses.length

  const activeTabConfig = TABS.find(t => t.key === activeTab)!

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes liveGlow { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .live-dot { animation: liveGlow 2s infinite; }
        .course-card { animation: cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Hero */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '48px 24px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: 'var(--foreground)', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {tl('discoverCourses')}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.7 }}>
            {tl('heroDescription')}
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <Search size={15} color='var(--muted-foreground)' style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: 14, pointerEvents: 'none' }} />
            <input type="text" placeholder={tl('searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '13px 44px', borderRadius: 12, border: `1.5px solid ${search ? '#5120c8' : 'var(--border)'}`, background: 'var(--background)', color: 'var(--foreground)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'left' : 'right']: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
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
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? tab.color : 'var(--muted-foreground)', borderBottom: `2.5px solid ${active ? tab.color : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', position: 'relative' }}>
                {tab.key === 'live' && (
                  <span style={{ position: 'absolute', top: 10, [isAr ? 'left' : 'right']: 12, width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} className="live-dot" />
                )}
                <Icon size={15} />
                {tl(tab.labelKey)}
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
              {activeTab === 'recorded' && tl('recordedTabDesc')}
              {activeTab === 'live' && tl('liveTabDesc')}
              {activeTab === 'offline' && tl('offlineTabDesc')}
            </span>
            <span style={{ color: 'var(--muted-foreground)', fontSize: 12, marginRight: isAr ? 0 : 8, marginLeft: isAr ? 8 : 0 }}>
              ({filtered.length} {tl('courseCount')})
            </span>
          </div>
          {activeTab === 'live' && (
            <span style={{ marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
              {tl('autoRefresh')}
            </span>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          {([{ id: null, nameAr: 'الكل', nameEn: 'All' }, ...MAIN_CATS.map(c => ({ ...c, nameEn: c.nameAr }))] as any[]).map(cat => (
            <button key={cat.id || 'all'}
              onClick={() => setSelectedMainCat(cat.id)}
              style={{
                padding: '7px 18px', borderRadius: '20px', border: 'none',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                background: selectedMainCat === cat.id ? '#5120C8' : 'var(--surface-2)',
                color: selectedMainCat === cat.id ? '#fff' : 'var(--muted)',
                transition: 'all 0.15s',
              }}>
              {isAr ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Filters */}
        {!isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {/* Sort + Level + Price row */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Sort */}
              {[
                { id: 'newest', label: isAr ? 'الأحدث' : 'Newest' },
                { id: 'popular', label: isAr ? 'الأكثر طلباً' : 'Most Popular' },
              ].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id as any)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                    border: sortBy === s.id ? '1.5px solid #5120C8' : '1px solid var(--border)',
                    background: sortBy === s.id ? '#5120C8' : 'var(--surface)',
                    color: sortBy === s.id ? '#fff' : 'var(--muted)',
                    transition: 'all 0.15s ease',
                  }}>
                  {s.label}
                </button>
              ))}

              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

              {/* Level */}
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'BEGINNER', label: isAr ? 'مبتدئ' : 'Beginner' },
                { id: 'INTERMEDIATE', label: isAr ? 'متوسط' : 'Intermediate' },
                { id: 'ADVANCED', label: isAr ? 'متقدم' : 'Advanced' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setLevel(opt.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                    border: level === opt.id ? '1.5px solid #5120C8' : '1px solid var(--border)',
                    background: level === opt.id ? '#5120C8' : 'var(--surface)',
                    color: level === opt.id ? '#fff' : 'var(--muted)',
                    transition: 'all 0.15s ease',
                  }}>
                  {opt.label}
                </button>
              ))}

              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

              {/* Price */}
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'free', label: isAr ? 'مجاني' : 'Free' },
                { id: 'paid', label: isAr ? 'مدفوع' : 'Paid' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setPriceFilter(opt.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                    border: priceFilter === opt.id ? '1.5px solid #5120C8' : '1px solid var(--border)',
                    background: priceFilter === opt.id ? '#5120C8' : 'var(--surface)',
                    color: priceFilter === opt.id ? '#fff' : 'var(--muted)',
                    transition: 'all 0.15s ease',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: 300, borderRadius: 16, animation: 'pulse 1.5s infinite', background: 'var(--surface-2)' }} />)}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <AlertCircle size={48} color="#dc2626" style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
              {tl('failedLoadCourses')}
            </p>
            <button onClick={() => setFetchKey(k => k + 1)} style={{ padding: '10px 22px', borderRadius: 10, background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {tl('tryAgain')}
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <activeTabConfig.icon size={48} color='var(--muted-foreground)' style={{ marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ color: 'var(--foreground)', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
              {tl('noCoursesFound')}
            </h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
              {search ? tl('tryDifferentSearch') : tl('noCoursesSection')}
            </p>
          </div>
        )}

        {/* RECORDED */}
        {!isLoading && activeTab === 'recorded' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {visibleCourses.map((course: any, idx: number) => (
              <RecordedCard key={course.id} course={course} idx={idx} isAr={isAr} locale={locale} router={router} token={token} tl={tl} />
            ))}
          </div>
        )}

        {/* LIVE */}
        {!isLoading && activeTab === 'live' && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visibleCourses.map((course: any, idx: number) => (
              <LiveCard key={course.id} course={course} idx={idx} isAr={isAr} locale={locale} router={router} token={token} API={API_BASE} tl={tl} />
            ))}
          </div>
        )}

        {/* OFFLINE */}
        {!isLoading && activeTab === 'offline' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
            {visibleCourses.map((course: any, idx: number) => (
              <OfflineCard key={course.id} course={course} idx={idx} isAr={isAr} locale={locale} router={router} token={token} tl={tl} />
            ))}
          </div>
        )}

        {/* Load More */}
        {!isLoading && hasMore && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              style={{
                padding: '12px 32px', borderRadius: 12,
                background: 'rgba(81,32,200,0.1)',
                border: '1px solid rgba(81,32,200,0.3)',
                color: '#5120C8', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#5120C8'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(81,32,200,0.1)'; e.currentTarget.style.color = '#5120C8' }}>
              {isAr
                ? `عرض المزيد (${sortedCourses.length - visibleCount} كورس متبقي)`
                : `Load more (${sortedCourses.length - visibleCount} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ========================
// RECORDED CARD
// ========================
function RecordedCard({ course, idx, isAr, locale, router, token, tl }: any) {
  const price = parseFloat(course.price || 0)
  const isEnrolled = course.isEnrolled === true

  console.log('[RecordedCard]', course.id, 'isEnrolled:', course.isEnrolled)

  return (
    <div className="course-card" style={{ animationDelay: `${(idx % 12) * 0.05}s`, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={() => router.push(`/${locale}/courses/${course.id}`)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(81,32,200,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Thumbnail */}
      <div style={{ height: 160, background: course.thumbnail ? `url(${course.thumbnail}) center/cover no-repeat` : 'var(--surface-2)', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 10, [isAr ? 'right' : 'left']: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(81,32,200,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
          <Video size={10} />
          {tl('recordedBadge')}
        </div>
        {isEnrolled && (
          <div style={{ position: 'absolute', top: 10, [isAr ? 'left' : 'right']: 10, display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 20, background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
            <CheckCircle2 size={10} />
            {tl('enrolledBadge')}
          </div>
        )}
        {!course.thumbnail && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={32} color="rgba(255,255,255,0.3)" /></div>}
      </div>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 800, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {getTitle(course, locale)}
        </h3>

        {course.instructor?.profile && (
          <a
            href={`/${locale}/profile/${course.instructor?.id || ''}`}
            onClick={e => e.stopPropagation()}
            style={{ textDecoration:'none', color:'inherit', display:'flex', alignItems:'center', gap:6 }}
          >
            {course.instructor.profile.avatar
              ? <img src={course.instructor.profile.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800 }}>{course.instructor.profile.firstName?.[0]}</div>}
            <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{course.instructor.profile.firstName} {course.instructor.profile.lastName}</span>
          </a>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {course._count?.lessons !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-foreground)', fontSize: 11 }}>
              <BookOpen size={11} />{course._count.lessons} {tl('lesson')}
            </span>
          )}
          {course._count?.enrollments !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-foreground)', fontSize: 11 }}>
              <Users size={11} />{course._count.enrollments} {tl('students')}
            </span>
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#5120c8', fontSize: 16, fontWeight: 900 }}>
            {price > 0 ? `${price} ${isAr ? 'ر.س' : 'SAR'}` : (isAr ? 'مجاني' : 'Free')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
            {isEnrolled ? tl('continueBtn') : tl('viewBtn')}
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
function LiveCard({ course, idx, isAr, locale, router, token, API, tl }: any) {
  const [joining, setJoining] = useState(false)
  const price = parseFloat(course.price || 0)
  const isLive = course.liveStatus === 'live'
  const isScheduled = course.liveStatus === 'scheduled'
  const isEnrolled = course.isEnrolled === true

  console.log('[LiveCard]', course.id, 'isEnrolled:', course.isEnrolled)

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
          toast.success(tl('notifiedWhenStreamStarts'))
        } else {
          toast.error(tl('streamNotAvailable'))
        }
      } catch (e: any) {
        toast.error(e.message || tl('errorOccurred'))
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
    <div className="course-card" style={{ animationDelay: `${idx * 0.06}s`, background: 'var(--surface)', borderRadius: 18, border: `1.5px solid ${isLive ? 'rgba(220,38,38,0.5)' : 'var(--border)'}`, overflow: 'hidden', boxShadow: isLive ? '0 0 0 4px rgba(220,38,38,0.06)' : 'none', transition: 'all 0.2s' }}>

      {/* Live/Scheduled Banner */}
      {isLive && (
        <div style={{ padding: '10px 20px', background: 'rgba(220,38,38,0.1)', borderBottom: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'block' }} className="live-dot" />
          <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 800 }}>
            {tl('liveNowBadge')}
          </span>
          {course.liveViewerCount > 0 && (
            <span style={{ marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0, display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 11 }}>
              <Users size={11} />{course.liveViewerCount} {tl('watching')}
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
          {tl('enrolledBadge')}
        </div>
      )}

      {isScheduled && liveDate && (
        <div style={{ padding: '8px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={13} color='var(--muted-foreground)' />
          <span style={{ color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}>
            {isUpcoming
              ? tl('startsIn', { hours: hoursUntil, minutes: minutesUntil })
              : tl('scheduledLabel')}
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
          <h3 style={{ color: 'var(--foreground)', fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>
            {getTitle(course, locale)}
          </h3>
          {course.instructor?.profile && (
            <a
              href={`/${locale}/profile/${course.instructor?.id || ''}`}
              onClick={e => e.stopPropagation()}
              style={{ textDecoration:'none', color:'inherit', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}
            >
              {course.instructor.profile.avatar
                ? <img src={course.instructor.profile.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>{course.instructor.profile.firstName?.[0]}</div>}
              <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{course.instructor.profile.firstName} {course.instructor.profile.lastName}</span>
            </a>
          )}
          {liveDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calendar size={12} color='var(--muted-foreground)' />
              <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
                {formatDate(liveDate, locale)}
                {'  '}
                {formatTimeOnly(liveDate)}
              </span>
            </div>
          )}
          {course.description && (
            <p style={{ color: 'var(--muted-foreground)', fontSize: 12, lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {course.description || course.descriptionEn || course.descriptionAr}
            </p>
          )}

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: isLive ? '#dc2626' : '#5120c8', fontSize: 18, fontWeight: 900 }}>
            {price > 0 ? `${price} ${tl('sar')}` : tl('free')}
            </div>

            {isLive && (
              <button onClick={handleJoinLive} disabled={joining} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 11,
                background: isPaid || price === 0 ? '#dc2626' : '#5120c8',
                color: '#ffffff', border: 'none', cursor: joining ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 800, opacity: joining ? 0.7 : 1,
              }}>
          {joining ? tl('joining') :
          isPaid || price === 0
            ? <><Radio size={14} />{tl('joinNow')}</>
            : <><Lock size={13} />{tl('payAndJoin', { price })}</>}
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
                  ? <><Lock size={12} />{tl('enrollAndWait')}</>
                  : <><Calendar size={12} />{tl('addToCalendar')}</>}
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
function OfflineCard({ course, idx, isAr, locale, router, token, tl }: any) {
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
    <div className="course-card" style={{ animationDelay: `${(idx % 12) * 0.05}s`, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={() => router.push(`/${locale}/courses/${course.id}`)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      
      {/* Map preview or thumbnail */}
      <div style={{ height: 140, background: course.thumbnail ? `url(${course.thumbnail}) center/cover no-repeat` : 'var(--surface-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 10, [isAr ? 'right' : 'left']: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
          <MapPin size={10} />
          {tl('physicalBadge')}
        </div>
        {course.offlinePaymentType === 'on_site' && (
          <div style={{ position: 'absolute', top: 10, [isAr ? 'left' : 'right']: 10, padding: '4px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
            {tl('payOnSite')}
          </div>
        )}
        {!course.thumbnail && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={40} color="rgba(22,163,74,0.3)" />
          </div>
        )}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: 'var(--foreground)', fontSize: 15, fontWeight: 800, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {getTitle(course, locale)}
        </h3>

        {/* Location */}
        {course.locationName && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <MapPin size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ color: 'var(--foreground)', fontSize: 13, fontWeight: 700 }}>{course.locationName}</div>
              {course.locationAddress && <div style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{course.locationAddress}</div>}
            </div>
          </div>
        )}

        {/* Date */}
        {offlineDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} color='var(--muted-foreground)' />
            <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
              {formatDate(offlineDate, locale)}
              {'  '}
              {formatTimeOnly(offlineDate)}
            </span>
          </div>
        )}

        {/* Max attendees */}
        {course.maxAttendees && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} color='var(--muted-foreground)' />
            <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
              {tl('maxAttendees', { count: course.maxAttendees })}
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
            {tl('viewOnGoogleMaps')}
          </a>
        )}

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ color: '#16a34a', fontSize: 16, fontWeight: 900 }}>
            {price > 0
              ? `${price} ${tl('sar')}`
              : course.offlinePaymentType === 'on_site'
                ? tl('payOnSite')
                : tl('free')}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleBookSeat(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 9, background: isEnrolled ? 'rgba(22,163,74,0.1)' : '#16a34a', color: isEnrolled ? '#16a34a' : '#fff', border: isEnrolled ? '1px solid rgba(22,163,74,0.3)' : 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {isEnrolled
              ? <><CheckCircle2 size={12} />{tl('booked')}</>
              : <><MapPin size={12} />{tl('bookSeat')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
