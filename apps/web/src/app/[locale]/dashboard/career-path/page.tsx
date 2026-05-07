'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Plus, CheckCircle2, BookOpen, BarChart3,
  ChevronRight, Target, Briefcase, RefreshCw, X,
  Code2, Palette, TrendingUp, Shield, Settings, Package,
  BarChart, Users, Award
} from 'lucide-react'
import { CAREER_PATHS } from '../../../../lib/career-paths'

type TabKey = 'paths' | 'assessment' | 'courses'

type AssessmentResult = {
  track: string
  score: number
  normalized: number
  titleAr: string
  titleEn: string
}

export default function CareerPathPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<TabKey>('paths')
const [selectedPaths, setSelectedPaths] = useState<string[]>([])
const PATHS_CACHE_KEY = 'deveway_my_path_ids'
const [myPathIds, setMyPathIds] = useState<Set<string>>(() => {
  if (typeof window === 'undefined') return new Set()
  try {
    const cached = localStorage.getItem(PATHS_CACHE_KEY)
    if (cached) return new Set(JSON.parse(cached))
  } catch {}
  return new Set()
})
const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
const [allPaths, setAllPaths] = useState<any[]>([])
const MAX_PATHS = 5
  
  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('deveway_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || ''
      : ''

  useEffect(() => {
    try {
      const savedPaths = localStorage.getItem('selectedCareerPaths')
      const savedResults = localStorage.getItem('assessmentResults')
      if (savedPaths) setSelectedPaths(JSON.parse(savedPaths))
      if (savedResults) setAssessmentResults(JSON.parse(savedResults))
      else if (!savedResults) setActiveTab('assessment')
    } catch(e) {}
  }, [])

  useEffect(() => {
    fetch(`${apiUrl}/career/paths`)
      .then(r => r.json())
      .then(data => {
        const arr = data?.data?.careerPaths ?? data?.data ?? data ?? []
        const paths = Array.isArray(arr) ? arr : []
        console.log('[CareerPath] allPaths loaded:', paths.length, paths[0])
        setAllPaths(paths)
      })
      .catch(() => {})
  }, [])

  // Persist myPathIds to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(Array.from(myPathIds)))
    } catch {}
  }, [myPathIds])

  // Sync with server on mount — server is source of truth, cache is for instant display
  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${apiUrl}/career/paths/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const paths = data?.data?.paths ?? data?.data ?? []
        if (Array.isArray(paths)) {
          const serverIds = new Set<string>(
            paths.map((p: any) => p.careerPathId ?? p.pathId ?? p.id).filter(Boolean)
          )
          setMyPathIds(serverIds)
          localStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(Array.from(serverIds)))
        }
      })
      .catch(() => {})
  }, [])

  const resolveSlugToDbId = (slugId: string): string | null => {
    const matched = allPaths.find((p: any) => p.slug === slugId || p.id === slugId)
    return matched?.id ?? null
  }

  const togglePath = async (pathId: string) => {
    const isSelected = myPathIds.has(pathId)
    const token = getToken()

    if (!isSelected && myPathIds.size >= MAX_PATHS) {
      alert(isAr ? 'الحد الأقصى 5 مسارات' : 'Maximum 5 paths allowed')
      return
    }

    console.log('[TogglePath] pathId:', pathId, '| isSelected:', isSelected)

    setMyPathIds(prev => {
      const next = new Set(prev)
      if (isSelected) next.delete(pathId); else next.add(pathId)
      return next
    })

    setSelectedPaths(prev => {
      const next = isSelected ? prev.filter(p => p !== pathId) : [...prev, pathId]
      localStorage.setItem('selectedCareerPaths', JSON.stringify(next))
      return next
    })

    try {
      if (isSelected) {
        console.log('[TogglePath] Calling API remove with UUID:', pathId)
        const res = await fetch(`${apiUrl}/career/paths/remove/${pathId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        console.log('[TogglePath] API remove response:', res.status)
      } else {
        console.log('[TogglePath] Calling API add with UUID:', pathId)
        const res = await fetch(`${apiUrl}/career/paths/add/${pathId}?source=MANUAL`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        console.log('[TogglePath] API add response:', res.status)
      }
    } catch (e: any) {
      console.error('[TogglePath] API error:', e.message)
      setMyPathIds(prev => {
        const next = new Set(prev)
        if (isSelected) next.add(pathId); else next.delete(pathId)
        return next
      })
    }
  }

  const getPathIdForResult = (field: any): string | null => {
    if (allPaths.length === 0) {
      console.warn('[GetPathId] allPaths not loaded yet')
      return null
    }

    const fieldSlug = (field.track || field.slug || field.fieldSlug || '').toLowerCase()
    const fieldTitleAr = (field.titleAr || field.title || '').trim()
    const fieldTitleEn = (field.titleEn || '').toLowerCase().trim()

    const matched = allPaths.find((p: any) => {
      const pSlug = (p.slug || '').toLowerCase()

      // 1. Direct slug match
      if (pSlug === fieldSlug) return true
      // 2. Slug contains/is-contained
      if (fieldSlug && (pSlug.includes(fieldSlug) || fieldSlug.includes(pSlug))) return true

      // 3. jobTitlesAr array — primary match for Arabic assessment results
      const jobTitlesAr: string[] = Array.isArray(p.jobTitlesAr) ? p.jobTitlesAr : []
      if (fieldTitleAr && jobTitlesAr.some(t =>
        t.includes(fieldTitleAr) || fieldTitleAr.includes(t)
      )) return true

      // 4. jobTitlesEn array
      const jobTitlesEn: string[] = Array.isArray(p.jobTitlesEn) ? p.jobTitlesEn : []
      if (fieldTitleEn && jobTitlesEn.some(t =>
        t.toLowerCase().includes(fieldTitleEn) || fieldTitleEn.includes(t.toLowerCase())
      )) return true

      // 5. descriptionAr fallback
      const pDescAr = (p.descriptionAr || '').toLowerCase()
      if (fieldTitleAr && pDescAr.includes(fieldTitleAr.toLowerCase())) return true

      return false
    })

    console.log('[GetPathId] slug:', fieldSlug, '| titleAr:', fieldTitleAr,
      '| allPaths:', allPaths.length,
      '| matched:', matched?.id, matched?.slug, matched?.jobTitlesAr?.[0])

    return matched?.id ?? null
  }

  const handleAddAssessmentPath = async (field: any) => {
    const pathId = getPathIdForResult(field)
    if (!pathId) {
      console.warn('[AddPath] No DB path found for field:', field.titleAr, field.track)
      return
    }
    console.log('[AddPath] Adding pathId (UUID):', pathId)
    await togglePath(pathId)
  }

  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [bundles, setBundles] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_bundlesLoading, setBundlesLoading] = useState(false)

  useEffect(() => {
    setCoursesLoading(true)
    const token = getToken()

    const pathIds = Array.from(myPathIds)
    const params = new URLSearchParams()
    if (pathIds.length > 0) params.set('paths', pathIds.join(','))
    params.set('limit', '12')

    fetch(`${apiUrl}/courses/recommended?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(r => r.json())
      .then(data => {
        console.log('[Recommended courses]', data)
        // Handle: { success, data: [...] } OR { courses: [...] } OR [...]
        const arr = data?.data ?? data?.courses ?? data ?? []
        setCourses(Array.isArray(arr) ? arr : [])
      })
      .catch(e => {
        console.error('[Recommended error]', e)
        setCourses([])
      })
      .finally(() => setCoursesLoading(false))
  }, [myPathIds])

  useEffect(() => {
    setBundlesLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
    fetch(`${apiUrl}/courses/bundles`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        const arr = data?.data?.data ?? data?.data ?? data ?? []
        setBundles(Array.isArray(arr) ? arr : [])
      })
      .catch(() => setBundles([]))
      .finally(() => setBundlesLoading(false))
  }, [])

  const TABS = [
    { key: 'paths' as TabKey, labelAr: 'مساراتي المهنية', labelEn: 'My Career Paths', icon: <Target size={15} /> },
    { key: 'assessment' as TabKey, labelAr: 'الاختبار الذكي', labelEn: 'Smart Assessment', icon: <Sparkles size={15} /> },
    { key: 'courses' as TabKey, labelAr: 'الكورسات المقترحة', labelEn: 'Recommended Courses', icon: <BookOpen size={15} /> },
  ]

  const ICON_MAP: Record<string, any> = {
    code: Code2, design: Palette, marketing: TrendingUp,
    data: BarChart, security: Shield, devops: Settings,
    product: Package, business: Briefcase, creative: Users,
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ padding: '28px 24px 0', borderBottom: `1px solid ${border}`, background: cardBg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ color: text, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {isAr ? 'المسار المهني' : 'Career Path'}
            </h1>
            <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
              {isAr ? 'اكتشف مسارك احفظ تقدمك واستكشف الكورسات المناسبة' : 'Discover your path, save progress, and explore matching courses'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                color: activeTab === tab.key ? '#5120c8' : subtext,
                borderBottom: `2px solid ${activeTab === tab.key ? '#5120c8' : 'transparent'}`,
                transition: 'all 0.15s',
                marginBottom: -1,
              }}>
                {tab.icon}
                {isAr ? tab.labelAr : tab.labelEn}
                {tab.key === 'paths' && myPathIds.size > 0 && (
                  <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 800, background: '#5120c8', color: '#ffffff' }}>
                    {myPathIds.size}
                  </span>
                )}
                {tab.key === 'assessment' && assessmentResults.length > 0 && (
                  <CheckCircle2 size={13} color="#16a34a" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        {activeTab === 'paths' && (
          <div>
            {assessmentResults.length > 0 && (
              <div style={{
                padding: '16px 20px', borderRadius: 14, marginBottom: 24,
                border: '1px solid rgba(81,32,200,0.2)',
                background: isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.03)',
                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BarChart3 size={18} color="#5120c8" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: text, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                    {isAr ? 'نتيجة الاختبار الذكي' : 'Smart Assessment Result'}
                  </div>
                  <div style={{ color: subtext, fontSize: 12 }}>
                    {isAr ? `المسار الأنسب: ${assessmentResults[0]?.titleAr} (${assessmentResults[0]?.normalized}%)` : `Best match: ${assessmentResults[0]?.titleEn} (${assessmentResults[0]?.normalized}%)`}
                  </div>
                </div>
                <button onClick={() => setActiveTab('assessment')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(81,32,200,0.3)', background: 'transparent', color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
                  <RefreshCw size={12} />
                  {isAr ? 'أعد الاختبار' : 'Retake'}
                </button>
              </div>
            )}

            {myPathIds.size > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'مساراتي المختارة' : 'My Selected Paths'}</h3>
                  <span style={{ color: subtext, fontSize: 12 }}>{myPathIds.size} / {MAX_PATHS} {isAr ? 'مسارات' : 'paths'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {allPaths.filter(p => myPathIds.has(p.id)).map(path => {
                    const IconComp = ICON_MAP[(path as any).icon] || Briefcase
                    return (
                      <div key={path.id} style={{ padding: '16px 20px', borderRadius: 14, border: '1.5px solid rgba(81,32,200,0.3)', background: isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.02)', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp size={18} color="#5120c8" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{isAr ? path.titleAr : path.titleEn}</div>
                          <div style={{ color: subtext, fontSize: 12, marginTop: 2 }}>{isAr ? 'مسار مهني' : 'Career path'}</div>
                        </div>
                        <button onClick={() => setActiveTab('courses')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                          <BookOpen size={12} />
                          {isAr ? 'كورسات' : 'Courses'}
                        </button>
                        <button onClick={() => togglePath(path.id)} style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}>
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'استكشف المسارات' : 'Explore Paths'}</h3>
              {myPathIds.size < MAX_PATHS && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: subtext, fontSize: 12 }}>
                  <Plus size={13} />
                  {isAr ? `يمكنك إضافة ${MAX_PATHS - myPathIds.size} مسارات أخرى` : `You can add ${MAX_PATHS - myPathIds.size} more paths`}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {allPaths.slice(0, 30).map((path: any) => {
                const IconComp = ICON_MAP[path.icon] || Briefcase
                const dbId = path.id
                const isSelected = myPathIds.has(dbId)
                return (
                  <div key={dbId} style={{
                    padding: '18px', borderRadius: 14,
                    border: `1.5px solid ${isSelected ? 'rgba(81,32,200,0.4)' : border}`,
                    background: isSelected ? (isDark ? 'rgba(81,32,200,0.08)' : 'rgba(81,32,200,0.03)') : cardBg,
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
                  }}
                  onClick={() => togglePath(dbId)}>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 12, left: isAr ? 12 : 'auto', right: isAr ? 'auto' : 12 }}>
                        <CheckCircle2 size={18} color="#5120c8" />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: isSelected ? 'rgba(81,32,200,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f8'), border: `1px solid ${isSelected ? 'rgba(81,32,200,0.2)' : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconComp size={16} color={isSelected ? '#5120c8' : subtext} />
                      </div>
                      <h4 style={{ color: text, fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{isAr ? path.titleAr : path.titleEn}</h4>
                    </div>
                    <p style={{ color: subtext, fontSize: 12, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{isAr ? path.descriptionAr : path.descriptionEn}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
                        {isAr ? 'مسار مهني' : 'Career path'}
                      </span>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: isSelected ? 'rgba(81,32,200,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f8'), color: isSelected ? '#5120c8' : subtext, border: `1px solid ${isSelected ? 'rgba(81,32,200,0.2)' : border}` }}>
                        {isSelected ? (isAr ? 'تم الاختيار' : 'Selected') : (isAr ? 'اختر' : 'Select')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => router.push(`/${locale}/careers`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: subtext, fontSize: 13, fontWeight: 600 }}>
                {isAr ? `عرض جميع المسارات (${CAREER_PATHS.length}+)` : `View All Paths (${CAREER_PATHS.length}+)`}
                <ChevronRight size={14} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div>
            {assessmentResults.length > 0 ? (
              <div>
                <div style={{ padding: '20px', borderRadius: 14, marginBottom: 24, border: '1px solid rgba(22,163,74,0.2)', background: isDark ? 'rgba(22,163,74,0.06)' : 'rgba(22,163,74,0.03)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{isAr ? 'لديك نتيجة محفوظة' : 'You have a saved result'}</div>
                    <div style={{ color: subtext, fontSize: 12, marginTop: 2 }}>{isAr ? 'يمكنك إعادة الاختبار في أي وقت للحصول على نتيجة أحدث' : 'You can retake the assessment anytime for a newer result'}</div>
                  </div>
                </div>
                
                <h3 style={{ color: text, fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{isAr ? 'نتائج آخر اختبار' : 'Last Assessment Results'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {allPaths.length === 0 && (
                    <p style={{ color: subtext, fontSize: 13, margin: '0 0 8px' }}>
                      {isAr ? 'جاري تحميل المسارات...' : 'Loading paths...'}
                    </p>
                  )}
                  {assessmentResults.slice(0, 5).map((result, idx) => (
                    <div key={idx} style={{ padding: '16px 20px', borderRadius: 12, border: `1.5px solid ${idx === 0 ? 'rgba(81,32,200,0.3)' : border}`, background: idx === 0 ? (isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.02)') : cardBg, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: idx === 0 ? '#5120c8' : (isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? '#ffffff' : subtext, fontSize: 13, fontWeight: 800 }}>{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{isAr ? result.titleAr : result.titleEn}</div>
                        <div style={{ marginTop: 6, height: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${result.normalized}%`, height: '100%', background: idx === 0 ? '#5120c8' : '#94a3b8', borderRadius: 2 }} />
                        </div>
                      </div>
                      <span style={{ color: idx === 0 ? '#5120c8' : subtext, fontSize: 14, fontWeight: 800 }}>{result.normalized}%</span>
                      <button onClick={() => handleAddAssessmentPath(result)} style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', background: (getPathIdForResult(result) && myPathIds.has(getPathIdForResult(result)!)) ? 'transparent' : '#5120c8', color: (getPathIdForResult(result) && myPathIds.has(getPathIdForResult(result)!)) ? subtext : '#ffffff', border: `1px solid ${(getPathIdForResult(result) && myPathIds.has(getPathIdForResult(result)!)) ? border : 'transparent'}`, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {(getPathIdForResult(result) && myPathIds.has(getPathIdForResult(result)!)) ? <><CheckCircle2 size={11} />{isAr ? 'مضاف' : 'Added'}</> : <><Plus size={11} />{isAr ? 'أضف للمسار' : 'Add to Path'}</>}
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { localStorage.removeItem('assessmentResults'); setAssessmentResults([]); router.push(`/${locale}/dashboard/assessment`) }} style={{ flex: 1, padding: '13px', borderRadius: 12, cursor: 'pointer', background: '#5120c8', color: '#ffffff', border: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <RefreshCw size={15} />
                    {isAr ? 'إعادة الاختبار الذكي' : 'Retake Smart Assessment'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px', background: isDark ? 'rgba(81,32,200,0.1)' : 'rgba(81,32,200,0.06)', border: '1px solid rgba(81,32,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={26} color="#5120c8" />
                </div>
                <h2 style={{ color: text, fontSize: 22, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{isAr ? 'اكتشف مسارك المثالي' : 'Discover Your Ideal Path'}</h2>
                <p style={{ color: subtext, fontSize: 14, margin: '0 0 28px', lineHeight: 1.75, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                  {isAr ? '15 سؤال ذكي يحلل اهتماماتك ومهاراتك ليرشح لك المسار الأنسب بدقة' : '15 smart questions analyze your interests and skills to recommend the perfect path'}
                </p>
                <button onClick={() => router.push(`/${locale}/dashboard/assessment`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 16px rgba(81,32,200,0.3)' }}>
                  <Sparkles size={16} />
                  {isAr ? 'ابدأ الاختبار الذكي' : 'Start Smart Assessment'}
                  <ChevronRight size={15} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
                </button>
                <p style={{ color: isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db', fontSize: 12, marginTop: 12 }}>{isAr ? 'مجاني  يستغرق 3-5 دقائق فقط' : 'Free  takes only 3-5 minutes'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            {true && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 4px' }}>{isAr ? 'الكورسات المقترحة' : 'Recommended Courses'}</h3>
                  <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
                    {myPathIds.size > 0
                      ? (isAr ? `بناء على ${myPathIds.size} مسار مختار` : `Based on ${myPathIds.size} selected path${myPathIds.size > 1 ? 's' : ''}`)
                      : (isAr ? 'أحدث الكورسات المنشورة' : 'Latest published courses')}
                  </p>
                </div>
                
                {coursesLoading ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} style={{ height:200, borderRadius:14, background: isDark?'#1a1a1a':'#f4f4f8' }}>
                        <div style={{ width:'100%', height:'100%', borderRadius:14, animation:'pulse 1.5s infinite', background: isDark?'#222':'#efefef' }} />
                      </div>
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {courses.map((course: any) => (
                      <div key={course.id} style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardBg, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                      onClick={() => window.open(`https://deveway-teal.vercel.app/${locale}/courses/${course.slug || course.id}`, '_blank')}>
                        <div style={{ height: 120, background: isDark ? '#1a1a1a' : '#f8f8fa', overflow: 'hidden' }}>
                          {course.thumbnail ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={28} color={subtext} /></div>}
                        </div>
                        <div style={{ padding: '14px' }}>
                          <h4 style={{ color: text, fontSize: 13, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4 }}>{course.title || (isAr ? (course.titleAr || course.titleEn) : (course.titleEn || course.titleAr))}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#5120c8', fontSize: 13, fontWeight: 800 }}>{course.price > 0 ? `${course.price} ر.س` : (isAr ? 'مجاني' : 'Free')}</span>
                            <Award size={13} color={subtext} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'60px 24px' }}>
                    <BookOpen size={36} color={subtext} style={{ marginBottom:12 }} />
                    <p style={{ color:subtext, fontSize:14, marginBottom:16 }}>
                      {isAr ? 'لا توجد كورسات منشورة حالياً' : 'No published courses yet'}
                    </p>
                    <button
                      onClick={() => window.open(`https://deveway-teal.vercel.app/${locale}/courses`, '_blank')}
                      style={{
                        padding:'10px 22px', borderRadius:10,
                        background:'#5120c8', color:'#ffffff', border:'none', cursor:'pointer',
                        fontSize:13, fontWeight:700,
                      }}>
                      {isAr ? 'استعرض جميع الكورسات' : 'Browse All Courses'}
                    </button>
                  </div>
                )}
                
                {bundles.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <h4 style={{ color: text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{isAr ? 'حزم الكورسات الداعمة' : 'Supporting Course Bundles'}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {bundles.map((bundle: any) => (
                        <div key={bundle.id} style={{ padding: '16px 18px', borderRadius: 14, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} color="#5120c8" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{bundle.title}</div>
                            <div style={{ color: subtext, fontSize: 12, marginTop: 3 }}>{bundle.coursesCount || bundle.courses?.length || 0} {isAr ? 'كورس' : 'courses'} · {bundle.price > 0 ? `${bundle.price} ر.س` : (isAr ? 'مجاني' : 'Free')}</div>
                          </div>
                          <button onClick={() => window.open(`https://deveway-teal.vercel.app/${locale}/bundles/${bundle.id}`, '_blank')} style={{ padding: '8px 14px', borderRadius: 10, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{isAr ? 'عرض' : 'View'}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button onClick={() => {
                    const firstPathId = Array.from(myPathIds)[0] || selectedPaths[0]
                    window.open(`https://deveway-teal.vercel.app/${locale}/courses`, '_blank')
                  }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: '#5120c8', fontSize: 13, fontWeight: 700 }}>
                    <BookOpen size={14} />
                    {isAr ? 'استعرض جميع الكورسات' : 'Browse All Courses'}
                    <ChevronRight size={13} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}