'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ArrowRight, BookOpen, Clock, Users, Star, Filter, Search, ChevronDown } from 'lucide-react'
import { get } from '../../../lib/api'
import { Skeleton } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

interface Course {
  id: string
  title: Record<string, string>
  description: Record<string, string>
  slug: string
  price: number
  currency: string
  type: 'VIDEO' | 'LIVE' | 'OFFLINE'
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  duration: number
  enrolledCount: number
  rating: number
  thumbnail?: string
  instructor: {
    name: string
    avatar?: string
  }
  careerPath?: {
    id: string
    name: Record<string, string>
  }
}

interface CareerPath {
  id: string
  name: Record<string, string>
}

export default function CoursesPage() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const isRTL = locale === 'ar'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [careerPath, setCareerPath] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [sort, setSort] = useState<string>('newest')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: careerPaths } = useQuery({
    queryKey: ['career-paths'],
    queryFn: () => get<CareerPath[]>('/career/paths'),
  })

  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['courses', page, debouncedSearch, careerPath, type, level, sort],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: 'PUBLISHED',
      })

      if (debouncedSearch) params.append('search', debouncedSearch)
      if (careerPath) params.append('careerPath', careerPath)
      if (type) params.append('type', type)
      if (level) params.append('level', level)
      if (sort) params.append('sort', sort)

      return get<{
        data: Course[]
        total: number
        page: number
        totalPages: number
      }>(`/courses?${params.toString()}`)
    },
  })

  const courses = (Array.isArray(coursesData?.data) ? coursesData.data : (coursesData as any)?.data?.data || [])
  const totalPages = coursesData?.data?.totalPages || 1

  const sortOptions = [
    { value: 'newest', label: t('courses.sort_newest') },
    { value: 'popular', label: t('courses.sort_popular') },
    { value: 'price_asc', label: `${t('courses.sort_price')} (${isRTL ? '↑' : '↓'})` },
    { value: 'price_desc', label: `${t('courses.sort_price')} (${isRTL ? '↓' : '↑'})` },
    { value: 'rating_asc', label: `${t('courses.sort_rating')} (${isRTL ? '↑' : '↓'})` },
    { value: 'rating_desc', label: `${t('courses.sort_rating')} (${isRTL ? '↓' : '↑'})` },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('courses.title')}
          </h1>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
            <Input
              placeholder={t('courses.search_placeholder')}
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className={`pl-10 ${isRTL ? 'pr-10' : 'pl-10'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={careerPath} onValueChange={setCareerPath}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('courses.filters')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                {((careerPaths as any)?.data?.careerPaths || []).map((path: CareerPath) => (
                  <SelectItem key={path.id} value={path.id}>
                    {(path as any).title || path.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder={t('course.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                <SelectItem value="VIDEO">فيديو</SelectItem>
                <SelectItem value="LIVE">مباشر</SelectItem>
                <SelectItem value="OFFLINE">حضوري</SelectItem>
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder={t('course.level')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                <SelectItem value="BEGINNER">مبتدئ</SelectItem>
                <SelectItem value="INTERMEDIATE">متوسط</SelectItem>
                <SelectItem value="ADVANCED">متقدم</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t('courses.sort')} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="group relative">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <div className="mt-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('errors.something_wrong')}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.empty')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: Course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
                    {course.thumbnail && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={course.thumbnail}
                          alt={course.title[locale] || course.title.en}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {course.type}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                          {course.level}
                        </span>
                        {course.careerPath && (
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            {course.careerPath.name[locale] || course.careerPath.name.en}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold line-clamp-2">
                        {course.title[locale] || course.title.en}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {course.description[locale] || course.description.en}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.duration}h
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.enrolledCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {course.rating.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {course.price} {course.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {isRTL ? '→' : '←'} {t('common.previous')}
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('common.next')} {isRTL ? '←' : '→'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
