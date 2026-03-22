'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, Clock, Users, Star, BookOpen, Award, Play, CheckCircle } from 'lucide-react'
import { get, post } from '../../../../lib/api'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { useToast } from '../../../../lib/toast'

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
    id: string
    name: string
    bio?: string
    avatar?: string
  }
  careerPath?: {
    id: string
    name: Record<string, string>
  }
  modules: Array<{
    id: string
    title: Record<string, string>
    description?: Record<string, string>
    lessons: Array<{
      id: string
      title: Record<string, string>
      description?: Record<string, string>
      duration: number
      order: number
      isPreview: boolean
    }>
  }>
  reviews: Array<{
    id: string
    rating: number
    comment: string
    user: {
      name: string
      avatar?: string
    }
    createdAt: string
  }>
  whatYouLearn?: string[]
  requirements?: string[]
  includesCertificate: boolean
}

export default function CourseDetailPage() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const isRTL = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { toast } = useToast()

  const queryClient = useQueryClient()

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => get<Course>(`/courses/${slug}`),
  })

  const enrollMutation = useMutation({
    mutationFn: () => post(`/courses/${course?.data?.id}/enroll`),
    onSuccess: () => {
      toast({ description: t('course.enroll_success'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['course', slug] })
      router.push(`/courses/${slug}/learn`)
    },
    onError: () => {
      toast({ description: t('errors.something_wrong'), variant: 'danger' })
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('errors.course_not_found')}</h1>
          <Button onClick={() => router.back()} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  const courseData = course.data

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {courseData.type}
                </span>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                  {courseData.level}
                </span>
                {courseData.careerPath && (
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {courseData.careerPath.name[locale] || courseData.careerPath.name.en}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                {courseData.title[locale] || courseData.title.en}
              </h1>

              <p className="text-lg text-muted-foreground">
                {courseData.description[locale] || courseData.description.en}
              </p>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{courseData.rating.toFixed(1)}</span>
                  <span>({courseData.enrolledCount} {t('course.students')})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{courseData.duration} {t('course.hours')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{courseData.modules.reduce((acc, module) => acc + module.lessons.length, 0)} {t('course.lessons')}</span>
                </div>
                {courseData.includesCertificate && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{t('course.certificate')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Video Preview */}
            {courseData.thumbnail && (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={courseData.thumbnail}
                  alt={courseData.title[locale] || courseData.title.en}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Play className="h-5 w-5" />
                    {t('course.preview')}
                  </Button>
                </div>
              </div>
            )}

            {/* What You'll Learn */}
            {courseData.whatYouLearn && courseData.whatYouLearn.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">{t('course.what_you_learn')}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {courseData.whatYouLearn.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements */}
            {courseData.requirements && courseData.requirements.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">{t('course.requirements')}</h2>
                <ul className="space-y-2">
                  {courseData.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-primary">•</span>
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Curriculum */}
            <section>
              <h2 className="text-2xl font-bold mb-4">{t('course.curriculum')}</h2>
              <div className="space-y-4">
                {courseData.modules.map((module, index) => (
                  <div key={module.id} className="border rounded-lg">
                    <div className="p-4 border-b bg-muted/50">
                      <h3 className="font-semibold">
                        {module.title[locale] || module.title.en}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description[locale] || module.description.en}
                        </p>
                      )}
                    </div>
                    <div className="divide-y">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                              {lesson.order}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">
                                {lesson.title[locale] || lesson.title.en}
                              </h4>
                              {lesson.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {lesson.description[locale] || lesson.description.en}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{lesson.duration}m</span>
                            {lesson.isPreview && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs">
                                {t('course.preview')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Instructor */}
            <section>
              <h2 className="text-2xl font-bold mb-4">{t('course.instructor')}</h2>
              <div className="flex items-start gap-4">
                {courseData.instructor.avatar && (
                  <img
                    src={courseData.instructor.avatar}
                    alt={courseData.instructor.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{courseData.instructor.name}</h3>
                  {courseData.instructor.bio && (
                    <p className="text-muted-foreground mt-1">
                      {courseData.instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Reviews */}
            {courseData.reviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">{t('course.reviews')}</h2>
                <div className="space-y-4">
                  {courseData.reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {review.user.avatar && (
                          <img
                            src={review.user.avatar}
                            alt={review.user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{review.user.name}</h4>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(review.createdAt).toLocaleDateString(locale)}
                          </p>
                          <p className="mt-2">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="border rounded-lg p-6 space-y-6">
              {/* Price */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {courseData.price} {courseData.currency}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('course.one_time_payment')}
                </p>
              </div>

              {/* Enroll Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? t('common.loading') : t('course.enroll')}
              </Button>

              {/* Course Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('course.duration')}</span>
                  <span className="font-medium">{courseData.duration} {t('course.hours')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('course.lessons')}</span>
                  <span className="font-medium">
                    {courseData.modules.reduce((acc, module) => acc + module.lessons.length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('course.level')}</span>
                  <span className="font-medium">{courseData.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('course.students')}</span>
                  <span className="font-medium">{courseData.enrolledCount}</span>
                </div>
                {courseData.includesCertificate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('course.certificate')}</span>
                    <Award className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
