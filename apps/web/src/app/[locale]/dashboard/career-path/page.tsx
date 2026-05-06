'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react'

interface CareerPath {
  id: string
  slug: string
  title?: string  // API returns title (mapped from titleEn/titleAr based on locale)
  nameEn?: string
  nameAr?: string
  keywords?: string[]
}

interface UserCareerPath {
  id: string
  careerPathId: string
  source: string
  careerPath: CareerPath
}

interface Course {
  id: string
  title: string
  titleAr?: string
  titleEn?: string
  thumbnail?: string
  price: number
  level?: string
  slug?: string
}

interface AssessmentResult {
  topFields: Array<{
    fieldSlug: string
    titleAr: string
    titleEn: string
    confidence: number
    skills: string[]
  }>
  summary?: string
}

const slugToLabel: Record<string, { ar: string; en: string }> = {
  'cybersecurity':      { ar: 'الأمن السيبراني', en: 'Cybersecurity' },
  'software-engineering': { ar: 'هندسة البرمجيات', en: 'Software Engineering' },
  'digital-marketing':   { ar: 'التسويق الرقمي', en: 'Digital Marketing' },
  'data-science':       { ar: 'علم البيانات والذكاء الاصطناعي', en: 'Data Science & AI' },
  'business-analysis':  { ar: 'تحليل الأعمال', en: 'Business Analysis' },
  'backend':            { ar: 'تطوير الواجهة الخلفية', en: 'Backend Development' },
  'frontend':           { ar: 'تطوير الواجهة الأمامية', en: 'Frontend Development' },
  'fullstack':          { ar: 'تطوير الويب الشامل', en: 'Full Stack' },
  'devops':             { ar: 'ديف أوبس والسحابة', en: 'DevOps & Cloud' },
  'mobile':             { ar: 'تطوير التطبيقات', en: 'Mobile Development' },
  'ui-ux':              { ar: 'تصميم تجربة المستخدم', en: 'UI/UX Design' },
  'database':           { ar: 'هندسة قواعد البيانات', en: 'Database Engineering' },
  'game-dev':           { ar: 'تطوير الألعاب', en: 'Game Development' },
}

