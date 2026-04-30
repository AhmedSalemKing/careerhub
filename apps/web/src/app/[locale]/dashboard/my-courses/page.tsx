'use client'

import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BookOpen, Users, DollarSign, Play, Edit, Trash2, Radio, MapPin, Video, Clock, CheckCircle2, AlertCircle, MoreVertical } from 'lucide-react'
import { get } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { getMediaUrl } from '../../../../lib/media'
import { useAuthStore } from '../../../../stores/authStore'

function getTitle(c: any, locale: string) {
  if (locale === 'ar') return c.titleAr || c.titleEn || c.title || 'بدون عنوان'
  return c.titleEn || c.titleAr || c.title || 'Untitled'
}

function getTypeConfig(course: any) {
  const type = course.type || 'recorded'
  if (type === 'live') return { label: 'Live', ar: 'بث مباشر', icon: Radio, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' }
  if (type === 'offline') return { label: 'Offline', ar: 'مقر فعلي', icon: MapPin, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' }
  return { label: 'Recorded', ar: 'مسجل', icon: Video, color: '#5120c8', bg: 'rgba(81,32,200,0.1)' }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'PUBLISHED': return { label: 'Published', ar: 'منشور', color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: CheckCircle2 }
    case 'DRAFT': return { label: 'Draft', ar: 'مسودة', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: AlertCircle }
    case 'PENDING_REVIEW': return { label: 'Pending', ar: 'قيد المراجعة', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock }
    default: return { label: status, ar: status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: AlertCircle }
  }
}

export default function InstructorCoursesPage() {
  const locale = useLocale()
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  useEffect(() => { hydrate() }, [hydrate])

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const d = (res?.data as any)?.data ?? (res?.data as any)
      return Array.isArray(d) ? d : []
    },
  })

  const isAr = locale === 'ar'

  return (
    <AuthGate>
      <div className="p-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-madinet text-foreground">
              {isAr ? 'كورساتي' : 'My Courses'}
            </h1>
            <p className="text-sm text-[color:var(--muted)] mt-0.5">
              {courses.length > 0
                ? (isAr ? `${courses.length} كورس` : `${courses.length} courses`)
                : (isAr ? 'لا توجد كورسات بعد' : 'No courses yet')}
            </p>
          </div>
          <Link
            href={`/${locale}/dashboard/create-course`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, #5120c8, #7c3aed)',
              color: '#fff', textDecoration: 'none',
              fontWeight: 700, fontSize: 14,
              boxShadow: '0 4px 20px rgba(81,32,200,0.3)',
            }}
          >
            <BookOpen size={16} />
            {isAr ? 'إنشاء كورس' : 'Create Course'}
          </Link>
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

        {!isLoading && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--border)] p-16 text-center">
            <BookOpen className="h-12 w-12 opacity-20 mb-4" />
            <h2 className="text-lg font-bold font-madinet text-foreground mb-2">
              {isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}
            </h2>
            <p className="text-sm text-[color:var(--muted)] mb-6">
              {isAr ? 'ابدأ بإنشاء كورسك الأول' : 'Start by creating your first course'}
            </p>
            <Link
              href={`/${locale}/dashboard/create-course`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12,
                background: 'linear-gradient(135deg, #5120c8, #7c3aed)',
                color: '#fff', textDecoration: 'none',
                fontWeight: 700, fontSize: 15,
                boxShadow: '0 4px 20px rgba(81,32,200,0.3)',
              }}
            >
              {isAr ? 'إنشاء كورس' : 'Create Course'}
            </Link>
          </div>
        )}

        {!isLoading && courses.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => {
              const title = getTitle(course, locale)
              const typeConfig = getTypeConfig(course)
              const statusConfig = getStatusConfig(course.status)
              const TypeIcon = typeConfig.icon
              const StatusIcon = statusConfig.icon
              const enrollments = course._count?.enrollments || 0
              const revenue = enrollments * (course.price || 0)

              return (
                <div
                  key={course.id}
                  className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 bg-[color:var(--surface-2)] overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={getMediaUrl(course.thumbnail) ?? ''}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={title}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <TypeIcon className="h-10 w-10 opacity-20" />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div
                      className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                      style={{ background: typeConfig.bg, border: `1px solid ${typeConfig.color}30` }}
                    >
                      <TypeIcon size={12} style={{ color: typeConfig.color }} />
                      <span className="text-[11px] font-bold" style={{ color: typeConfig.color }}>
                        {isAr ? typeConfig.ar : typeConfig.label}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                      style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.color}30` }}
                    >
                      <StatusIcon size={12} style={{ color: statusConfig.color }} />
                      <span className="text-[11px] font-bold" style={{ color: statusConfig.color }}>
                        {isAr ? statusConfig.ar : statusConfig.label}
                      </span>
                    </div>

                    {/* Live Button */}
                    {course.type === 'live' && course.status === 'PUBLISHED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/${locale}/live/${course.id}`)
                        }}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Radio size={12} />
                        {isAr ? 'بدء البث' : 'Go Live'}
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground truncate">{title}</h3>
                    {course.price > 0 && (
                      <p className="text-sm text-[color:var(--muted)] mt-0.5">{course.price} ريال</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[color:var(--muted)]">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{enrollments} {isAr ? 'طالب' : 'students'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{revenue.toLocaleString()} {isAr ? 'ريال' : 'SAR'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Link
                        href={`/${locale}/dashboard/courses/${course.id}/manage`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Edit size={12} />
                        {isAr ? 'إدارة' : 'Manage'}
                      </Link>
                      <button
                        className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        onClick={() => {
                          if (confirm(isAr ? 'هل أنت متأكد من حذف الكورس؟' : 'Are you sure you want to delete this course?')) {
                            // TODO: Implement delete
                          }
                        }}
                      >
                        <Trash2 size={12} />
                        {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </div>
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
