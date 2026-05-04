'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Plus, CheckCircle2, BookOpen, BarChart3,
  ChevronRight, Target, Briefcase, RefreshCw, X,
  Code2, Palette, TrendingUp, Shield, Settings, Package,
  BarChart, Users, Award, Cloud,
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
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])

  const [assessmentResult, setAssessmentResult] = useState<any>(null)
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [fieldCourses, setFieldCourses] = useState<Record<string, any[]>>({})
  const [loadingField, setLoadingField] = useState<string | null>(null)
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const gold = '#c9a96e'

  useEffect(() => {
    try {
      const savedPaths = localStorage.getItem('selectedCareerPaths')
      const savedResults = localStorage.getItem('assessmentResults')
      if (savedPaths) setSelectedPaths(JSON.parse(savedPaths))
      if (savedResults) setAssessmentResults(JSON.parse(savedResults))
    } catch (e) { }
  }, [])

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('deveway_token') || localStorage.getItem('token') || ''
          : ''
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
        const res = await fetch(`${apiUrl}/career/assessment/result`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        const data = await res.json()
        if (data?.success && data?.data?.topFields?.length > 0) {
          setAssessmentResult(data.data)
          fetchRecommendedCourses(
            data.data.recommendedPaths || [],
            data.data.topFields.map((f: any) => f.fieldSlug),
          )
        }
      } catch (e) { }
    }
    fetchResult()
  }, [])

  const togglePath = (id: string) => {
    setSelectedPaths(prev => {
      const next = prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
      localStorage.setItem('selectedCareerPaths', JSON.stringify(next))
      return next
    })
  }

  const handleFieldClick = async (fieldSlug: string) => {
    if (expandedField === fieldSlug) {
      setExpandedField(null)
      return
    }
    setExpandedField(fieldSlug)
    if (fieldCourses[fieldSlug]) return

    setLoadingField(fieldSlug)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
      const res = await fetch(`${apiUrl}/courses/by-field/${fieldSlug}`)
      const data = await res.json()
      setFieldCourses(prev => ({ ...prev, [fieldSlug]: data?.data ?? [] }))
    } catch (e) {
      setFieldCourses(prev => ({ ...prev, [fieldSlug]: [] }))
    } finally {
      setLoadingField(null)
    }
  }

  const fetchRecommendedCourses = async (
    pathIds: string[],
    fieldSlugs: string[],
  ) => {
    setLoadingRecommended(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
      const params = new URLSearchParams()
      if (pathIds.length > 0) params.set('paths', pathIds.join(','))
      if (fieldSlugs.length > 0) params.set('fields', fieldSlugs.join(','))

      const token = typeof window !== 'undefined'
        ? localStorage.getItem('deveway_token') || localStorage.getItem('token') || ''
        : ''

      const res = await fetch(
        `${apiUrl}/courses/recommended?${params.toString()}`,
        { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      )
      const data = await res.json()
      setRecommendedCourses(data?.data ?? [])
    } catch (e) {
      setRecommendedCourses([])
    } finally {
      setLoadingRecommended(false)
    }
  }

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
              {isAr ? 'اكتشف مسارك واحفظ تقدمك واستكشف الكورسات المناسبة' : 'Discover your path, save progress, and explore matching courses'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { key: 'paths' as TabKey, labelAr: 'مساراتي المهنية', labelEn: 'My Career Paths', icon: <Target size={15} /> },
              { key: 'assessment' as TabKey, labelAr: 'الاختبار الذكي', labelEn: 'Smart Assessment', icon: <Sparkles size={15} /> },
              { key: 'courses' as TabKey, labelAr: 'الكورسات المقترحة', labelEn: 'Recommended Courses', icon: <BookOpen size={15} /> },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                color: activeTab === tab.key ? '#5120c8' : subtext,
                borderBottom: `2px solid ${activeTab === tab.key ? '#5120c8' : 'transparent'}`,
                transition: 'all 0.15s', marginBottom: -1,
              }}>
                {tab.icon}
                {isAr ? tab.labelAr : tab.labelEn}
                {tab.key === 'paths' && selectedPaths.length > 0 && (
                  <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 800, background: '#5120c8', color: '#ffffff' }}>
                    {selectedPaths.length}
                  </span>
                )}
                {tab.key === 'assessment' && (assessmentResult?.topFields?.length > 0 || assessmentResults.length > 0) && (
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
            {(assessmentResult?.topFields?.length > 0 || assessmentResults.length > 0) && (
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
                    {assessmentResult?.topFields?.[0]
                      ? (isAr
                        ? `المسار الأنسب: ${assessmentResult.topFields[0].title || assessmentResult.topFields[0].titleAr} (${Math.round((assessmentResult.topFields[0].confidence || 0) * 100)}%)`
                        : `Best match: ${assessmentResult.topFields[0].titleEn || assessmentResult.topFields[0].title} (${Math.round((assessmentResult.topFields[0].confidence || 0) * 100)}%)`)
                      : (isAr
                        ? `المسار الأنسب: ${assessmentResults[0]?.titleAr} (${assessmentResults[0]?.normalized}%)`
                        : `Best match: ${assessmentResults[0]?.titleEn} (${assessmentResults[0]?.normalized}%)`)}
                  </div>
                </div>
                <button onClick={() => setActiveTab('assessment')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(81,32,200,0.3)', background: 'transparent', color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
                  <RefreshCw size={12} />
                  {isAr ? 'أعد الاختبار' : 'Retake'}
                </button>
              </div>
            )}

            {selectedPaths.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'مساراتي المختارة' : 'My Selected Paths'}</h3>
                  <span style={{ color: subtext, fontSize: 12 }}>{selectedPaths.length} / 5 {isAr ? 'مسارات' : 'paths'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedPaths.map(id => {
                    const path = CAREER_PATHS.flatMap(c => c.paths).find(p => p.id === id)
                    if (!path) return null
                    const IconComp = ICON_MAP[path.icon] || Briefcase
                    return (
                      <div key={id} style={{
                        padding: '16px 20px', borderRadius: 14,
                        border: '1.5px solid rgba(81,32,200,0.3)',
                        background: isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.02)',
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp size={18} color="#5120c8" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: text, fontSize: 14, fontWeight: 700 }}>{isAr ? path.titleAr : path.title}</div>
                          <div style={{ color: subtext, fontSize: 12, marginTop: 2 }}>${path.salary} SAR{isAr ? '/شهرياً' : '/month'}</div>
                        </div>
                        <button onClick={() => setActiveTab('courses')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                          <BookOpen size={12} />
                          {isAr ? 'كورسات' : 'Courses'}
                        </button>
                        <button onClick={() => togglePath(id)} style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}>
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
              {selectedPaths.length < 5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: subtext, fontSize: 12 }}>
                  <Plus size={13} />
                  {isAr ? `يمكنك إضافة ${5 - selectedPaths.length} مسارات أخرى` : `You can add ${5 - selectedPaths.length} more paths`}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {CAREER_PATHS.slice(0, 18).map(cat => cat.paths.slice(0, 3).map(path => {
                const IconComp = ICON_MAP[path.icon] || Briefcase
                const isSelected = selectedPaths.includes(path.id)
                return (
                  <div key={path.id} style={{
                    padding: '18px', borderRadius: 14,
                    border: `1.5px solid ${isSelected ? 'rgba(81,32,200,0.4)' : border}`,
                    background: isSelected ? (isDark ? 'rgba(81,32,200,0.08)' : 'rgba(81,32,200,0.03)') : cardBg,
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
                  }}
                    onClick={() => { if (!isSelected && selectedPaths.length >= 5) return; togglePath(path.id) }}>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 12, left: isAr ? 12 : 'auto', right: isAr ? 'auto' : 12 }}>
                        <CheckCircle2 size={18} color="#5120c8" />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: isSelected ? 'rgba(81,32,200,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f8'), border: `1px solid ${isSelected ? 'rgba(81,32,200,0.2)' : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconComp size={16} color={isSelected ? '#5120c8' : subtext} />
                      </div>
                      <h4 style={{ color: text, fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{isAr ? path.titleAr : path.title}</h4>
                    </div>
                    <p style={{ color: subtext, fontSize: 12, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{isAr ? path.descriptionAr : path.descriptionEn}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5120c8', fontSize: 12, fontWeight: 700 }}>${path.salary}+</span>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: isSelected ? 'rgba(81,32,200,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f8'), color: isSelected ? '#5120c8' : subtext, border: `1px solid ${isSelected ? 'rgba(81,32,200,0.2)' : border}` }}>
                        {isSelected ? (isAr ? 'تم الاختيار' : 'Selected') : (isAr ? 'اختر' : 'Select')}
                      </span>
                    </div>
                  </div>
                )
              })).flat()}
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
            {assessmentResult?.topFields?.length > 0 ? (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  borderRadius: '16px',
                  padding: '1.5rem 2rem',
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#c9a96e" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <span style={{ color: '#c9a96e', fontWeight: 600, fontSize: '1rem' }}>
                      {isAr ? 'نتيجة تحليل ميولك المهنية' : 'Career Interest Analysis'}
                    </span>
                  </div>
                  {assessmentResult.summary && (
                    <p style={{ color: '#c8c8d8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                      {assessmentResult.summary}
                    </p>
                  )}
                </div>

                <div>
                  <h3 style={{ color: '#f0f0f8', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>
                    {isAr ? 'المجالات المقترحة لك' : 'Suggested Fields for You'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {assessmentResult.topFields.map((field: any, index: number) => (
                      <div key={field.fieldSlug}>
                        <div
                          onClick={() => handleFieldClick(field.fieldSlug)}
                          style={{
                            background: expandedField === field.fieldSlug
                              ? 'rgba(201,169,110,0.08)'
                              : 'rgba(255,255,255,0.03)',
                            border: expandedField === field.fieldSlug
                              ? '1px solid rgba(201,169,110,0.4)'
                              : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: expandedField === field.fieldSlug
                              ? '12px 12px 0 0' : '12px',
                            padding: '1rem 1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: index === 0 ? '#c9a96e' :
                                  index === 1 ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.1)',
                                color: index === 0 ? '#1a1a2e' : '#f0f0f8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 700,
                              }}>
                                {index + 1}
                              </div>
                              <div>
                                <p style={{ color: '#f0f0f8', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                                  {isAr ? (field.title || field.titleAr) : (field.titleEn || field.title)}
                                </p>
                                <p style={{ color: '#9999aa', fontSize: '0.8rem', margin: 0 }}>
                                  {isAr ? (field.titleEn || field.title) : (field.titleAr || field.titleEn)}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ textAlign: 'end' }}>
                                <div style={{ color: '#c9a96e', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                                  {Math.round((field.confidence || 0) * 100)}%
                                </div>
                                <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                  <div style={{
                                    width: `${Math.round((field.confidence || 0) * 100)}%`,
                                    height: '100%', borderRadius: '2px',
                                    background: 'linear-gradient(90deg, #c9a96e, #b8935a)',
                                  }} />
                                </div>
                              </div>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="#9999aa" strokeWidth="2" strokeLinecap="round"
                                style={{
                                  transform: expandedField === field.fieldSlug
                                    ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </div>

                          {field.skills?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.75rem' }}>
                              {field.skills.map((skill: string) => (
                                <span key={skill} style={{
                                  background: 'rgba(201,169,110,0.1)',
                                  color: '#c9a96e',
                                  border: '1px solid rgba(201,169,110,0.25)',
                                  borderRadius: '20px',
                                  padding: '2px 10px',
                                  fontSize: '0.75rem',
                                }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          {field.reasoning && (
                            <p style={{ color: '#8888a0', fontSize: '0.82rem', marginTop: '0.6rem', lineHeight: 1.6, margin: '0.6rem 0 0' }}>
                              {field.reasoning}
                            </p>
                          )}
                        </div>

                        {expandedField === field.fieldSlug && (
                          <div style={{
                            border: '1px solid rgba(201,169,110,0.4)',
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.2)',
                          }}>
                            <p style={{ color: '#9999aa', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                              {isAr
                                ? `الكورسات المتاحة في ${field.title || field.titleAr}`
                                : `Available courses in ${field.titleEn || field.title}`}
                            </p>

                            {loadingField === field.fieldSlug ? (
                              <div style={{ display: 'flex', gap: 12 }}>
                                {[1, 2, 3].map(i => (
                                  <div key={i} style={{
                                    flex: '0 0 200px', height: '90px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px', animation: 'pulse 1.5s infinite',
                                  }} />
                                ))}
                              </div>
                            ) : fieldCourses[field.fieldSlug]?.length > 0 ? (
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px',
                              }}>
                                {fieldCourses[field.fieldSlug].map((course: any) => (
                                  <a
                                    key={course.id}
                                    href={`/${locale}/courses/${course.id}`}
                                    style={{
                                      display: 'block',
                                      background: 'rgba(255,255,255,0.04)',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      borderRadius: '8px',
                                      padding: '0.75rem',
                                      textDecoration: 'none',
                                      transition: 'border-color 0.2s',
                                    }}
                                    onMouseEnter={e =>
                                      (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
                                    onMouseLeave={e =>
                                      (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                                  >
                                    {course.thumbnail && (
                                      <img src={course.thumbnail} alt=""
                                        style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                                      />
                                    )}
                                    <p style={{ color: '#f0f0f8', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {isAr ? (course.titleAr || course.titleEn) : course.titleEn}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ color: '#9999aa', fontSize: '0.73rem' }}>
                                        {isAr ? course.level : course.level}
                                      </span>
                                      <span style={{ color: '#c9a96e', fontSize: '0.78rem', fontWeight: 600 }}>
                                        {course.price === 0
                                          ? (isAr ? 'مجاني' : 'Free')
                                          : `${course.price} ${course.currency || 'SAR'}`}
                                      </span>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#666680' }}>
                                <p style={{ fontSize: '0.85rem' }}>
                                  {isAr
                                    ? 'سيتم إضافة كورسات في هذا المجال قريبا'
                                    : 'Courses for this field coming soon'}
                                </p>
                                <a href={`/${locale}/courses`}
                                  style={{ color: '#c9a96e', fontSize: '0.82rem', textDecoration: 'none' }}>
                                  {isAr ? 'استعرض جميع الكورسات' : 'Browse all courses'}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ color: '#f0f0f8', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>
                    {isAr ? 'كورسات مقترحة لمساراتك' : 'Recommended for Your Paths'}
                  </h3>
                  {loadingRecommended ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }} />
                      ))}
                    </div>
                  ) : recommendedCourses.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                      {recommendedCourses.map((course: any) => (
                        <a
                          key={course.id}
                          href={`/${locale}/courses/${course.id}`}
                          style={{
                            display: 'block',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '1rem',
                            textDecoration: 'none',
                          }}
                        >
                          {course.thumbnail && (
                            <img src={course.thumbnail} alt=""
                              style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }}
                            />
                          )}
                          <p style={{ color: '#f0f0f8', fontSize: '0.88rem', fontWeight: 600, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {isAr ? (course.titleAr || course.titleEn) : course.titleEn}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9999aa', fontSize: '0.78rem' }}>
                              {course.instructor?.profile
                                ? `${course.instructor.profile.firstName} ${course.instructor.profile.lastName}`
                                : ''}
                            </span>
                            <span style={{ color: '#c9a96e', fontSize: '0.82rem', fontWeight: 600 }}>
                              {course.price === 0
                                ? (isAr ? 'مجاني' : 'Free')
                                : `${course.price}`}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                      <p style={{ color: '#666680', marginBottom: '0.75rem' }}>
                        {isAr
                          ? 'أكمل اختبار تحليل الميول لرؤية الكورسات المقترحة'
                          : 'Complete the assessment to see recommended courses'}
                      </p>
                      <a href={`/${locale}/courses`}
                        style={{ color: '#c9a96e', fontSize: '0.88rem', textDecoration: 'none', borderBottom: '1px solid rgba(201,169,110,0.3)' }}>
                        {isAr ? 'استعرض جميع الكورسات' : 'Browse all courses'}
                      </a>
                    </div>
                  )}
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
            {selectedPaths.length === 0 && !assessmentResult?.recommendedPaths?.length ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <BookOpen size={40} color={subtext} style={{ marginBottom: 16 }} />
                <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{isAr ? 'اختر مسارا أولا' : 'Select a Path First'}</h3>
                <p style={{ color: subtext, fontSize: 14, margin: '0 0 20px' }}>{isAr ? 'اختر مسارك المهني لنعرض لك الكورسات المناسبة' : 'Choose your career path to see matching courses'}</p>
                <button onClick={() => setActiveTab('paths')} style={{ padding: '10px 22px', borderRadius: 10, cursor: 'pointer', background: '#5120c8', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 700 }}>{isAr ? 'اختر مسارا' : 'Choose a Path'}</button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 4px' }}>{isAr ? 'الكورسات المقترحة لمساراتك' : 'Recommended Courses for Your Paths'}</h3>
                  <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
                    {assessmentResult?.recommendedPaths?.length
                      ? (isAr ? `بناء على ${assessmentResult.recommendedPaths.length} مسار محدد من التحليل` : `Based on ${assessmentResult.recommendedPaths.length} paths from your analysis`)
                      : (isAr ? `بناء على ${selectedPaths.length} مسار مختار` : `Based on ${selectedPaths.length} selected path${selectedPaths.length > 1 ? 's' : ''}`)}
                  </p>
                </div>

                {loadingRecommended ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} style={{ height: 200, borderRadius: 14, background: isDark ? '#1a1a1a' : '#f4f4f8' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: 14, animation: 'pulse 1.5s infinite', background: isDark ? '#222' : '#efefef' }} />
                      </div>
                    ))}
                  </div>
                ) : recommendedCourses.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {recommendedCourses.map((course: any) => (
                      <div key={course.id} style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardBg, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => window.open(`https://deveway-teal.vercel.app/${locale}/courses/${course.slug || course.id}`, '_blank')}>
                        <div style={{ height: 120, background: isDark ? '#1a1a1a' : '#f8f8fa', overflow: 'hidden' }}>
                          {course.thumbnail ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={28} color={subtext} /></div>}
                        </div>
                        <div style={{ padding: '14px' }}>
                          <h4 style={{ color: text, fontSize: 13, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4 }}>{isAr ? (course.titleAr || course.titleEn) : (course.titleEn || course.titleAr)}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#5120c8', fontSize: 13, fontWeight: 800 }}>{course.price > 0 ? `${course.price} ر.س` : (isAr ? 'مجاني' : 'Free')}</span>
                            <Award size={13} color={subtext} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <BookOpen size={36} color={subtext} style={{ marginBottom: 12 }} />
                    <p style={{ color: subtext, fontSize: 14, marginBottom: 16 }}>
                      {isAr ? 'لا توجد كورسات منشورة حالياً' : 'No published courses yet'}
                    </p>
                    <button
                      onClick={() => window.open(`https://deveway-teal.vercel.app/${locale}/courses`, '_blank')}
                      style={{
                        padding: '10px 22px', borderRadius: 10,
                        background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 700,
                      }}>
                      {isAr ? 'استعرض جميع الكورسات' : 'Browse All Courses'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
