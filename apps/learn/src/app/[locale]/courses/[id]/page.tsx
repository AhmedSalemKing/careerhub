'use client'
import { useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { getMediaUrl, getCourseTitle } from '../../../../lib/media'
import { useLocale, useTranslations } from 'next-intl'
import {
  Play, Clock, Users, BookOpen, ChevronDown, Lock, CheckCircle2,
  ArrowRight, ArrowLeft, GraduationCap, BarChart3, Star, Loader2,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// LEARN_URL removed — navigation within the same app uses relative paths

export default function CourseDetailPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const courseId = params.id
  const locale = useLocale()
  const t = useTranslations('course')
  const router = useRouter()
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  // Theme detection
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme) setTheme(savedTheme)
    else if (systemPrefersDark) setTheme('dark')

    const handleStorageChange = () => {
      const t = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (t) setTheme(t)
    }
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(() => {
      const t = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (t && t !== theme) setTheme(t)
    }, 500)
    return () => { window.removeEventListener('storage', handleStorageChange); clearInterval(interval) }
  }, [theme])

  // Check if user is logged in
  const [hasUser, setHasUser] = useState(false)
  useEffect(() => {
    const token = localStorage.getItem('deveway_token')
      || document.cookie.match(/deveway_token=([^;]+)/)?.[1]
    setHasUser(!!token)
  }, [])

  // Course data
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      return (res?.data as any)?.data?.course ?? (res?.data as any)?.data ?? (res?.data as any)
    },
    enabled: !!courseId,
  })

  // Enrollment check
  const { data: enrollmentData, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrollment', courseId],
    queryFn: async () => {
      try {
        const res = await get(`/courses/${courseId}/enrollment`)
        const d = (res?.data as any)?.data ?? res?.data
        console.log('[Enrollment] raw response:', res?.data, '→ parsed:', d)
        return d
      } catch (err) {
        console.log('[Enrollment] error:', err)
        return null
      }
    },
    enabled: !!hasUser,
  })

  useEffect(() => {
    if (enrollmentData !== undefined && enrollmentData !== null) {
      const enrolled = !!(
        enrollmentData?.enrolled === true ||
        enrollmentData?.enrollment?.id ||
        enrollmentData?.id ||
        (Array.isArray(enrollmentData) && enrollmentData.length > 0)
      )
      console.log('[Enrollment] enrollmentData:', enrollmentData, '→ isEnrolled:', enrolled)
      setIsEnrolled(enrolled)
    }
  }, [enrollmentData])

  const isFree = !course?.price || course?.price === 0

  // Free enrollment handler
  const handleFreeEnroll = async () => {
    if (!hasUser) {
      const MAIN = process.env.NEXT_PUBLIC_MAIN_URL || ''
      window.location.href = `${MAIN}/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    setEnrolling(true)
    try {
      await post(`/courses/${courseId}/enroll`, {})
      setIsEnrolled(true)
    } catch {
      // silently handle
    } finally {
      setEnrolling(false)
    }
  }

  const isDark = theme === 'dark'

  // Colors
  const bg = isDark ? '#0f1221' : '#ffffff'
  const cardBg = isDark ? '#181c30' : '#f8f8fa'
  const textPrimary = isDark ? '#ffffff' : '#0d0d0d'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const borderColor = isDark ? '#1e293b' : '#e5e7eb'
  const surfaceBg = isDark ? '#151929' : '#ffffff'
  const heroBg = isDark ? '#0a0e1a' : '#f1f0fb'
  const purple = '#6c3ce0'
  const teal = '#0d9488'
  const greenBg = isDark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.06)'

  if (isLoading) return <CourseSkeleton isDark={isDark} />
  if (!course) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg, color: textSecondary }}>
      {t('not_found')}
    </div>
  )

  const thumb = getMediaUrl(course.thumbnail)
  const previewVideo = getMediaUrl(course.previewVideo)
  const instructorName = course.instructor?.profile
    ? `${course.instructor.profile.firstName} ${course.instructor.profile.lastName}`
    : t('instructor')
  const sections = course.sections ?? course.modules ?? []
  const totalLessons = sections.reduce((acc: number, s: any) => acc + (s.lessons?.length || 0), 0)
  const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''

  return (
    <div className="min-h-screen" style={{ background: bg }}>

      {/* ── Hero Section ── */}
      <div style={{ background: heroBg, borderBottom: `1px solid ${borderColor}` }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid gap-8 lg:grid-cols-5">

            {/* Info - 3 cols */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              {course.category && (
                <span
                  className="text-xs font-semibold mb-3 inline-block w-fit rounded-full px-3 py-1"
                  style={{ background: `${purple}18`, color: purple }}
                >
                  {course.category.nameAr || course.category.nameEn}
                </span>
              )}

              <h1 className="text-3xl lg:text-4xl font-bold font-madinet mb-4 leading-tight" style={{ color: textPrimary }}>
                {getCourseTitle(course, locale)}
              </h1>

              <p className="text-base leading-relaxed mb-6" style={{ color: textSecondary }}>
                {course.descriptionAr || course.descriptionEn || course.description}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-5 text-sm mb-6" style={{ color: textSecondary }}>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" style={{ color: purple }} />
                  {course._count?.enrollments || 0} {t('student')}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" style={{ color: purple }} />
                  {totalLessons} {t('lesson')}
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" style={{ color: purple }} />
                  {course.level === 'BEGINNER' ? t('beginner') :
                   course.level === 'INTERMEDIATE' ? t('intermediate') : t('advanced')}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" style={{ color: purple }} />
                  {sections.length} {t('section')}
                </span>
              </div>

              {/* Instructor mini */}
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: `${purple}20`, color: purple }}
                >
                  {instructorName[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: textPrimary }}>{instructorName}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>{t('instructor')}</p>
                </div>
              </div>
            </div>

            {/* Preview - 2 cols */}
            <div className="lg:col-span-2">
              <div
                className="rounded-2xl overflow-hidden aspect-video"
                style={{ background: isDark ? '#000' : '#e2e8f0', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
              >
                {previewVideo ? (
                  <video
                    src={previewVideo}
                    controls
                    className="w-full h-full object-cover"
                    poster={thumb || undefined}
                  />
                ) : thumb ? (
                  <img src={thumb} className="w-full h-full object-cover" alt={getCourseTitle(course, locale)} />
                ) : (
                  <div className="flex h-full items-center justify-center" style={{ background: isDark ? '#111' : '#e2e8f0' }}>
                    <Play className="h-16 w-16" style={{ color: `${purple}40` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content + Sidebar ── */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Main Content - 2 cols */}
          <div className="lg:col-span-2 space-y-10">

            {/* Curriculum */}
            <section>
              <h2 className="text-xl font-bold font-madinet mb-5 flex items-center gap-2" style={{ color: textPrimary }}>
                <BookOpen className="h-5 w-5" style={{ color: purple }} />
                {t('content')}
              </h2>
              {sections.length > 0 ? (
                <div className="space-y-3">
                  {sections.map((section: any, sIdx: number) => (
                    <div
                      key={section.id}
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${borderColor}`, background: surfaceBg }}
                    >
                      <button
                        onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                        className="w-full flex items-center justify-between p-4 text-right transition-colors hover:opacity-90"
                        style={{ color: textPrimary }}
                      >
                        <span className="font-semibold flex items-center gap-2">
                          <span
                            className="text-xs font-bold rounded-md px-2 py-0.5"
                            style={{ background: `${purple}15`, color: purple }}
                          >
                            {sIdx + 1}
                          </span>
                          {section.title || section.titleAr || section.titleEn}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: textSecondary }}>
                            {section.lessons?.length || 0} {t('lesson')}
                          </span>
                          <ChevronDown
                            className="h-4 w-4 transition-transform duration-200"
                            style={{
                              color: textSecondary,
                              transform: openSection === section.id ? 'rotate(180deg)' : 'none',
                            }}
                          />
                        </div>
                      </button>
                      {openSection === section.id && (
                        <div style={{ borderTop: `1px solid ${borderColor}` }}>
                          {section.lessons?.map((lesson: any, lIdx: number) => {
                            const canAccess = isEnrolled || lesson.isFree
                            return (
                              <div
                                key={lesson.id}
                                onClick={() => {
                                  if (canAccess) {
                                    window.location.href = `/${locale}/learn/${courseId}?lesson=${lesson.id}`
                                  } else if (!isFree) {
                                    window.location.href = `${MAIN_URL}/${locale}/checkout/${courseId}`
                                  }
                                }}
                                className={`flex items-center justify-between p-3.5 px-4 transition-colors ${canAccess ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed'}`}
                                style={{
                                  borderBottom: `1px solid ${borderColor}`,
                                  opacity: canAccess ? 1 : 0.55,
                                  background: canAccess ? 'transparent' : isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs"
                                    style={{
                                      background: canAccess ? `${purple}15` : isDark ? '#1e293b' : '#e5e7eb',
                                      color: canAccess ? purple : textSecondary,
                                    }}
                                  >
                                    {canAccess ? <Play className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                  </div>
                                  <span className="text-sm" style={{ color: textPrimary }}>
                                    {lesson.title || lesson.titleAr || lesson.titleEn}
                                  </span>
                                </div>
                                {lesson.isFree && (
                                  <span
                                    className="text-xs rounded-full px-2.5 py-0.5 font-medium"
                                    style={{ background: `${teal}18`, color: teal }}
                                  >
                                    {t('free')}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-xl p-10 text-center"
                  style={{ border: `1px solid ${borderColor}`, background: cardBg }}
                >
                  <BookOpen className="mx-auto h-12 w-12 mb-3" style={{ color: `${purple}30` }} />
                  <p style={{ color: textSecondary }}>{t('no_content')}</p>
                </div>
              )}
            </section>

            {/* Instructor */}
            {course.instructor && (
              <section>
                <h2 className="text-xl font-bold font-madinet mb-5 flex items-center gap-2" style={{ color: textPrimary }}>
                  <GraduationCap className="h-5 w-5" style={{ color: purple }} />
                  {t('instructor')}
                </h2>
                <div
                  className="rounded-xl p-6 flex items-start gap-4"
                  style={{ border: `1px solid ${borderColor}`, background: surfaceBg }}
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
                    style={{ background: `${purple}15`, color: purple }}
                  >
                    {instructorName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1" style={{ color: textPrimary }}>{instructorName}</h3>
                    {course.instructor.profile?.bio && (
                      <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
                        {course.instructor.profile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-6 sticky top-6 space-y-5"
              style={{
                border: `1px solid ${borderColor}`,
                background: surfaceBg,
                boxShadow: isDark ? '0 4px 30px rgba(0,0,0,0.3)' : '0 4px 30px rgba(0,0,0,0.06)',
              }}
            >
              {/* Price */}
              <div className="text-center pb-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                {isFree ? (
                  <span className="text-3xl font-bold" style={{ color: teal }}>{t('free')}</span>
                ) : (
                  <div>
                    <span className="text-3xl font-bold" style={{ color: purple }}>{course.price}</span>
                    <span className="text-base mr-1" style={{ color: textSecondary }}> {t('currency')}</span>
                  </div>
                )}
              </div>

              {/* Enrollment Button */}
              {enrollmentLoading && hasUser ? (
                <div
                  className="flex items-center justify-center gap-2 rounded-xl py-3.5"
                  style={{ background: cardBg }}
                >
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: purple }} />
                  <span className="text-sm" style={{ color: textSecondary }}>{t('checking')}</span>
                </div>
              ) : isEnrolled ? (
                <div className="space-y-3">
                  {/* Green success bar */}
                  <div
                    className="flex items-center gap-2.5 rounded-xl py-3.5 px-5 font-bold text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(22,163,74,0.3)',
                    }}
                  >
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                    <span>{t('enrolled')}</span>
                  </div>
                  <a
                    href={`/${locale}/learn/${courseId}`}
                    className="flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm text-white transition-opacity hover:opacity-90"
                    style={{ background: purple }}
                  >
                    {t('start_learning')}
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                </div>
              ) : isFree ? (
                <button
                  onClick={handleFreeEnroll}
                  disabled={enrolling}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${teal}, #0f766e)`,
                    boxShadow: `0 4px 20px ${teal}40`,
                  }}
                >
                  {enrolling ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {enrolling ? t('enrolling') : t('enroll_free')}
                </button>
              ) : (
                <a
                  href={`${MAIN_URL}/${locale}/checkout/${courseId}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${purple}, #5b21b6)`,
                    boxShadow: `0 4px 20px ${purple}40`,
                  }}
                >
                  <Lock className="h-4 w-4" />
                  {t('subscribe')} — {course.price} {t('currency')}
                </a>
              )}

              {/* Course stats */}
              <div className="space-y-3 pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                {[
                  { icon: BookOpen, label: t('total_lessons'), value: `${totalLessons} ${t('lesson')}` },
                  { icon: GraduationCap, label: t('sections_label'), value: `${sections.length} ${t('section')}` },
                  {
                    icon: BarChart3,
                    label: t('level'),
                    value: course.level === 'BEGINNER' ? t('beginner') :
                           course.level === 'INTERMEDIATE' ? t('intermediate') : t('advanced'),
                  },
                  { icon: Users, label: t('subscribers'), value: `${course._count?.enrollments || 0} ${t('student')}` },
                ].map(({ icon: Icon, label, value }, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2" style={{ color: textSecondary }}>
                      <Icon className="h-4 w-4" style={{ color: purple }} />
                      {label}
                    </span>
                    <span className="font-medium" style={{ color: textPrimary }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CourseSkeleton({ isDark }: { isDark: boolean }) {
  const skBg = isDark ? '#181c30' : '#f1f5f9'
  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: isDark ? '#0f1221' : '#fff' }}>
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-48 animate-pulse rounded-lg mb-4" style={{ background: skBg }} />
        <div className="h-64 animate-pulse rounded-2xl mb-6" style={{ background: skBg }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl mb-3" style={{ background: skBg }} />
        ))}
      </div>
    </div>
  )
}
