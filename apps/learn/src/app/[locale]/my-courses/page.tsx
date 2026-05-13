'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { getUser } from '../../../lib/auth'
import { getMediaUrl } from '../../../lib/media'
import { BookOpen, ArrowRight, Search, Star, Users, Award, CheckCircle, Clock, XCircle, LayoutGrid } from 'lucide-react'
import { Button } from '../../components/ui/button'

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

interface Course {
  id: string
  title?: string
  titleAr?: string
  titleEn?: string
  thumbnail?: string | null
  price?: number
  level?: string
  status?: string
  _count?: {
    enrollments?: number
    lessons?: number
  }
  instructor?: {
    profile?: {
      firstName?: string
      lastName?: string
    }
  }
}

interface Enrollment {
  id: string
  courseId?: string
  course?: Course | null
  progress?: number
  completedLessons?: number
  totalLessons?: number
  enrolledAt?: string
  status?: string
}

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

function getCourseTitle(course: Course | null | undefined, locale: string): string {
  if (!course) return 'بدون عنوان'
  
  if (course.titleAr || course.titleEn) {
    return locale === 'ar' ? (course.titleAr || course.titleEn || '') : (course.titleEn || course.titleAr || '')
  }
  if (course.title && typeof course.title === 'object') {
    return (course.title as Record<string, string>)[locale] || (course.title as Record<string, string>).ar || (course.title as Record<string, string>).en || 'بدون عنوان'
  }
  return course.title || 'بدون عنوان'
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateString
  }
}

// ════════════════════════════════════════
// LOADING SKELETON
// ══════════════════════════════════════

function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" 
         style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="aspect-video" style={{ background: 'var(--surface-hover)' }} />
      <div className="p-5 space-y-3">
        <div className="h-5 rounded-lg" style={{ background: 'var(--surface-hover)', width: '80%' }} />
        <div className="h-4 rounded" style={{ background: 'var(--surface-hover)', width: '60%' }} />
        <div className="h-2 rounded-full mt-4" style={{ background: 'var(--surface-hover)', width: '100%' }} />
        <div className="h-10 rounded-xl mt-4" style={{ background: 'var(--surface-hover)', width: '120px' }} />
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ══════════════════════════════════════
// ERROR COMPONENT
// ══════════════════════════════════════

interface ErrorMessageProps {
  onRetry: () => void
  message: string
  subMessage?: string
}

function ErrorMessage({ 
  onRetry, 
  message,
  subMessage 
}: ErrorMessageProps) {
  const [retrying, setRetrying] = useState(false)
  
  const handleRetry = async () => {
    setRetrying(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRetrying(false)
    onRetry()
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{message}</h2>
      
      {subMessage && (
        <p className="text-sm text-center mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>{subMessage}</p>
      )}
      
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
        style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}
      >
        {retrying ? (
          <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg> جاري المحاولة...</>
        ) : (
          <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg> إعادة المحاولة</>
        )}
      </button>

      <Link href="/ar/courses" className="mt-4 flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--primary)' }}>
        <Search className="h-4 w-4" />
        تصفح جميع الكورسات المتاحة
      </Link>
    </div>
  )
}

