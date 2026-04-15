'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { BookOpen, Play, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { getUser } from '../../../lib/auth'
import { getMediaUrl } from '../../../lib/media'
import { LEARN_URL } from '../../../lib/constants'

function getCourseTitle(course: any, locale: string): string {
  if (course.titleAr || course.titleEn) {
    return locale === 'ar' ? (course.titleAr || course.titleEn) : (course.titleEn || course.titleAr)
  }
  if (course.title && typeof course.title === 'object') {
    return course.title[locale] || course.title.ar || course.title.en || 'بدون عنوان'
  }
  return course.title || 'بدون عنوان'
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden animate-pulse"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="aspect-video" style={{ background: 'var(--surface-hover)' }} />
          <div className="p-5 space-y-3">
            <div className="h-4 rounded" style={{ background: 'var(--surface-hover)', width: '75%' }} />
            <div className="h-3 rounded" style={{ background: 'var(--surface-hover)', width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MyCoursesPage() {
  const locale = useLocale() as 'ar' | 'en'
  const [accountType, setAccountType] = useState<string>('STUDENT')
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all')

  useEffect(() => {
    try {
      const u = getUser<{ accountType?: string }>()
      setAccountType(u?.accountType || 'STUDENT')
    } catch {}
  }, [])

  // Enrolled courses (STUDENT)
  const { data: enrolledData, isLoading: loadingEnrolled } = useQuery({
    queryKey: ['my-enrolled-courses'],
    enabled: accountType === 'STUDENT',
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const d = (res?.data as any)?.data ?? (res?.data as any)
      if (d?.enrollments) return d.enrollments
      return Array.isArray(d) ? d : []
    },
  })

  // Created courses (INSTRUCTOR)
  const { data: createdCourses = [], isLoading: loadingCreated } = useQuery({
    queryKey: ['my-created-courses'],
    enabled: accountType === 'INSTRUCTOR',
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const d = (res?.data as any)?.data ?? (res?.data as any)
      return Array.isArray(d) ? d : []
    },
  })

  // Sessions (CONSULTANT)
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['my-consulting-sessions-learn'],
    enabled: accountType === 'CONSULTANT',
    queryFn: async () => {
      try {
        const res = await get('/coaching/consulting/my-sessions')
        const d = (res?.data as any)?.data ?? (res?.data as any)
        return Array.isArray(d) ? d : []
      } catch { return [] }
    },
  })

  // ─── CONSULTANT VIEW ──────────────────────────────────────────
  if (accountType === 'CONSULTANT') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold font-madinet" style={{ color: 'var(--text-primary)' }}>
              {locale === 'ar' ? 'جلساتي' : 'My Sessions'}
            </h1>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loadingSessions ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl" style={{ background: 'var(--surface)' }} />
              ))}
            </div>
          ) : (sessions as any[]).length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>{locale === 'ar' ? 'لا توجد جلسات بعد' : 'No sessions yet'}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(sessions as any[]).map((s) => (
                <div key={s.id} className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      s.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                      s.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {s.status === 'CONFIRMED' ? 'مؤكدة' : s.status === 'PENDING' ? 'معلقة' : 'ملغية'}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.scheduledAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.topic || 'جلسة استشارية'}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{s.meetingMethod}</p>
                  <p className="font-bold mt-2" style={{ color: 'var(--primary)' }}>{s.price} ريال</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── INSTRUCTOR VIEW ──────────────────────────────────────────
  if (accountType === 'INSTRUCTOR') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold font-madinet" style={{ color: 'var(--text-primary)' }}>
              {locale === 'ar' ? 'كورساتي' : 'My Courses'}
            </h1>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loadingCreated ? (
            <LoadingSkeleton />
          ) : (createdCourses as any[]).length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'لم تنشئ أي كورس بعد' : 'No courses created yet'}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(createdCourses as any[]).map((course: any) => (
                <div key={course.id} className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="relative aspect-video">
                    {course.thumbnail ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL || ''}${course.thumbnail}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #5120c8 100%)' }}>
                        <BookOpen className="h-10 w-10 text-white/30" />
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.status === 'PUBLISHED' ? 'bg-green-500/80 text-white' : 'bg-amber-500/80 text-white'
                    }`}>
                      {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {getCourseTitle(course, locale)}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {course._count?.enrollments || 0} {locale === 'ar' ? 'طالب' : 'students'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── STUDENT VIEW (default) ───────────────────────────────────
  const enrollments: any[] = enrolledData || []
  const filteredEnrollments = enrollments.filter((e: any) => {
    const prog = e.progress || 0
    if (filter === 'in-progress') return prog > 0 && prog < 100
    if (filter === 'completed') return prog === 100
    return true
  })

  if (!loadingEnrolled && enrollments.length === 0) {
    return (
      <div className="min-h-screen py-16" style={{ background: 'var(--background)' }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6"
            style={{ background: 'var(--surface)' }}>
            <BookOpen className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h2 className="text-2xl font-bold font-madinet mb-2" style={{ color: 'var(--text-primary)' }}>
            {locale === 'ar' ? 'لا توجد كورسات بعد' : 'No courses yet'}
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {locale === 'ar' ? 'ابدأ رحلتك التعليمية الآن' : 'Start your learning journey now'}
          </p>
          <Button className="btn-primary" asChild>
            <Link href={`/${locale}/courses`}>
              {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
              <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold font-madinet" style={{ color: 'var(--text-primary)' }}>
            {locale === 'ar' ? 'كورساتي' : 'My Courses'}
          </h1>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
            { key: 'in-progress', label: locale === 'ar' ? 'قيد التعلم' : 'In Progress' },
            { key: 'completed', label: locale === 'ar' ? 'مكتملة' : 'Completed' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key as any)}
              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                background: filter === tab.key ? 'var(--primary)' : 'var(--surface)',
                color: filter === tab.key ? 'white' : 'var(--text-secondary)',
                border: filter === tab.key ? 'none' : '1px solid var(--border)',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {loadingEnrolled ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEnrollments.map((enrollment: any) => {
              const course = enrollment.course || enrollment
              const progress = enrollment.progress || 0
              const courseId = course.id || course.courseId || enrollment.courseId
              const thumb = getMediaUrl(course.thumbnail)
              return (
                <div key={enrollment.id || courseId}
                  className="rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 group"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={getCourseTitle(course, locale)}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(30,58,138,0.4) 100%)' }}>
                        <BookOpen className="h-12 w-12" style={{ color: 'rgba(59,130,246,0.4)' }} />
                      </div>
                    )}
                    {/* Progress badge */}
                    <div className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold ${
                      progress >= 100 ? 'bg-green-500 text-white' : 'bg-black/60 backdrop-blur-sm text-white'
                    }`}>
                      {progress >= 100 ? 'مكتمل' : `${Math.round(progress)}%`}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold mb-3 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {getCourseTitle(course, locale)}
                    </h3>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <span>{Math.round(progress)}% مكتمل</span>
                        <span>{course.completedLessons || 0}/{course.totalLessons || 0} درس</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2, #1e293b)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: progress >= 100 ? '#22c55e' : 'var(--primary)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Action button */}
                    <a
                      href={`${LEARN_URL}/${locale}/learn/${courseId}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white transition"
                      style={{ background: 'var(--primary)' }}
                    >
                      {progress === 0 ? (
                        <><Play className="h-4 w-4" /> ابدأ التعلم</>
                      ) : progress >= 100 ? (
                        <><CheckCircle className="h-4 w-4" /> مراجعة الكورس</>
                      ) : (
                        <><Play className="h-4 w-4" /> متابعة التعلم</>
                      )}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
