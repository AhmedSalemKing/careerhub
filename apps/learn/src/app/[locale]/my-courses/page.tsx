'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ArrowRight, BookOpen, Clock, Play, BarChart3 } from 'lucide-react'
import { get } from '../../../lib/api'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { Progress } from '../../components/ui/progress'

interface EnrolledCourse {
  id: string
  course: {
    id: string
    title: Record<string, string>
    description: Record<string, string>
    slug: string
    thumbnail?: string
    duration: number
    instructor: {
      name: string
    }
  }
  enrolledAt: string
  progress: number
  completedLessons: number
  totalLessons: number
  lastAccessedAt?: string
  currentLesson?: {
    id: string
    title: Record<string, string>
  }
}

export default function MyCoursesPage() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const isRTL = locale === 'ar'

  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => get<EnrolledCourse[]>('/courses/my-courses'),
  })

  const courses = (Array.isArray(coursesData?.data) ? coursesData.data : (coursesData as any)?.data?.data || [])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('myCourses.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('myCourses.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
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
            <div className="mx-auto max-w-md">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('myCourses.empty')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('myCourses.empty_description')}
              </p>
              <Button asChild>
                <Link href="/courses">
                  {t('myCourses.browse')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((enrolledCourse: EnrolledCourse) => (
              <div key={enrolledCourse.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                {enrolledCourse.course.thumbnail && (
                  <div className="aspect-video relative">
                    <img
                      src={enrolledCourse.course.thumbnail}
                      alt={enrolledCourse.course.title[locale] || enrolledCourse.course.title.en}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/courses/${enrolledCourse.course.slug}/learn`}>
                          <Play className="h-4 w-4 mr-2" />
                          {t('myCourses.resume')}
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {enrolledCourse.course.title[locale] || enrolledCourse.course.title.en}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {enrolledCourse.course.instructor.name}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('myCourses.progress')}</span>
                      <span className="font-medium">{enrolledCourse.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={enrolledCourse.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {enrolledCourse.completedLessons} / {enrolledCourse.totalLessons} {t('myCourses.lessons_completed')}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {enrolledCourse.course.duration}h
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      {enrolledCourse.completedLessons}/{enrolledCourse.totalLessons}
                    </div>
                  </div>

                  {/* Current Lesson */}
                  {enrolledCourse.currentLesson && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">{t('myCourses.current_lesson')}</p>
                      <p className="text-sm font-medium line-clamp-1">
                        {enrolledCourse.currentLesson.title[locale] || enrolledCourse.currentLesson.title.en}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button className="w-full" asChild>
                    <Link href={`/courses/${enrolledCourse.course.slug}/learn`}>
                      {enrolledCourse.progress > 0 ? t('myCourses.resume') : t('myCourses.start')}
                      <ArrowRight className={`ml-2 h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