export default function CareerPathPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  const getPathLabel = (path: CareerPath): string => {
    // API returns title (already localized by backend)
    if (path.title) return path.title as string
    // Fallback: use slug-to-label mapping
    const mapping = slugToLabel[path.slug]
    if (mapping) return isAr ? mapping.ar : mapping.en
    return path.slug
  }

  const [allPaths, setAllPaths] = useState<CareerPath[]>([])
  const [myPathIds, setMyPathIds] = useState<Set<string>>(new Set())
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [savingPath, setSavingPath] = useState<string | null>(null)

  const apiBase = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
    : 'http://localhost:3001/api'

  const getToken = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || ''
  }

  useEffect(() => {
    const init = async () => {
      const token = getToken()
      if (!token) return

      try {
        const [pathsRes, myPathsRes, resultRes] = await Promise.all([
          fetch(`${apiBase}/career/paths`),
          fetch(`${apiBase}/career/paths/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBase}/career/assessment/result`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const [pathsData, myData, resultData] = await Promise.all([
          pathsRes.json(),
          myPathsRes.json(),
          resultRes.json(),
        ])

        setAllPaths(pathsData?.data || [])

        const myIds = new Set<string>(
          (myData?.data || []).map((p: any) => p.careerPathId || p.id)
        )
        setMyPathIds(myIds)

        if (resultData?.success && resultData?.data?.topFields?.length > 0) {
          setAssessmentResult(resultData.data)
        }

        if (myIds.size > 0) {
          fetchCoursesByPaths([...myIds])
        }
      } catch (e) {
        console.error('[CareerPath] Init failed:', e)
      }
    }
    init()
  }, [])

  const togglePath = async (pathId: string) => {
    const token = getToken()
    if (!token) return
    setSavingPath(pathId)

    const newIds = new Set(myPathIds)
    const isRemoving = newIds.has(pathId)

    try {
      if (isRemoving) {
        newIds.delete(pathId)
        await fetch(`${apiBase}/career/paths/remove/${pathId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      } else {
        newIds.add(pathId)
        await fetch(`${apiBase}/career/paths/add/${pathId}?source=MANUAL`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }

      setMyPathIds(newIds)
      fetchCoursesByPaths([...newIds])
    } finally {
      setSavingPath(null)
    }
  }

  const fetchCoursesByPaths = async (pathIds: string[]) => {
    if (pathIds.length === 0) { setRecommendedCourses([]); return }
    setLoadingCourses(true)
    try {
      const token = getToken()
      const res = await fetch(
        `${apiBase}/courses/recommended?paths=${pathIds.join(',')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setRecommendedCourses(data?.data || [])
    } catch (e) {
      setRecommendedCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }

  const bg = '#1a1a2e'
  const border = 'rgba(255,255,255,0.07)'
  const text = '#f0f0f8'
  const subtext = '#6666a0'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem', direction: isAr ? 'rtl' : 'ltr' }}>

      {/* SECTION 1: My Career Paths */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: text, fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.4rem' }}>
          {isAr ? 'مساراتي المهنية' : 'My Career Paths'}
        </h2>
        <p style={{ color: subtext, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {isAr ? 'اختر المسارات التي تهتم بها' : 'Select paths you are interested in'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {allPaths.map((path: any) => {
            const selected = myPathIds.has(path.id)
            const loading = savingPath === path.id
            return (
              <button
                key={path.id}
                onClick={() => togglePath(path.id)}
                disabled={loading}
                style={{
                  padding: '8px 18px',
                  borderRadius: 24,
                  border: selected
                    ? '1.5px solid #c9a96e'
                    : '1px solid rgba(255,255,255,0.12)',
                  background: selected
                    ? 'rgba(201,169,110,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  color: selected ? '#c9a96e' : '#9999b8',
                  fontSize: '0.88rem',
                  fontWeight: selected ? 600 : 400,
                  cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {selected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {getPathLabel(path)}
              </button>
            )
          })}
        </div>
        {myPathIds.size > 0 && (
          <p style={{ color: '#555580', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {myPathIds.size} {isAr ? 'مسار محدد' : 'paths selected'}
          </p>
        )}
      </section>

      {/* SECTION 2: Assessment */}
      <section style={{
        marginBottom: '2.5rem',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '1.5rem',
      }}>
        <h2 style={{ color: text, fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.4rem' }}>
          {isAr ? 'اختبار تحليل الميول' : 'Career Assessment'}
        </h2>

        {!assessmentResult ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ color: subtext, fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              {isAr
                ? 'اكتشف المسارات المناسبة لك عبر اختبار سريع'
                : 'Discover your best-fit career paths through a quick assessment'}
            </p>
            <a
              href={`/${locale}/dashboard/assessment`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg,#c9a96e,#b8935a)',
                color: '#1a1a2e', fontWeight: 700, fontSize: '0.95rem',
                borderRadius: 10, textDecoration: 'none', fontFamily: 'inherit',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              {isAr ? 'ابدأ الاختبار الآن' : 'Start Assessment'}
            </a>
          </div>
        ) : (
          <div>
            {assessmentResult.summary && (
              <p style={{ color: '#9999b8', fontSize: '0.88rem',
                lineHeight: 1.7, marginBottom: '1.25rem' }}>
                {assessmentResult.summary}
              </p>
            )}

            <p style={{ color: '#c9a96e', fontSize: '0.82rem', fontWeight: 600,
              marginBottom: '0.6rem' }}>
              {isAr ? 'المسارات المقترحة لك:' : 'Suggested for you:'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8,
              marginBottom: '1.25rem' }}>
              {(assessmentResult.topFields || []).map((field: any) => {
                const matchedPath = allPaths.find(p => p.slug === field.fieldSlug)
                if (!matchedPath) return null
                const alreadyAdded = myPathIds.has(matchedPath.id)
                return (
                  <button
                    key={field.fieldSlug}
                    onClick={() => !alreadyAdded && togglePath(matchedPath.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: alreadyAdded
                        ? '1.5px solid #c9a96e'
                        : '1px solid rgba(201,169,110,0.3)',
                      background: alreadyAdded
                        ? 'rgba(201,169,110,0.12)'
                        : 'transparent',
                      color: alreadyAdded ? '#c9a96e' : '#b8a060',
                      fontSize: '0.82rem',
                      cursor: alreadyAdded ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {alreadyAdded && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {isAr ? (field.titleAr || slugToLabel[field.fieldSlug]?.ar || field.fieldSlug) : (field.titleEn || slugToLabel[field.fieldSlug]?.en || field.fieldSlug)}
                    <span style={{ color: '#666680', fontSize: '0.73rem' }}>
                      {Math.round((field.confidence || 0) * 100)}%
                    </span>
                  </button>
                )
              })}
            </div>

            <a
              href={`/${locale}/dashboard/assessment`}
              style={{
                color: '#6666a0', fontSize: '0.82rem',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(102,102,128,0.3)',
              }}
            >
              {isAr ? 'إعادة الاختبار' : 'Retake assessment'}
            </a>
          </div>
        )}
      </section>

      {/* SECTION 3: Recommended Courses */}
      <section>
        <h2 style={{ color: text, fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.4rem' }}>
          {isAr ? 'الكورسات المرتبطة بمساراتك' : 'Courses for Your Paths'}
        </h2>
        <p style={{ color: subtext, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {isAr
            ? 'كورسات مختارة بناء على مساراتك المهنية المختارة'
            : 'Curated based on your selected career paths'}
        </p>

        {myPathIds.size === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <p style={{ color: '#555580', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              {isAr
                ? 'اختر مسارا من الأعلى لعرض الكورسات المرتبطة'
                : 'Select a career path above to see related courses'}
            </p>
          </div>
        ) : loadingCourses ? (
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
            gap: 12 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: 160,
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                animation: 'pulse 1.5s infinite' }}/>
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
          </div>
        ) : recommendedCourses.length > 0 ? (
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
            gap: 12 }}>
            {recommendedCourses.map((course: any) => (
              <a
                key={course.id}
                href={`/${locale}/courses/${course.id}`}
                style={{
                  display: 'block', textDecoration: 'none',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
                onMouseLeave={e =>
                  (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt=""
                    style={{ width: '100%', height: 110, objectFit: 'cover' }}/>
                ) : (
                  <div style={{ width: '100%', height: 110,
                    background: 'rgba(201,169,110,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(201,169,110,0.4)" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                )}
                <div style={{ padding: '0.75rem' }}>
                  <p style={{ color: text, fontSize: '0.85rem', fontWeight: 600,
                    margin: '0 0 4px', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', lineHeight: 1.4 }}>
                    {isAr ? (course.titleAr || course.titleEn || course.title) : (course.titleEn || course.title)}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center' }}>
                    <span style={{ color: subtext, fontSize: '0.75rem' }}>
                      {course.level || ''}
                    </span>
                    <span style={{ color: '#c9a96e', fontSize: '0.8rem', fontWeight: 600 }}>
                      {course.price === 0
                        ? (isAr ? 'مجاني' : 'Free')
                        : `${course.price}`}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <p style={{ color: '#555580', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              {isAr ? 'لا توجد كورسات مرتبطة بهذه المسارات حالياً' : 'No courses yet for these paths'}
            </p>
            <a href={`/${locale}/courses`}
              style={{ color: '#c9a96e', fontSize: '0.82rem', textDecoration: 'none' }}>
              {isAr ? 'استعرض جميع الكورسات' : 'Browse all courses'}
            </a>
          </div>
        )}
      </section>
    </div>
  )
}