// ══════════════════════════════════════
// EMPTY STATE COMPONENT
// ══════════════════════════════════════

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <BookOpen className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
        </div>
        
        <h2 className="text-2xl font-bold font-madinet mb-3" style={{ color: 'var(--text-primary)' }}>
          {locale === 'ar' ? 'لا توجد كورسات بعد' : 'No Courses Yet'}
        </h2>
        
        <p className="mb-8 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {locale === 'ar' ? 'ابدأ رحلتك التعليمية الآن واستكشف كورساتنا المتميزة' : 'Start your learning journey and discover our amazing courses'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild className="rounded-xl px-8 py-3.5 font-bold text-base hover:scale-105 active:scale-95">
            <Link href={`/${locale}/courses`} className="flex items-center gap-2">
              {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" asChild className="rounded-xl px-8 py-3.5 font-bold text-base">
            <Link href={`${process.env.NEXT_PUBLIC_MAIN_URL || ''}/${locale}/coaching`} className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {locale === 'ar' ? 'احجز استشارة' : 'Book Consultation'}
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { icon: BookOpen, text: locale === 'ar' ? 'كورسات احترافية' : 'Professional Courses' },
            { icon: Users, text: locale === 'ar' ? 'مدربين خبراء' : 'Expert Instructors' },
            { icon: Award, text: locale === 'ar' ? 'شهادات معتمدة' : 'Certified Diplomas' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
              <Icon className="h-6 w-6" style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-medium text-center" style={{ color: 'var(--text-secondary)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════

export default function MyCoursesPage() {
  const locale = useLocale() as 'ar' | 'en'
  const [accountType, setAccountType] = useState<string>('STUDENT')
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    try {
      const u = getUser<{ accountType?: string }>()
      if (u?.accountType) setAccountType(u.accountType)
    } catch (e) {
      console.log('Error getting user account type:', e)
    }
  }, [])

  // ══════════════════════════════════════
  // ENROLLED COURSES WITH ERROR HANDLING
  // ══════════════════════════════════════
  
  const { 
    data: enrolledData, 
    isLoading: loadingEnrolled,
    isError: isEnrolledError,
    error: enrolledError,
    refetch: refetchEnrolled,
    failureCount: enrolledFailureCount
  } = useQuery({
    queryKey: ['my-enrolled-courses', retryCount],
    enabled: accountType === 'STUDENT',
    
    queryFn: async () => {
      console.log('[MyCourses] Fetching enrolled courses...')
      
      try {
        const res: any = await get('/courses/my-courses')
        console.log('[MyCourses] Response:', res?.status, res?.data)
        
        const data: any = res?.data
        
        // Format 1: { data: { enrollments: [...] } }
        if (data?.data?.enrollments && Array.isArray(data.data.enrollments)) {
          console.log('[MyCourses] Found enrollments in data.data.enrollments:', data.data.enrollments.length)
          return data.data.enrollments
        }
        
        // Format 2: { data: [...] }
        if (data?.data && Array.isArray(data.data)) {
          console.log('[MyCourses] Found array in data.data:', data.data.length)
          return data.data
        }
        
        // Format 3: { enrollments: [...] }
        if (data?.enrollments && Array.isArray(data.enrollments)) {
          console.log('[MyCourses] Found enrollments:', data.enrollments.length)
          return data.enrollments
        }
        
        // Format 4: Array at root
        if (Array.isArray(data)) {
          console.log('[MyCourses] Found root array:', data.length)
          return data
        }
        
        // Format 5: Single object
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (data.courseId || data.course) {
            console.log('[MyCourses] Single enrollment object')
            return [data]
          }
        }
        
        console.warn('[MyCourses] Unexpected response format:', data)
        return []
        
      } catch (error) {
        console.error('[MyCourses] Fetch error:', error)
        throw error
      }
    },
    
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  // ══════════════════════════════════════
  // INSTRUCTOR CREATED COURSES
  // ══════════════════════════════════════
  
  const { 
    data: createdCourses = [], 
    isLoading: loadingCreated,
    isError: isCreatedError,
    error: createdError,
    refetch: refetchCreated
  } = useQuery({
    queryKey: ['my-created-courses'],
    enabled: accountType === 'INSTRUCTOR',
    queryFn: async () => {
      try {
        const res: any = await get('/courses/instructor/my-courses')
        const d: any = res?.data?.data ?? res?.data
        return Array.isArray(d) ? d : []
      } catch (e) {
        console.error('[MyCreatedCourses] Error:', e)
        return []
      }
    },
    retry: 2,
    staleTime: 60 * 1000,
  })

  // ══════════════════════════════════════
  // CONSULTING SESSIONS
  // ══════════════════════════════════════
  
  const { 
    data: sessions = [], 
    isLoading: loadingSessions 
  } = useQuery({
    queryKey: ['my-consulting-sessions-learn'],
    enabled: accountType === 'CONSULTANT',
    queryFn: async () => {
      try {
        const res: any = await get('/coaching/consulting/my-sessions')
        const d: any = res?.data?.data ?? res?.data
        return Array.isArray(d) ? d : []
      } catch {
        return []
      }
    },
  })

  // ══════════════════════════════════════
  // CONSULTANT VIEW
  // ══════════════════════════════════════
  
  if (accountType === 'CONSULTANT') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold font-madinet flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Star className="h-8 w-8" style={{ color: 'var(--primary)' }} />
              {locale === 'ar' ? 'جلساتي الاستشارية' : 'My Consulting Sessions'}
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loadingSessions ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl" style={{ background: 'var(--surface)' }} />
              ))}
            </div>
          ) : !sessions || (sessions as any[]).length === 0 ? (
            <EmptyState locale={locale} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(sessions as any[]).map((s: any) => (
                <div key={s.id} className="rounded-xl p-5 transition-all hover:shadow-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
<div className="flex items-center justify-between mb-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      s.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                      s.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {s.status === 'CONFIRMED' ? <><CheckCircle className="h-3 w-3 inline mr-1" />مؤكد</> : s.status === 'PENDING' ? <><Clock className="h-3 w-3 inline mr-1" />معلقة</> : <><XCircle className="h-3 w-3 inline mr-1" />ملغية</>}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.scheduledAt ? formatDate(s.scheduledAt) : ''}
                    </span>
                  </div>
                  <p className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                    {s.topic || 'جلسة استشارية'}
                  </p>
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{s.meetingMethod || 'Online'}</span>
                    <span className="font-bold text-base" style={{ color: 'var(--primary)' }}>
                      {s.price ? `${s.price} ريال` : 'مجاني'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════
  // INSTRUCTOR VIEW
  // ══════════════════════════════════════
  
  if (accountType === 'INSTRUCTOR') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold font-madinet flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <LayoutGrid className="h-8 w-8" style={{ color: 'var(--primary)' }} />
              {locale === 'ar' ? 'الكورات التي أنشأتها' : 'My Created Courses'}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {locale === 'ar' ? 'إدارة ومراقبة كورساتك' : 'Manage and monitor your courses'}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loadingCreated ? (
            <LoadingSkeleton />
          ) : isCreatedError ? (
            <ErrorMessage 
              onRetry={() => refetchCreated()}
              message={locale === 'ar' ? 'فشل تحميل الكورسات' : 'Failed to load courses'}
              subMessage={createdError instanceof Error ? createdError.message : (locale === 'ar' ? 'يرجى التحقق من اتصالك بالإنترنت' : 'Please check your internet connection')}
            />
          ) : !createdCourses || (createdCourses as any[]).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                <BookOpen className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-xl font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                {locale === 'ar' ? 'لم تنشئ أي كورس بعد' : 'No courses created yet'}
              </p>
              <Button asChild>
                <Link href={`/${locale}/dashboard/courses/create`} className="rounded-xl">
                  {locale === 'ar' ? 'إنشاء كورس جديد' : 'Create New Course'}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(createdCourses as any[]).map((course: any) => (
                <div key={course.id} className="rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 group" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div className="relative aspect-video overflow-hidden">
                    {course.thumbnail ? (
                      <img src={getMediaUrl(course.thumbnail) || ''} alt={getCourseTitle(course, locale)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #5120c8 100%)' }}>
                        <BookOpen className="h-12 w-12 text-white/30" />
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold ${course.status === 'PUBLISHED' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {course.status === 'PUBLISHED' ? '✓ منشور' : '✎ مسودة'}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg line-clamp-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                      {getCourseTitle(course, locale)}
                    </h3>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course?._count?.enrollments || 0}{locale === 'ar' ? 'طالب' : 'students'}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course?._count?.lessons || 0}{locale === 'ar' ? 'درس' : 'lessons'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════
  // STUDENT VIEW (Default) - ENHANCED
  // ══════════════════════════════════════
  
  const t = useTranslations('learn')
  const isAr = locale === 'ar'

  // Safe array conversion with proper typing
  const enrollments: Enrollment[] = Array.isArray(enrolledData) ? enrolledData : []
  
  // Defensive filtering with safe array
  const safeEnrollments = enrollments.filter((e): e is Enrollment => !!e && typeof e === 'object')

  // ══════════════════════════════════════
  // ERROR STATE
  // ══════════════════════════════════════
  
  if (isEnrolledError) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold font-madinet" style={{ color: 'var(--text-primary)' }}>
              {locale === 'ar' ? 'كورساتي' : 'My Courses'}
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ErrorMessage 
            onRetry={() => {
              setRetryCount(prev => prev + 1)
              refetchEnrolled()
            }}
            message={locale === 'ar' ? 'حدث خطأ في تحميل الكورسات' : 'Error Loading Courses'}
            subMessage={
              enrolledFailureCount > 2 
                ? (locale === 'ar' ? 'لا يمكن الاتصال بالخادم. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.' : 'Unable to connect to server. Please try again later or contact support.')
                : (enrolledError instanceof Error ? enrolledError.message : (locale === 'ar' ? 'حدث خطأ غير متوقع. جاري إعادة المحاولة...' : 'An unexpected error occurred. Retrying...'))
            }
          />
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════
  
  if (loadingEnrolled) {
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
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════
  // EMPTY STATE
  // ══════════════════════════════════════
  
  if (!loadingEnrolled && !isEnrolledError && enrollments.length === 0) {
    return <EmptyState locale={locale} />
  }

  // ════════════════════════════════════════
  // SUCCESS STATE - Professional Redesign
  // ══════════════════════════════════════

  const activeCount = safeEnrollments.filter(e => (e.progress || 0) > 0 && (e.progress || 0) < 100).length
  const completedCount = safeEnrollments.filter(e => (e.progress || 0) >= 100).length

  const filteredEnrollments2 = safeEnrollments.filter((e) => {
    const prog = e.progress || 0
    if (filter === 'in-progress') return prog > 0 && prog < 100
    if (filter === 'completed') return prog >= 100
    return true
  })

  const tabs = [
    { key: 'all' as const, label: isAr ? 'الكل' : 'All', count: safeEnrollments.length },
    { key: 'in-progress' as const, label: isAr ? 'قيد التعلم' : 'In Progress', count: activeCount },
    { key: 'completed' as const, label: isAr ? t('completed_plural') : 'Completed', count: completedCount },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      padding: '32px 24px 120px',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      {/* PAGE HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--foreground)' }}>
            {isAr ? 'كورساتي' : 'My Courses'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
            {isAr
              ? `${enrollments.length} ${t('course')}  ${activeCount} ${t('active')}  ${completedCount} ${t('completed')}`
              : `${enrollments.length} courses  ${activeCount} active  ${completedCount} completed`}
          </p>
        </div>
        <a href={`/${locale}/courses`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '10px',
          background: '#5120c8', color: '#fff',
          textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(81,32,200,0.3)',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {isAr ? 'استعرض الكورسات' : 'Browse Courses'}
        </a>
      </div>

      {/* STATS BAR */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {[
          { labelAr: 'إجمالي الكورسات', labelEn: 'Total Courses', value: enrollments.length,
            color: '#a78bfa', bg: 'rgba(81,32,200,0.12)',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg> },
          { labelAr: 'قيد التعلم', labelEn: 'In Progress', value: activeCount,
            color: '#34d399', bg: 'rgba(52,211,153,0.12)',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg> },
          { labelAr: 'مكتملة', labelEn: 'Completed', value: completedCount,
            color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg> },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '1rem 1.25rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: stat.bg, color: stat.color, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--foreground)' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                {isAr ? stat.labelAr : stat.labelEn}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTER TABS */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '1.5rem',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px', padding: '4px',
        width: 'fit-content',
      }}>
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '7px 16px', borderRadius: '8px', border: 'none',
              background: filter === tab.key ? '#5120c8' : 'transparent',
              color: filter === tab.key ? '#fff' : 'var(--muted-foreground)',
              fontWeight: filter === tab.key ? 600 : 400,
              fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* COURSE GRID */}
      {filteredEnrollments2.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '16px',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'rgba(81,32,200,0.1)',
            border: '1px solid rgba(81,32,200,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--foreground)' }}>
            {isAr ? 'لم تشترك في أي كورس بعد' : 'No courses yet'}
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem',
            margin: '0 0 1.25rem' }}>
            {isAr ? t('startJourney') : 'Start your learning journey today'}
          </p>
          <a href={`/${locale}/courses`} style={{
            padding: '10px 24px', borderRadius: '10px',
            background: '#5120c8', color: '#fff',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
          }}>
            {isAr ? 'استعرض الكورسات' : 'Browse Courses'}
          </a>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredEnrollments2.map((enrollment: any) => {
            const course = enrollment.course
            const totalLessons = enrollment.totalLessons || course?.stats?.lessonsCount || course?._count?.lessons || 0
            const completedLessons = enrollment.completedLessons || Math.round(((enrollment.progress || 0) / 100) * totalLessons) || 0
            const progress = enrollment.progress || 0
            const isComplete = progress >= 100
            const title = isAr ? (course?.titleAr || course?.title) : (course?.titleEn || course?.title)
            const learnUrl = `/${locale}/learn/${course?.id}`
            const thumbSrc = course?.thumbnail ? getMediaUrl(course.thumbnail) : ''

            return (
              <div key={enrollment.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', overflow: 'hidden',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(81,32,200,0.35)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(81,32,200,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>

                {/* Thumbnail */}
                <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                  {thumbSrc ? (
                    <img src={thumbSrc} alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg,#1a0a2e,#2d1054)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                        stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem',
                    fontWeight: 600,
                    background: isComplete ? 'rgba(34,197,94,0.2)' : 'rgba(81,32,200,0.2)',
                    border: `1px solid ${isComplete ? 'rgba(34,197,94,0.4)' : 'rgba(81,32,200,0.4)'}`,
                    color: isComplete ? '#4ade80' : '#a78bfa',
                  }}>
                    {isComplete
                      ? (isAr ? t('completed') : 'Completed')
                      : (isAr ? 'قيد التعلم' : 'In Progress')}
                  </div>
                </div>

                <div style={{ padding: '1rem 1.25rem' }}>
                  <h3 style={{
                    fontSize: '0.9rem', fontWeight: 700, margin: '0 0 10px',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', lineHeight: 1.4,
                    color: 'var(--foreground)',
                  }}>
                    {title}
                  </h3>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {completedLessons}/{totalLessons} {isAr ? 'درس' : 'lessons'}
                      </span>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700,
                        color: isComplete ? '#4ade80' : '#a78bfa',
                      }}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div style={{
                      height: '5px', background: 'rgba(255,255,255,0.06)',
                      borderRadius: '99px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '99px',
                        width: `${Math.round(progress)}%`,
                        background: isComplete
                          ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                          : 'linear-gradient(90deg,#5120c8,#7c3aed)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  {/* Enrolled date */}
                  {enrollment.enrolledAt && (
                    <p style={{ fontSize: '0.72rem', color: '#666680', margin: '0 0 10px',
                      display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {new Date(enrollment.enrolledAt).toLocaleDateString(
                        isAr ? 'ar-SA' : 'en-US',
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </p>
                  )}

                  {/* CTA button */}
                  <a href={learnUrl} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', padding: '9px', borderRadius: '9px',
                    background: isComplete ? 'rgba(34,197,94,0.12)' : '#5120c8',
                    border: isComplete ? '1px solid rgba(34,197,94,0.3)' : 'none',
                    color: isComplete ? '#4ade80' : '#fff',
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem',
                    transition: 'opacity 0.15s',
                  }}>
                    {isComplete ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {isAr ? 'مراجعة الكورس' : 'Review Course'}
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        {isAr ? (progress > 0 ? 'استكمال التعلم' : 'ابدأ التعلم') : (progress > 0 ? 'Continue' : 'Start Learning')}
                      </>
                    )}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}