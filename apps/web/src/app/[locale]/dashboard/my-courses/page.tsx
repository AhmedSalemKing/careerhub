'use client'

import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BookOpen, Clock, Users, Play, CheckCircle2, Award } from 'lucide-react'
import { get } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { getMediaUrl } from '../../../../lib/media'
import { useAuthStore } from '../../../../stores/authStore'

export default function MyCoursesPage() {
  const locale = useLocale()
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  useEffect(() => { hydrate() }, [hydrate])

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const res = await get('/courses/my-enrollments')
      const data = res.data?.data ?? res.data
      return Array.isArray(data) ? data : []
    },
  })

  return (
    <AuthGate>
      <div className="p-6" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-madinet text-foreground">كورساتي</h1>
            <p className="text-sm text-[color:var(--muted)] mt-0.5">
              {enrollments.length > 0 ? `${enrollments.length} كورس مشترك` : 'لا توجد كورسات بعد'}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
                <div className="h-40 bg-[color:var(--surface-2)]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[color:var(--surface-2)]" />
                  <div className="h-3 w-1/2 rounded bg-[color:var(--surface-2)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && enrollments.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--border)] p-16 text-center">
            <BookOpen className="h-12 w-12 opacity-20 mb-4" />
            <h2 className="text-lg font-bold font-madinet text-foreground mb-2">لا توجد كورسات بعد</h2>
            <p className="text-sm text-[color:var(--muted)] mb-6">ابدأ رحلة التعلم واشترك في كورسك الأول</p>
            <Link
              href={`/${locale}/courses`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12, marginTop: 20,
                background: 'linear-gradient(135deg, #5120c8, #7c3aed)',
                color: '#fff', textDecoration: 'none',
                fontWeight: 700, fontSize: 15,
                boxShadow: '0 4px 20px rgba(81,32,200,0.3)',
              }}
            >
              استكشف الكورسات
            </Link>
          </div>
        )}

        {!isLoading && enrollments.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment: any) => {
              const course = enrollment.course || enrollment
              const progress = enrollment.progress || 0
              const completed = enrollment.completedAt
              const instructor = course.instructor
              const instructorName = instructor?.profile 
                ? `${instructor.profile.firstName || ''} ${instructor.profile.lastName || ''}`.trim()
                : ''

              return (
                <div 
                  key={enrollment.id} 
                  className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                  onClick={() => router.push(`/${locale}/learn/${course.id}`)}
                >
                  <div className="relative h-44 bg-[color:var(--surface-2)] overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={getMediaUrl(course.thumbnail) ?? ''}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={course.titleEn}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                    {completed && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                        <span className="text-[11px] font-bold text-white">مكتمل</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-foreground truncate">{course.titleEn}</h3>
                    {course.titleAr && (
                      <p className="text-sm text-[color:var(--muted)] truncate mt-0.5">{course.titleAr}</p>
                    )}
                    {instructorName && (
                      <p className="text-xs text-[color:var(--muted)] mt-1">بقلم {instructorName}</p>
                    )}

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[color:var(--muted)]">التقدم</span>
                        <span className={`text-xs font-bold ${progress >= 100 ? 'text-green-500' : 'text-primary'}`}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[color:var(--surface-2)] overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(progress, 100)}%`,
                            background: progress >= 100 ? '#16a34a' : '#5120c8'
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-[color:var(--muted)]">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{course._count?.lessons ?? 0} دروس</span>
                      </div>
                      {course.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{course.duration} ساعة</span>
                        </div>
                      )}
                    </div>

                    <button
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                        completed 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {completed ? (
                        <>
                          <Award className="h-4 w-4" />
                          عرض الشهادة
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          {progress > 0 ? 'متابعة' : 'ابدأ التعلم'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AuthGate>
  )
}
