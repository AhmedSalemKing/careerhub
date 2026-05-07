'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle2, BookOpen, ArrowLeft, ChevronRight } from 'lucide-react'

interface CareerPath {
  id: string
  slug: string
  title?: string
  titleEn?: string
  titleAr?: string
  descriptionEn?: string
  descriptionAr?: string
  icon?: string
  color?: string
  skills?: string[]
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

const ICON_MAP: Record<string, string> = {
  code: '💻', palette: '🎨', marketing: '📈', data: '📊',
  shield: '🛡️', devops: '⚙️', product: '📦', business: '💼',
  cloud: '☁️', megaphone: '📣', rocket: '🚀', brain: '🧠',
}

const slugToLabel: Record<string, { ar: string; en: string }> = {
  'cybersecurity': { ar: 'الأمن السيبراني', en: 'Cybersecurity' },
  'software-engineering': { ar: 'هندسة البرمجيات', en: 'Software Engineering' },
  'digital-marketing': { ar: 'التسويق الرقمي', en: 'Digital Marketing' },
  'data-science': { ar: 'علم البيانات والذكاء الاصطناعي', en: 'Data Science & AI' },
  'business-analysis': { ar: 'تحليل الأعمال', en: 'Business Analysis' },
  'backend': { ar: 'تطوير الواجهة الخلفية', en: 'Backend Development' },
  'frontend': { ar: 'تطوير الواجهة الأمامية', en: 'Frontend Development' },
  'fullstack': { ar: 'تطوير الويب الشامل', en: 'Full Stack' },
  'devops': { ar: 'ديف أوبس والسحابة', en: 'DevOps & Cloud' },
  'mobile': { ar: 'تطوير التطبيقات', en: 'Mobile Development' },
  'ui-ux': { ar: 'تصميم تجربة المستخدم', en: 'UI/UX Design' },
  'database': { ar: 'هندسة قواعد البيانات', en: 'Database Engineering' },
  'game-dev': { ar: 'تطوير الألعاب', en: 'Game Development' },
}

export default function CareerPathPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  const getPathName = (path: CareerPath): string => {
    if (path.title) return path.title
    const slug = slugToLabel[path.slug]
    if (slug) return isAr ? slug.ar : slug.en
    return path.slug
  }

  const getPathDescription = (path: CareerPath): string => {
    const desc = isAr ? path.descriptionAr : path.descriptionEn
    if (desc) return desc.split('.')[0]
    return ''
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
    } catch {
      setRecommendedCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }

