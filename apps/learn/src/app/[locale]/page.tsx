'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowRight, BookOpen, Clock, Users, Star } from 'lucide-react'
import { get } from '../../lib/api'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'

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
}

interface CareerPath {
  id: string
  name: Record<string, string>
  description: Record<string, string>
  icon: string
}

export default function HomePage() {
  const t = useTranslations()

  const { data: featuredCourses, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => get<Course[]>('/courses/featured'),
  })

  const { data: careerPaths, isLoading: loadingPaths } = useQuery({
    queryKey: ['career-paths'],
    queryFn: () => get<CareerPath[]>('/career/paths'),
  })

  const { data: allCourses, isLoading: loadingAll } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => get<{ data: Course[]; total: number }>('/courses?status=PUBLISHED&limit=8'),
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent animate-gradient">
                {t('home.hero_title')}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {t('home.hero_subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link href="/courses">
                  {t('home.all_courses')}
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('home.featured')}
            </h2>
          </div>

          {loadingFeatured ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="group relative">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <div className="mt-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : ((featuredCourses as any)?.data?.courses?.length > 0) ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {((featuredCourses as any)?.data?.courses || []).map((course: Course) => (
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
                          alt={course.title.ar || course.title.en}
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
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">
                        {course.title.ar || course.title.en}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {course.description.ar || course.description.en}
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
          ) : (
            <div className="mt-12 text-center text-muted-foreground">
              {t('common.empty')}
            </div>
          )}
        </div>
      </section>

      {/* Career Paths */}
      <section className="py-24 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('home.categories')}
            </h2>
          </div>

          {loadingPaths ? (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : ((careerPaths as any)?.data?.careerPaths?.length > 0) ? (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {((careerPaths as any)?.data?.careerPaths || []).map((path: CareerPath) => (
                <Link
                  key={path.id}
                  href={`/courses?careerPath=${path.id}`}
                  className="group flex items-center gap-4 rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-2xl">{path.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {path.name.ar || path.name.en}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {path.description.ar || path.description.en}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center text-muted-foreground">
              {t('common.empty')}
            </div>
          )}
        </div>
      </section>

      {/* All Courses Preview */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('home.all_courses')}
            </h2>
            <Button variant="outline" asChild>
              <Link href="/courses">
                {t('courses.view_all')}
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loadingAll ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="group relative">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <div className="mt-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : ((allCourses as any)?.data?.courses?.length > 0) ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {((allCourses as any)?.data?.courses || []).map((course: Course) => (
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
                          alt={course.title.ar || course.title.en}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2">
                        {course.title.ar || course.title.en}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {course.duration}h
                        </div>
                        <div className="font-bold text-primary">
                          {course.price} {course.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center text-muted-foreground">
              {t('common.empty')}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
