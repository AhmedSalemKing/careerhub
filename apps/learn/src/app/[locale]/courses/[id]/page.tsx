'use client'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { getMediaUrl, getCourseTitle } from '../../../../lib/media'
import { useLocale } from 'next-intl'
import { Play, Clock, Users, BookOpen, ChevronDown, Lock, CheckCircle, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LEARN_URL } from '../../../../lib/constants'

export default function CourseDetailPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const courseId = params.id
  const locale = useLocale()
  const router = useRouter()
  const ar = locale === 'ar'
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentChecked, setEnrollmentChecked] = useState(false)
  
  // 🎨 إضافة حالة للثيم (فاتح/داكن)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // 🔄 التحقق من تفضيلات الثيم عند تحميل الصفحة
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (systemPrefersDark) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    const checkEnrollment = async () => {
      const token = localStorage.getItem('deveway_token')
        || document.cookie.match(/deveway_token=([^;]+)/)?.[1]

      if (!token || !courseId) {
        setEnrollmentChecked(true)
        return
      }

      try {
        const API = process.env.NEXT_PUBLIC_API_URL || ''
        const res = await fetch(`${API}/api/courses/${courseId}/enrollment`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setIsEnrolled(!!data?.data?.enrollment)
      } catch {
        setIsEnrolled(false)
      } finally {
        setEnrollmentChecked(true)
      }
    }

    checkEnrollment()
  }, [courseId])

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      const d = (res?.data as any)?.data?.course ?? (res?.data as any)?.data ?? (res?.data as any)
      return d
    },
    enabled: !!courseId,
  })

  if (isLoading) return <CourseSkeleton />
  if (!course) return <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>الكورس غير موجود</div>

  const thumb = getMediaUrl(course.thumbnail)
  const previewVideo = getMediaUrl(course.previewVideo)
  const instructorName = course.instructor?.profile
    ? `${course.instructor.profile.firstName} ${course.instructor.profile.lastName}`
    : 'المحاضر'

  const sections = course.sections ?? course.modules ?? []

  return (
    <div 
      className="min-h-screen" 
      dir="rtl" 
      style={{ 
        background: 'var(--background)',
        // تطبيق الثيم على العنصر الأب
        ...(theme === 'dark' ? { '--theme-mode': 'dark' } : {})
      }}
      data-theme={theme}
    >
      {/* Hero — NO gradient, solid navy */}
      <div className="py-10 px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-2">
          {/* Info */}
          <div>
            {course.category && (
              <span className="text-xs mb-2 block" style={{ color: 'var(--primary)' }}>
                {course.category.nameAr || course.category.nameEn}
              </span>
            )}
            
            {/* 🎯 العنوان مع دعم الثيم - التعديل المطلوب */}
            <h1 
              className="text-3xl font-bold font-madinet mb-4" 
              style={{ 
                // ✅ أسود في الوضع الفاتح، أبيض في الوضع الداكن
                color: theme === 'dark' ? '#FFFFFF' : 'rgb(0 0 0)'
              }}
            >
              {getCourseTitle(course, locale)}
            </h1>
            
            <p className="mb-6" style={{ color: 'rgba(248,248,250,0.65)' }}>
              {course.descriptionAr || course.descriptionEn || course.description}
            </p>

            <div className="flex flex-wrap gap-4 text-sm mb-6" style={{ color: 'rgba(248,248,250,0.5)' }}>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course._count?.enrollments || 0} طالب
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {sections.length} قسم
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {course.level === 'BEGINNER' ? 'مبتدئ' :
                 course.level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: 'var(--primary)' }}
              >
                {instructorName[0]}
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#F8F8FA' }}>{instructorName}</p>
                <p className="text-xs" style={{ color: 'rgba(248,248,250,0.4)' }}>المحاضر</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl overflow-hidden aspect-video" style={{ background: 'rgba(0,0,0,0.3)' }}>
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
              <div className="flex h-full items-center justify-center">
                <Play className="h-16 w-16" style={{ color: 'rgba(81,32,200,0.3)' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price bar */}
      <div
        className="sticky top-0 z-20 py-3 px-6"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            {course.price > 0 ? (
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{course.price} ريال</span>
            ) : (
              <span className="text-2xl font-bold" style={{ color: '#2BBFA3' }}>مجاني</span>
            )}
          </div>
          {!enrollmentChecked ? (
            <div className="flex items-center gap-2 rounded-xl px-6 py-2.5" style={{ background: 'var(--surface-2)' }}>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
              <span className="text-sm" style={{ color: 'var(--muted)' }}>جاري التحقق...</span>
            </div>
          ) : isEnrolled ? (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold"
                style={{ background: 'rgba(43,191,163,0.1)', border: '1px solid rgba(43,191,163,0.2)', color: '#2BBFA3' }}
              >
                <CheckCircle className="h-5 w-5" />
                مشترك في هذا الكورس
              </div>
              <a
                href={`${LEARN_URL}/${locale}/learn/${courseId}`}
                className="btn-primary"
                style={{ fontSize: 14, padding: '10px 20px' }}
              >
                ابدأ التعلم
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <a
              href={`${process.env.NEXT_PUBLIC_MAIN_URL || ''}/${locale}/checkout/${courseId}`}
              className="btn-cta-primary"
              style={{ fontSize: 15, padding: '12px 28px' }}
            >
              <Lock className="h-4 w-4" />
              {course.price === 0 ? 'اشترك مجاناً' : `الاشتراك — ${course.price} ريال`}
            </a>
          )}
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold font-madinet mb-6" style={{ color: 'var(--foreground)' }}>محتوى الكورس</h2>
        {sections.length > 0 ? (
          <div className="space-y-3">
            {sections.map((section: any) => (
              <div
                key={section.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
              >
                <button
                  onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-4 text-right transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  <span className="font-semibold">
                    {section.title || section.titleAr || section.titleEn}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {section.lessons?.length || 0} درس
                    </span>
                    <ChevronDown
                      className="h-4 w-4 transition-transform"
                      style={{
                        color: 'var(--muted)',
                        transform: openSection === section.id ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  </div>
                </button>
                {openSection === section.id && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {section.lessons?.map((lesson: any) => {
                      const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''
                      const canAccess = isEnrolled || lesson.isFree
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            if (canAccess) {
                              window.location.href = `${LEARN_URL}/${locale}/learn/${courseId}?lesson=${lesson.id}`
                            } else {
                              window.location.href = `${MAIN_URL}/${locale}/checkout/${courseId}`
                            }
                          }}
                          className={`flex items-center justify-between p-3 px-4 transition-colors ${canAccess ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center text-xs"
                              style={{ background: 'rgba(81,32,200,0.15)', color: 'var(--primary)' }}
                            >
                              {canAccess ? <Play className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                              {lesson.title || lesson.titleAr || lesson.titleEn}
                            </span>
                          </div>
                          {lesson.isFree ? (
                            <span
                              className="text-xs rounded-full px-2 py-0.5"
                              style={{ background: 'rgba(43,191,163,0.12)', color: '#2BBFA3' }}
                            >
                              مجاني
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>مدفوع</span>
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
            className="rounded-xl p-8 text-center"
            style={{ border: '1px solid var(--border)' }}
          >
            <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p style={{ color: 'var(--muted)' }}>لم يتم إضافة محتوى لهذا الكورس بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CourseSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: 'var(--surface-2)' }} />
      ))}
    </div>
  )
}