  return (
    <div className="max-w-[900px] mx-auto p-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* SECTION 1: Career Paths */}
      <section className="mb-10">
        <h2 className="text-foreground font-bold text-lg mb-1">
          {isAr ? 'مساراتي المهنية' : 'My Career Paths'}
        </h2>
        <p className="text-muted text-sm mb-5">
          {isAr ? 'اختر المسارات التي تهتم بها' : 'Select paths you are interested in'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allPaths.map((path: any) => {
            const selected = myPathIds.has(path.id)
            const loading = savingPath === path.id
            const iconEmoji = ICON_MAP[path.icon] || '📁'
            const desc = getPathDescription(path)
            const skillCount = path.skills?.length || path.keywords?.length || 0
            return (
              <button
                key={path.id}
                onClick={() => togglePath(path.id)}
                disabled={loading}
                className={`relative text-right rounded-xl p-4 border-2 transition-all duration-150 cursor-pointer font-body ${
                  selected
                    ? 'border-primary bg-primary-subtle'
                    : 'border-border bg-surface hover:border-primary-border hover:bg-surface-2'
                }`}
              >
                {loading && (
                  <div className="absolute inset-0 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{iconEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${selected ? 'text-primary' : 'text-foreground'}`}>
                      {getPathName(path)}
                    </div>
                  </div>
                  {selected && (
                    <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                  )}
                </div>
                {desc && (
                  <p className="text-muted text-xs leading-relaxed mb-2 line-clamp-2">
                    {desc}
                  </p>
                )}
                {skillCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={11} className="text-muted" />
                    <span className="text-muted text-[0.7rem]">
                      {skillCount} {isAr ? 'مهارة' : 'skills'}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {myPathIds.size > 0 && (
          <p className="text-muted text-xs mt-3">
            {myPathIds.size} {isAr ? 'مسار محدد' : 'paths selected'}
          </p>
        )}
      </section>

      {/* SECTION 2: Assessment */}
      <section className="mb-10 bg-surface border border-border rounded-xl p-6">
        <h2 className="text-foreground font-bold text-lg mb-1">
          {isAr ? 'اختبار تحليل الميول' : 'Career Assessment'}
        </h2>

        {!assessmentResult ? (
          <div className="text-center py-6">
            <p className="text-muted text-sm mb-5">
              {isAr
                ? 'اكتشف المسارات المناسبة لك عبر اختبار سريع'
                : 'Discover your best-fit career paths through a quick assessment'}
            </p>
            <a
              href={`/${locale}/dashboard/assessment`}
              className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
            >
              <Sparkles size={16} />
              {isAr ? 'ابدأ الاختبار الآن' : 'Start Assessment'}
            </a>
          </div>
        ) : (
          <div>
            {assessmentResult.summary && (
              <p className="text-muted text-sm leading-relaxed mb-5">
                {assessmentResult.summary}
              </p>
            )}
            <p className="text-primary text-xs font-semibold mb-2">
              {isAr ? 'المسارات المقترحة لك:' : 'Suggested for you:'}
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {(assessmentResult.topFields || []).map((field: any) => {
                const matchedPath = allPaths.find(p => p.slug === field.fieldSlug)
                if (!matchedPath) return null
                const alreadyAdded = myPathIds.has(matchedPath.id)
                return (
                  <button
                    key={field.fieldSlug}
                    onClick={() => !alreadyAdded && togglePath(matchedPath.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-body border transition-all ${
                      alreadyAdded
                        ? 'bg-primary-subtle border-primary text-primary'
                        : 'bg-transparent border-primary-border text-muted hover:bg-primary-subtle hover:text-primary'
                    }`}
                  >
                    {alreadyAdded && <CheckCircle2 size={11} />}
                    {isAr ? (field.titleAr || slugToLabel[field.fieldSlug]?.ar || field.fieldSlug) : (field.titleEn || slugToLabel[field.fieldSlug]?.en || field.fieldSlug)}
                    <span className="text-muted text-[0.7rem]">
                      {Math.round((field.confidence || 0) * 100)}%
                    </span>
                  </button>
                )
              })}
            </div>
            <a
              href={`/${locale}/dashboard/assessment`}
              className="text-muted text-xs border-b border-border/50 no-underline hover:text-primary"
            >
              {isAr ? 'إعادة الاختبار' : 'Retake assessment'}
            </a>
          </div>
        )}
      </section>

      {/* SECTION 3: Recommended Courses */}
      <section>
        <h2 className="text-foreground font-bold text-lg mb-1">
          {isAr ? 'الكورسات المرتبطة بمساراتك' : 'Courses for Your Paths'}
        </h2>
        <p className="text-muted text-sm mb-5">
          {isAr
            ? 'كورسات مختارة بناء على مساراتك المهنية المختارة'
            : 'Curated based on your selected career paths'}
        </p>

        {myPathIds.size === 0 ? (
          <div className="text-center py-10 bg-surface border border-border rounded-xl">
            <p className="text-muted text-sm">
              {isAr
                ? 'اختر مساراً من الأعلى'
                : 'Select a career path above'}
            </p>
          </div>
        ) : loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-[160px] bg-surface-2 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recommendedCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedCourses.map((course: any) => (
              <a
                key={course.id}
                href={`/${locale}/courses/${course.id}`}
                className="block no-underline bg-surface border border-border rounded-xl overflow-hidden hover:border-primary-border transition-all duration-150"
              >
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt=""
                    className="w-full h-[110px] object-cover" />
                ) : (
                  <div className="w-full h-[110px] bg-primary-subtle flex items-center justify-center">
                    <BookOpen size={24} className="text-primary/40" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-foreground text-sm font-semibold mb-1 line-clamp-2 leading-relaxed">
                    {isAr ? (course.titleAr || course.titleEn || course.title) : (course.titleEn || course.title)}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-[0.7rem]">
                      {course.level || ''}
                    </span>
                    <span className="text-primary text-xs font-semibold">
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
          <div className="text-center py-8 bg-surface border border-border rounded-xl">
            <p className="text-muted text-sm mb-2">
              {isAr ? 'لا توجد كورسات مرتبطة بهذه المسارات حالياً' : 'No courses yet for these paths'}
            </p>
            <a href={`/${locale}/courses`}
              className="text-primary text-xs no-underline hover:underline">
              {isAr ? 'استعرض جميع الكورسات' : 'Browse all courses'}
            </a>
          </div>
        )}
      </section>
    </div>
  )
}
