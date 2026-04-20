'use client'

import { useState, useEffect, Suspense } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { get, post } from '../../../../lib/api'
import { getMediaUrl } from '../../../../lib/media'
import {
  Lock, Play, BookOpen, ArrowRight, ArrowLeft, Sparkles,
  CheckCircle2, ChevronDown, CheckCheck,
} from 'lucide-react'

function LearnPageInner() {
  const params = useParams()
  const courseId = params.courseId as string
  const locale = useLocale()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const lessonParam = searchParams.get('lesson')

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [markingComplete, setMarkingComplete] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Theme detection
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (saved) setTheme(saved)
    else if (systemDark) setTheme('dark')
    const interval = setInterval(() => {
      const t = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (t) setTheme(t)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Auth guard
  useEffect(() => {
    const token =
      localStorage.getItem('deveway_token') ||
      document.cookie.match(/deveway_token=([^;]+)/)?.[1]
    if (!token) {
      const MAIN = process.env.NEXT_PUBLIC_MAIN_URL || ''
      window.location.href = `${MAIN}/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    if (!localStorage.getItem('deveway_token')) {
      localStorage.setItem('deveway_token', token)
    }
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
      return (res?.data as any)?.data?.course ?? (res?.data as any)?.data ?? (res?.data as any)
    },
  })

  const { data: enrollment, refetch: refetchEnrollment } = useQuery({
    queryKey: ['learn-enrollment', courseId],
    enabled: !!courseId && authChecked,
    queryFn: async () => {
      try {
        const res = await get(`/courses/${courseId}/enrollment`)
        return (res?.data as any)?.data?.enrollment ?? (res?.data as any)?.data ?? null
      } catch { return null }
    },
  })

  const isEnrolled = !!enrollment

  // Completed lesson IDs from enrollment progress
  const completedLessonIds = new Set<string>(
    (enrollment?.completedLessons || enrollment?.progress || []).map(
      (cl: any) => cl.lessonId || cl.id || cl
    )
  )

  const sections = course?.sections ?? course?.modules ?? []
  const allLessons = sections.flatMap((s: any) => s.lessons || [])
  const activeLesson = allLessons.find((l: any) => l.id === activeLessonId)
  const activeLessonIndex = allLessons.findIndex((l: any) => l.id === activeLessonId)
  const prevLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null
  const nextLesson = activeLessonIndex < allLessons.length - 1 ? allLessons[activeLessonIndex + 1] : null
  const videoUrl = getMediaUrl(activeLesson?.videoUrl)
  const isCurrentCompleted = activeLessonId ? completedLessonIds.has(activeLessonId) : false
  const completedCount = completedLessonIds.size
  const totalLessons = allLessons.length
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''

  // Auto-select lesson from URL param or first lesson
  useEffect(() => {
    if (!course || !isEnrolled) return
    if (lessonParam) { setActiveLessonId(lessonParam); return }
    if (!activeLessonId) {
      const first = course?.sections?.[0]?.lessons?.[0]
      if (first) setActiveLessonId(first.id)
    }
  }, [lessonParam, isEnrolled, course, activeLessonId])

  // Auto-open section containing active lesson
  useEffect(() => {
    if (!activeLessonId || !sections.length) return
    sections.forEach((s: any) => {
      if ((s.lessons || []).some((l: any) => l.id === activeLessonId)) {
        setOpenSections(prev => new Set([...prev, s.id]))
      }
    })
  }, [activeLessonId, sections])

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMarkComplete = async () => {
    if (!activeLessonId || markingComplete) return
    setMarkingComplete(true)
    try {
      await post(`/courses/${courseId}/lessons/${activeLessonId}/complete`, {})
      refetchEnrollment()
      qc.invalidateQueries({ queryKey: ['learn-enrollment', courseId] })
    } catch {}
    setMarkingComplete(false)
  }

  // Colors
  const isDark = theme === 'dark'
  const bg = isDark ? '#0f1221' : '#ffffff'
  const sidebarBg = isDark ? '#0d1024' : '#f8f8fa'
  const headerBg = isDark ? '#0a0e1a' : '#f1f0fb'
  const textPrimary = isDark ? '#ffffff' : '#0d0d0d'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const borderColor = isDark ? '#1e293b' : '#e5e7eb'
  const cardBg = isDark ? '#181c30' : '#f1f5f9'
  const purple = '#6c3ce0'
  const teal = '#0d9488'
  const green = '#16a34a'

  if (!authChecked || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: bg }}>
        <div
          className="h-9 w-9 animate-spin rounded-full border-4"
          style={{ borderColor: `${purple} ${purple}30 ${purple}30 ${purple}30` }}
        />
      </div>
    )
  }

  if (isEnrolled === false && enrollment !== undefined && enrollment !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" dir="rtl" style={{ background: bg }}>
        <div className="text-center max-w-md">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: `${purple}12` }}
          >
            <Lock className="h-10 w-10" style={{ color: purple }} />
          </div>
          <h2 className="text-2xl font-bold font-madinet mb-3" style={{ color: textPrimary }}>
            الكورس مقيّد
          </h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: textSecondary }}>
            يجب الاشتراك في هذا الكورس للوصول إلى المحتوى
          </p>
          <a
            href={`${MAIN_URL}/${locale}/checkout/${courseId}`}
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${purple}, #5b21b6)`, boxShadow: `0 4px 20px ${purple}40` }}
          >
            اشترك الآن
            <ArrowLeft className="h-5 w-5" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl" style={{ background: bg }}>

      {/* ── Top header: course title + progress bar ── */}
      <header
        className="shrink-0 px-4 py-3"
        style={{ background: headerBg, borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-4 max-w-screen-xl mx-auto">
          <a
            href={`/${locale}/courses/${courseId}`}
            className="flex items-center gap-1.5 text-sm shrink-0 transition-opacity hover:opacity-70"
            style={{ color: textSecondary }}
          >
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">العودة</span>
          </a>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium truncate" style={{ color: textPrimary }}>
                {course?.titleAr || course?.titleEn || course?.title}
              </span>
              <span className="shrink-0 mr-3" style={{ color: textSecondary }}>
                {progress}% مكتمل · {completedCount}/{totalLessons}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: borderColor }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${purple}, ${teal})` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — 30% */}
        <aside
          className="w-full lg:w-[30%] xl:w-72 shrink-0 overflow-y-auto lg:h-[calc(100vh-58px)] lg:sticky lg:top-[58px]"
          style={{ background: sidebarBg, borderLeft: `1px solid ${borderColor}` }}
        >
          <div className="p-3 space-y-1">
            {sections.map((section: any) => {
              const isOpen = openSections.has(section.id)
              const sectionLessons: any[] = section.lessons || []
              const sectionCompleted =
                sectionLessons.length > 0 &&
                sectionLessons.every((l: any) => completedLessonIds.has(l.id))

              return (
                <div key={section.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-3 text-right text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ background: isDark ? '#151929' : '#ffffff', color: textPrimary }}
                  >
                    {sectionCompleted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: green }} />
                    ) : (
                      <BookOpen className="h-4 w-4 shrink-0" style={{ color: purple }} />
                    )}
                    <span className="flex-1 text-right leading-snug">
                      {section.title || section.titleAr || section.titleEn}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: textSecondary }}>
                      {sectionLessons.length}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 transition-transform duration-200"
                      style={{ color: textSecondary, transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>

                  {/* Lessons */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${borderColor}` }}>
                      {sectionLessons.map((lesson: any) => {
                        const canAccess = lesson.isFree || isEnrolled
                        const isActive = activeLessonId === lesson.id
                        const isCompleted = completedLessonIds.has(lesson.id)
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => canAccess && setActiveLessonId(lesson.id)}
                            disabled={!canAccess}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right text-sm transition-all"
                            style={{
                              background: isActive ? `${purple}12` : 'transparent',
                              borderRight: isActive ? `3px solid ${purple}` : '3px solid transparent',
                              color: isActive ? purple : canAccess ? textPrimary : textSecondary,
                              cursor: canAccess ? 'pointer' : 'not-allowed',
                              opacity: canAccess ? 1 : 0.45,
                            }}
                          >
                            {/* Icon bubble */}
                            <div
                              className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full"
                              style={{
                                background: isCompleted
                                  ? `${green}15`
                                  : isActive
                                  ? `${purple}18`
                                  : cardBg,
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: green }} />
                              ) : !canAccess ? (
                                <Lock className="h-3 w-3" style={{ color: textSecondary }} />
                              ) : (
                                <Play className="h-3 w-3" style={{ color: isActive ? purple : textSecondary }} />
                              )}
                            </div>

                            <span className="flex-1 line-clamp-2 text-right leading-snug">
                              {lesson.title || lesson.titleAr}
                            </span>

                            {lesson.isFree && !isActive && (
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{ background: `${teal}18`, color: teal }}
                              >
                                مجاني
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* Main — 70% */}
        <main className="flex-1 overflow-auto flex flex-col">
          {activeLessonId && activeLesson ? (
            <>
              {/* Video player */}
              <div className="bg-black w-full aspect-video">
                {videoUrl ? (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    className="h-full w-full"
                    onEnded={() => {
                      post(`/courses/${courseId}/lessons/${activeLessonId}/complete`, {}).catch(() => {})
                      refetchEnrollment()
                      qc.invalidateQueries({ queryKey: ['learn-enrollment', courseId] })
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/30">
                    <div className="text-center">
                      <Play className="mx-auto h-16 w-16 mb-3 opacity-30" />
                      <p className="text-sm">لا يوجد فيديو لهذا الدرس</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson info */}
              <div className="flex-1 p-6" style={{ borderTop: `1px solid ${borderColor}` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-xl font-bold font-madinet" style={{ color: textPrimary }}>
                    {activeLesson.title || activeLesson.titleAr}
                  </h1>

                  {/* Mark complete */}
                  {isCurrentCompleted ? (
                    <div
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shrink-0"
                      style={{ background: `${green}12`, color: green }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>مكتمل</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={markingComplete}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shrink-0 transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
                        boxShadow: `0 4px 16px ${purple}35`,
                      }}
                    >
                      <CheckCheck className="h-4 w-4" />
                      {markingComplete ? 'جاري...' : 'تمييز كمكتمل'}
                    </button>
                  )}
                </div>

                {activeLesson.description && (
                  <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
                    {activeLesson.description}
                  </p>
                )}

                {/* Prev / Next navigation */}
                <div
                  className="flex gap-3 mt-8 pt-6"
                  style={{ borderTop: `1px solid ${borderColor}` }}
                >
                  {nextLesson && (isEnrolled || nextLesson.isFree) && (
                    <button
                      onClick={() => setActiveLessonId(nextLesson.id)}
                      className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{
                        background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
                        boxShadow: `0 4px 16px ${purple}35`,
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      الدرس التالي
                    </button>
                  )}
                  {prevLesson && (
                    <button
                      onClick={() => setActiveLessonId(prevLesson.id)}
                      className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-opacity hover:opacity-80"
                      style={{ background: cardBg, color: textPrimary }}
                    >
                      الدرس السابق
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[60vh] items-center justify-center text-center p-6">
              <div>
                <div
                  className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: `${purple}12` }}
                >
                  <BookOpen className="h-10 w-10" style={{ color: `${purple}60` }} />
                </div>
                <h2 className="text-xl font-bold font-madinet mb-2" style={{ color: textPrimary }}>
                  اختر درساً للبدء
                </h2>
                <p className="text-sm" style={{ color: textSecondary }}>
                  اختر أي درس من القائمة الجانبية لبدء التعلم
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Button */}
      <a
        href={`${MAIN_URL}/${locale}/dashboard/ai-chat`}
        title="اسأل الذكاء الاصطناعي"
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-110"
        style={{ background: purple, boxShadow: `0 6px 24px ${purple}50` }}
      >
        <Sparkles className="h-7 w-7 text-white" />
      </a>
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LearnPageInner />
    </Suspense>
  )
}
