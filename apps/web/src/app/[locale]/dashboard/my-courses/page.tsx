'use client'

import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BookOpen, Users, PlusCircle, Edit3, Settings } from 'lucide-react'
import { get } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { getMediaUrl } from '../../../../lib/media'
import { useAuthStore } from '../../../../stores/authStore'

export default function MyCoursesPage() {
  const locale = useLocale()
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  useEffect(() => { hydrate() }, [hydrate])

  const canCreateCourse = user?.accountType === 'INSTRUCTOR' || user?.accountType === 'ADMIN'

  useEffect(() => {
    if (user && user.accountType === 'CONSULTANT') {
      router.push(`/${locale}/dashboard`)
    }
  }, [user, locale, router])

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['instructor-my-courses'],
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const d = (res?.data as any)?.data ?? (res?.data as any)
      return Array.isArray(d) ? d : []
    },
  })

  return (
    <AuthGate>
      <div className="p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-madinet text-foreground">كورساتي</h1>
            <p className="text-sm text-[color:var(--muted)] mt-0.5">
              {courses.length > 0 ? `${courses.length} كورس` : 'لا توجد كورسات بعد'}
            </p>
          </div>
          {canCreateCourse && (
            <Link
              href={`/${locale}/dashboard/create-course`}
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              <PlusCircle className="h-4 w-4" />
              كورس جديد
            </Link>
          )}
        </div>

        {/* Loading */}
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

        {/* Empty */}
        {!isLoading && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--border)] p-16 text-center">
            <BookOpen className="h-12 w-12 opacity-20 mb-4" />
            <h2 className="text-lg font-bold font-madinet text-foreground mb-2">لا توجد كورسات بعد</h2>
            <p className="text-sm text-[color:var(--muted)] mb-6">ابدأ بإنشاء كورسك الأول وشارك معرفتك مع الطلاب</p>
            {canCreateCourse && (
              <Link
                href={`/${locale}/dashboard/create-course`}
                className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                أنشئ كورسك الأول
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && courses.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => (
              <CourseCard key={course.id} course={course} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </AuthGate>
  )
}

function CourseCard({ course, locale }: { course: any; locale: string }) {
  const statusConfig = {
    PUBLISHED: { label: 'منشور', class: 'bg-green-500/20 text-green-400' },
    DRAFT: { label: 'مسودة', class: 'bg-amber-500/20 text-amber-400' },
    ARCHIVED: { label: 'مؤرشف', class: 'bg-gray-500/20 text-gray-400' },
  }
  const status = statusConfig[course.status as keyof typeof statusConfig] ?? statusConfig.DRAFT

  return (
    <div className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
      {/* Thumbnail */}
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
        <div className="absolute top-3 right-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.class}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4" dir="rtl">
        <h3 className="font-bold text-foreground truncate">{course.titleEn}</h3>
        {course.titleAr && (
          <p className="text-sm text-[color:var(--muted)] truncate mt-0.5">{course.titleAr}</p>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-[color:var(--muted)]">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{course._count?.enrollments ?? 0} طالب</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{course._count?.sections ?? 0} قسم</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[color:var(--border)]">
          <span className="text-sm font-bold text-foreground">
            {course.price === 0 ? 'مجاني' : `${course.price} ريال`}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/dashboard/courses/${course.id}/manage`}
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              إدارة
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
