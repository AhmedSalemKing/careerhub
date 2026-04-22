'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { 
  BookOpen, Play, ArrowRight, CheckCircle, RefreshCw, 
  AlertTriangle, Loader2, Search, Filter, LayoutGrid,
  Clock, Users, Star, TrendingUp, ChevronLeft, Award
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { getUser } from '../../../lib/auth'
import { getMediaUrl } from '../../../lib/media'

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
        <AlertTriangle className="h-10 w-10" style={{ color: '#ef4444' }} />
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
          <><Loader2 className="h-4 w-4 animate-spin" /> جاري المحاولة...</>
        ) : (
          <><RefreshCw className="h-4 w-4" /> إعادة المحاولة</>
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
                      {s.status === 'CONFIRMED' ? '✓ مؤكد' : s.status === 'PENDING' ? '⏳ معلقة' : '✗ ملغية'}
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
  
  // Safe array conversion with proper typing
  const enrollments: Enrollment[] = Array.isArray(enrolledData) ? enrolledData : []
  
  // Safe filtering
  const filteredEnrollments = enrollments.filter((e: Enrollment) => {
    if (!e) return false
    const prog = e.progress || 0
    if (filter === 'in-progress') return prog > 0 && prog < 100
    if (filter === 'completed') return prog >= 100
    return true
  })

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
  // SUCCESS STATE - Show Courses
  // ══════════════════════════════════════
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header with Stats */}
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-madinet" style={{ color: 'var(--text-primary)' }}>
                {locale === 'ar' ? 'كورساتي' : 'My Courses'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {enrollments.length} {locale === 'ar' ? 'كورس' : 'courses'} · {filteredEnrollments.length} {locale === 'ar' ? 'معروض' : 'shown'}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {enrollments.filter(e => (e.progress || 0) > 0).length} {locale === 'ar' ? 'نشط' : 'Active'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                <span className="text-sm font-medium" style={{ color: '#22c55e' }}>
                  {enrollments.filter(e => (e.progress || 0) >= 100).length} {locale === 'ar' ? 'مكتمل' : 'Completed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          
          {[
            { key: 'all' as const, label: locale === 'ar' ? 'الكل' : 'All', count: enrollments.length },
            { key: 'in-progress' as const, label: locale === 'ar' ? 'قيد التعلم' : 'In Progress', count: enrollments.filter(e => (e.progress || 0) > 0 && (e.progress || 0) < 100).length },
            { key: 'completed' as const, label: locale === 'ar' ? 'مكتملة' : 'Completed', count: enrollments.filter(e => (e.progress || 0) >= 100).length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                background: filter === tab.key ? 'var(--primary)' : 'transparent',
                color: filter === tab.key ? 'white' : 'var(--text-secondary)',
                border: filter === tab.key ? 'none' : '1px solid var(--border)',
              }}
            >
              {tab.label}
              <span className="mr-1 opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Course Grid */}
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {locale === 'ar' ? 'لا توجد كورسات في هذه الفئة' : 'No courses in this category'}
            </p>
            <button 
              onClick={() => setFilter('all')}
              className="mt-4 text-sm underline" style={{ color: 'var(--primary)' }}
            >
              {locale === 'ar' ? 'عرض كل الكورسات' : 'Show all courses'}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEnrollments.map((enrollment: Enrollment) => {
              const course: Course = (enrollment.course || {}) as Course
              const progress: number = enrollment.progress || 0
              const courseId: string = course.id || enrollment.courseId || ''
              
              // ✅ FIXED: Safe thumbnail URL handling with proper typing
              let thumbSrc: string = ''
              try {
                const rawThumb: string | null | undefined = course.thumbnail
                if (rawThumb) {
                  const mediaUrl = getMediaUrl(rawThumb)
                  thumbSrc = mediaUrl || ''
                }
              } catch (e) {
                console.warn('Error getting thumbnail:', e)
                thumbSrc = ''
              }

              // Determine status
              const isCompleted: boolean = progress >= 100
              const isActive: boolean = progress > 0 && progress < 100
              const isNew: boolean = progress === 0

              // Safe lessons count
              const lessonsCount: number = course._count?.lessons ?? 0
              const completedLessonsCount: number = enrollment.completedLessons ?? 0
              const totalLessonsCount: number = enrollment.totalLessons ?? lessonsCount

              return (
                <div
                  key={enrollment.id || courseId}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  style={{ 
                    border: '1px solid var(--border)', 
                    background: 'var(--surface)',
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    {thumbSrc ? (
                      <img 
                        src={thumbSrc}
                        alt={getCourseTitle(course, locale)}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.15) 100%)' }}>
                        <BookOpen className="h-16 w-16" style={{ color: 'rgba(99,102,241,0.3)' }} />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 z-10 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                          ? 'bg-blue-500 text-white'
                          : 'bg-black/50 text-white'
                    }`}>
                      {isCompleted ? (
                        <><CheckCircle className="inline h-3.5 w-3.5 mr-1" /> مكتمل ✓</>
                      ) : isActive ? (
                        <><Play className="inline h-3.5 w-3.5 mr-1" /> {Math.round(progress)}%</>
                      ) : (
                        <><Clock className="inline h-3.5 w-3.5 mr-1" /> جديد</>
                      )}
                    </div>

                    {/* Progress Bar Overlay */}
                    {isActive && !isCompleted && (
                      <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                          <div 
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {getCourseTitle(course, locale)}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                      {course.level && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'var(--surface-hover)' }}>
                          <TrendingUp className="h-3.5 w-3.5" />
                          {course.level === 'BEGINNER' ? (locale === 'ar' ? 'مبتدئ' : 'Beginner') : 
                           course.level === 'INTERMEDIATE' ? (locale === 'ar' ? 'متوسط' : 'Intermediate') : 
                           (locale === 'ar' ? 'متقدم' : 'Advanced')}
                        </span>
                      )}
                      
                      {lessonsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {lessonsCount} {locale === 'ar' ? 'درس' : 'lessons'}
                        </span>
                      )}
                      
                      {enrollment.enrolledAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(enrollment.enrolledAt)}
                        </span>
                      )}
                    </div>

                    {/* Progress Section */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-medium">{Math.round(progress)}% {locale === 'ar' ? 'مكتمل' : 'complete'}</span>
                        <span>{completedLessonsCount}/{totalLessonsCount} {locale === 'ar' ? 'درس' : 'lessons'}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: isCompleted 
                              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                              : 'linear-gradient(90deg, var(--primary), #6366f1)',
                            boxShadow: progress > 0 ? '0 0 10px rgba(99,102,241,0.3)' : 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <a
                      href={`/learn/${locale}/learn/${courseId}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        background: isCompleted 
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                          : 'linear-gradient(135deg, var(--primary), #6366f1)',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.25)'
                      }}
                    >
                      {isNew && (<Play className="h-4 w-4" />)}
                      {isActive && (<Play className="h-4 w-4" />)}
                      {isCompleted && (<CheckCircle className="h-4 w-4" />)}
                      {isNew 
                        ? (locale === 'ar' ? 'ابدأ التعلم' : 'Start Learning')
                        : isActive 
                          ? (locale === 'ar' ? 'متابعة' : 'Continue')
                          : (locale === 'ar' ? 'مراجعة' : 'Review')
                      }
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {locale === 'ar' ? 'هل تريد تعلم المزيد؟' : 'Want to learn more?'}
          </p>
          <Button asChild variant="outline" size="lg">
            <Link href={`/${locale}/courses`} className="gap-2">
              {locale === 'ar' ? 'استكشف كورسات جديدة' : 'Discover New Courses'}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}