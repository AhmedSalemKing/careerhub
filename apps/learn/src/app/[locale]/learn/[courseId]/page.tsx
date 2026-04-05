'use client'
import { useState, useEffect, Suspense } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { get, post } from '../../../../lib/api'
import { getMediaUrl } from '../../../../lib/media'
import { Lock, Play, BookOpen, ArrowRight, Sparkles } from 'lucide-react'

function LearnPageInner() {
  const params = useParams()
  const courseId = params.courseId as string
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const lessonParam = searchParams.get('lesson')
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Auth guard — check localStorage first, then cookie (token written by port 3000)
  useEffect(() => {
    const token = localStorage.getItem('deveway_token')
      || document.cookie.match(/deveway_token=([^;]+)/)?.[1]

    if (!token) {
      const MAIN = process.env.NEXT_PUBLIC_MAIN_URL || ''
      window.location.href = `${MAIN}/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    // Sync cookie token into localStorage so API interceptor can use it
    if (!localStorage.getItem('deveway_token')) {
      localStorage.setItem('deveway_token', token)
    }

    // Sync user data from cookie into localStorage if missing
    if (!localStorage.getItem('deveway_user')) {
      const m = document.cookie.match(/deveway_user=([^;]+)/)
      if (m) {
        try { localStorage.setItem('deveway_user', decodeURIComponent(m[1])) } catch {}
      }
    }

    setAuthChecked(true)
  }, [locale])

  const { data: course, isLoading } = useQuery({
    queryKey: ['learn-course', courseId],
    enabled: !!courseId && authChecked,
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      const d = (res?.data as any)?.data?.course ?? (res?.data as any)?.data ?? (res?.data as any)
      return d
    },
  })

  const { data: enrollment } = useQuery({
    queryKey: ['learn-enrollment', courseId],
    enabled: !!courseId && authChecked,
    queryFn: async () => {
      try {
        const res = await get(`/courses/${courseId}/enrollment`)
        return (res?.data as any)?.data?.enrollment ?? null
      } catch { return null }
    },
  })

  const isEnrolled = !!enrollment

  // Auto-select lesson from URL param or first lesson
  useEffect(() => {
    if (!course || !isEnrolled) return

    if (lessonParam) {
      setActiveLessonId(lessonParam)
      return
    }

    if (!activeLessonId) {
      const firstLesson = course?.sections?.[0]?.lessons?.[0]
      if (firstLesson) setActiveLessonId(firstLesson.id)
    }
  }, [lessonParam, isEnrolled, course, activeLessonId])

  const sections = course?.sections ?? course?.modules ?? []
  const allLessons = sections.flatMap((s: any) => s.lessons || [])
  const activeLesson = allLessons.find((l: any) => l.id === activeLessonId)
  const videoUrl = getMediaUrl(activeLesson?.videoUrl)
  const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''

  if (!authChecked || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isEnrolled === false && enrollment !== undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" dir="rtl">
        <div className="text-center max-w-md">
          <Lock className="mx-auto mb-4 h-16 w-16 opacity-40" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-bold font-madinet mb-2" style={{ color: 'var(--text-primary)' }}>
            الكورس مقيّد
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            يجب الاشتراك في هذا الكورس للوصول إلى المحتوى
          </p>
          <a
            href={`${MAIN_URL}/${locale}/checkout/${courseId}`}
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3 font-bold text-white"
            style={{ background: 'var(--primary)' }}
          >
            اشترك الآن
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row" dir="rtl">

      {/* Sidebar - Curriculum */}
      <aside
        className="w-full lg:w-80 shrink-0 overflow-y-auto lg:h-screen lg:sticky lg:top-0"
        style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold font-madinet line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {course?.titleAr || course?.titleEn || course?.title}
          </h2>
        </div>

        <div className="p-3 space-y-2">
          {sections.map((section: any) => (
            <div key={section.id}>
              <div
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {section.title || section.titleAr || section.titleEn}
              </div>
              <div className="space-y-1">
                {(section.lessons || []).map((lesson: any) => {
                  const canAccess = lesson.isFree || isEnrolled
                  const isActive = activeLessonId === lesson.id
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => canAccess && setActiveLessonId(lesson.id)}
                      disabled={!canAccess}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition-all"
                      style={{
                        background: isActive ? 'var(--primary)' : 'transparent',
                        color: isActive ? 'white' : canAccess ? 'var(--text-primary)' : 'var(--text-muted)',
                        opacity: canAccess ? 1 : 0.5,
                        cursor: canAccess ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--surface-2, #1e293b)' }}
                      >
                        {canAccess ? <Play className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      </div>
                      <span className="flex-1 line-clamp-2 text-right">{lesson.title || lesson.titleAr}</span>
                      {lesson.isFree && !isActive && (
                        <span className="shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          مجاني
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Floating AI Button */}
      <a
        href={`${MAIN_URL}/${locale}/dashboard/ai-chat`}
        title="اسأل الذكاء الاصطناعي"
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/40 hover:scale-110 transition-all"
      >
        <Sparkles className="h-7 w-7 text-white" />
      </a>

      {/* Main Content - Video Player */}
      <main className="flex-1 overflow-auto">
        {activeLessonId && activeLesson ? (
          <div>
            {/* Video */}
            <div className="bg-black aspect-video w-full">
              {videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full"
                  onEnded={() => {
                    post(`/courses/${courseId}/lessons/${activeLessonId}/complete`, {}).catch(() => {})
                    qc.invalidateQueries({ queryKey: ['learn-enrollment', courseId] })
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/40">
                  <div className="text-center">
                    <Play className="mx-auto h-16 w-16 mb-3 opacity-30" />
                    <p className="text-sm">لا يوجد فيديو لهذا الدرس</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Info */}
            <div className="p-6">
              <h1
                className="text-2xl font-bold font-madinet mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {activeLesson.title || activeLesson.titleAr}
              </h1>
              {activeLesson.description && (
                <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
                  {activeLesson.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            className="flex h-full min-h-[60vh] items-center justify-center text-center p-6"
          >
            <div>
              <BookOpen
                className="mx-auto mb-4 h-16 w-16"
                style={{ color: 'rgba(59,130,246,0.3)' }}
              />
              <h2
                className="text-xl font-bold font-madinet mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                اختر درساً للبدء
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>
                اختر أي درس من القائمة الجانبية لبدء التعلم
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <LearnPageInner />
    </Suspense>
  )
}
