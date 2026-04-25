'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Search, Grid3X3, List, Clock, Users, Star, Play, BookOpen, ChevronRight, AlertTriangle } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { api } from '../../../lib/api'

// ✅ FIXED: تأكد أن API_BASE واضح وصحيح
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

function thumbUrl(thumbnail?: string) {
  if (!thumbnail) return null
  if (thumbnail.startsWith('http')) return thumbnail
  return thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`
}

type ApiCourse = {
  id: string
  title?: string        
  titleEn?: string
  titleAr?: string
  description?: string  
  descriptionEn?: string
  descriptionAr?: string
  price: number
  duration?: number
  level: string
  status?: string
  thumbnail?: string
  careerPath?: { titleEn?: string; titleAr?: string }
  _count?: { enrollments?: number }
}

type NormalizedCourse = {
  id: string
  title: { ar: string; en: string }
  description: { ar: string; en: string }
  price: number
  duration: number
  enrolledCount: number
  level: string
  thumbnail?: string
  category: { ar: string; en: string }
}

function normalizeCourse(c: ApiCourse): NormalizedCourse {
  const fallbackTitle = c.titleAr || c.titleEn || c.title || 'بدون عنوان'
  const fallbackTitleEn = c.titleEn || c.title || fallbackTitle
  const fallbackDesc = c.descriptionAr || c.descriptionEn || c.description || ''
  const fallbackDescEn = c.descriptionEn || c.description || ''
  return {
    id: c.id,
    title: { ar: fallbackTitle, en: fallbackTitleEn },
    description: { ar: fallbackDesc, en: fallbackDescEn },
    price: c.price,
    duration: c.duration || 0,
    enrolledCount: c._count?.enrollments || 0,
    level: c.level,
    thumbnail: c.thumbnail,
    category: {
      ar: c.careerPath?.titleAr || c.careerPath?.titleEn || 'عام',
      en: c.careerPath?.titleEn || 'General',
    },
  }
}

export default function CoursesPage() {
  const locale = useLocale() as 'ar' | 'en'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const { data: categoriesData } = useQuery({
    queryKey: ['main-categories', locale],
    queryFn: async () => {
      const res = await api.get('/courses/categories?language=' + locale)
      const all: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      return all.filter((c: any) => !c.parentId)
    }
  })
  const mainCategories = categoriesData || []
  const allCoursesCount = mainCategories.reduce((sum: number, cat: any) => sum + (cat.courseCount || 0), 0)

  const { data: rawCourses, isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['courses', selectedCategoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'PUBLISHED' })
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId)
      const res = await api.get(`/courses?${params.toString()}`)
      const data = res.data?.data ?? res.data
      if (Array.isArray(data)) return data as ApiCourse[]
      if (Array.isArray(data?.courses)) return data.courses as ApiCourse[]
      if (Array.isArray(data?.items)) return data.items as ApiCourse[]
      return [] as ApiCourse[]
    },
    staleTime: 2 * 60 * 1000,
  })
  const courses = (rawCourses || []).map(normalizeCourse)
  const error = fetchError ? ((fetchError as any).message || 'Failed to load courses') : null

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const titleObj = course.title as { ar?: string; en?: string } | undefined
      const titleText = locale === 'ar' 
        ? (titleObj?.ar || titleObj?.en || '')
        : (titleObj?.en || titleObj?.ar || '')
      const matchesSearch = titleText.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLevel = !selectedLevel || course.level === selectedLevel
      return matchesSearch && matchesLevel
    })
  }, [searchQuery, selectedLevel, locale, courses])

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return { text: locale === 'ar' ? 'مبتدئ' : 'Beginner', cls: 'bg-green-500/20 text-green-400' }
      case 'INTERMEDIATE':
        return { text: locale === 'ar' ? 'متوسط' : 'Intermediate', cls: 'bg-amber-500/20 text-amber-400' }
      case 'ADVANCED':
        return { text: locale === 'ar' ? 'متقدم' : 'Advanced', cls: 'bg-red-500/20 text-red-400' }
      default:
        return { text: level, cls: 'bg-blue-500/20 text-blue-400' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  // ✅ NEW: عرض حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center p-8">
          <div className="flex items-center justify-center mb-4">
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {locale === 'ar' ? 'حدث خطأ' : 'Error occurred'}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
          
          {/* ✅ Debug Info */}
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm" style={{ color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'معلومات التصحيح' : 'Debug info'}
            </summary>
            <pre className="mt-2 p-3 text-xs bg-black/20 rounded overflow-auto" dir="ltr">
              {JSON.stringify({ API_BASE, error }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-madinet" style={{ color: 'var(--text-primary)' }}>
            {locale === 'ar' ? 'استكشف الكورسات' : 'Explore Courses'}
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            {locale === 'ar' ? 'اكتشف الكورسات المصممة لتطوير مهاراتك' : 'Discover courses designed to develop your skills'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Category Tabs */}
        {mainCategories.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch' as any,
            marginBottom: 24,
          }}>
            <style>{`.cat-scroll::-webkit-scrollbar { display: none }`}</style>
            <button
              onClick={() => setSelectedCategoryId(null)}
              className="rounded-full text-sm font-medium transition-colors"
              style={{
                flexShrink: 0,
                padding: '6px 16px',
                background: selectedCategoryId === null ? 'var(--primary)' : 'var(--surface)',
                color: selectedCategoryId === null ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              {locale === 'ar' ? 'الكل' : 'All'} ({allCoursesCount})
            </button>
            {mainCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className="rounded-full text-sm font-medium transition-colors"
                style={{
                  flexShrink: 0,
                  padding: '6px 16px',
                  background: selectedCategoryId === cat.id ? 'var(--primary)' : 'var(--surface)',
                  color: selectedCategoryId === cat.id ? '#fff' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {cat.name} ({cat.courseCount || 0})
              </button>
            ))}
          </div>
        )}

        {/* Filters Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <Input
              type="search"
              placeholder={locale === 'ar' ? 'ابحث عن كورس...' : 'Search for a course...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedLevel || ''}
              onChange={(e) => setSelectedLevel(e.target.value || null)}
              className="rounded-lg border px-4 py-2 text-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">{locale === 'ar' ? 'جميع المستويات' : 'All Levels'}</option>
              <option value="BEGINNER">{locale === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
              <option value="INTERMEDIATE">{locale === 'ar' ? 'متوسط' : 'Intermediate'}</option>
              <option value="ADVANCED">{locale === 'ar' ? 'متقدم' : 'Advanced'}</option>
            </select>

            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 transition-colors"
                style={{ background: viewMode === 'grid' ? 'var(--primary)' : 'var(--surface)', color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)' }}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2 transition-colors"
                style={{ background: viewMode === 'list' ? 'var(--primary)' : 'var(--surface)', color: viewMode === 'list' ? 'white' : 'var(--text-secondary)' }}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ✅ FIXED: عرض العدد الصحيح */}
        <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {filteredCourses.length} {locale === 'ar' ? 'كورس متاح' : 'courses available'}
          {filteredCourses.length !== courses.length && (
            <span> ({locale === 'ar' ? 'من' : 'of'} {courses.length} {locale === 'ar' ? 'إجمالي' : 'total'})</span>
          )}
        </p>

        {/* Courses Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'list'
            ? '1fr'
            : isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 20,
        }}>
          {filteredCourses.map((course, index) => {
            const levelBadge = getLevelBadge(course.level)
            return (
              <Link
                key={course.id}
                href={`/${locale}/courses/${course.id}`}
                className="group rounded-xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', width: '100%' }}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', width: '100%' }}>
                  {thumbUrl(course.thumbnail) ? (
                    <img
                      src={thumbUrl(course.thumbnail)!}
                      alt={course.title[locale]}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="h-full w-full items-center justify-center"
                    style={{
                      display: course.thumbnail ? 'none' : 'flex',
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #5120c8 100%)',
                    }}
                  >
                    <BookOpen className="h-12 w-12 text-white/50" />
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelBadge.cls}`}>
                      {levelBadge.text}
                    </span>
                  </div>
                  {course.duration > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-md px-2 py-1 text-xs font-medium" style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}>
                        {course.duration}h
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: 'clamp(12px, 2vw, 20px)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--primary)' }}>
                    {course.category[locale]}
                  </p>
                  <h3 className={`font-bold line-clamp-2 mb-3 group-hover:text-blue-400 transition-colors ${isMobile ? 'text-sm' : 'text-lg'}`} style={{ color: 'var(--text-primary)' }}>
                    {course.title[locale]}
                  </h3>

                  <div className="flex items-center gap-4 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.enrolledCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                      {course.price}
                      <span className="text-sm font-normal mr-1" style={{ color: 'var(--text-muted)' }}>
                        {locale === 'ar' ? 'ر.س' : 'SAR'}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 rtl:rotate-180" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {filteredCourses.length === 0 && !loading && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {locale === 'ar' ? 'لا توجد كورسات' : 'No courses found'}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {locale === 'ar' ? 'لم يتم نشر أي كورسات بعد' : 'No courses have been published yet'}
            </p>
            
            {/* ✅ Debug: اعرض عدد الكورسات المخزنة */}
            {courses.length > 0 && (
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                ({locale === 'ar' ? 'يوجد' : 'There are'} {courses.length} {locale === 'ar' ? 'كورس لكن لا تتطابق مع الفلتر' : 'courses but none match filter'})
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}