'use client'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { get } from '../../lib/api'
import { unwrapList } from '../../lib/unwrap'

type Course = {
  id: string; slug: string; titleAr: string; titleEn: string
  price: number; level: string; thumbnail?: string
}
type CareerPath = { id: string; slug: string; title: string; icon?: string }

export default function LearnHomePage() {
  const locale = useLocale()

  const featuredQ = useQuery({ queryKey: ['featured'], queryFn: async () => unwrapList<Course>(await get('/courses/featured'), 'courses') })
  const pathsQ = useQuery({ queryKey: ['paths'], queryFn: async () => unwrapList<CareerPath>(await get('/career/paths'), 'careerPaths') })
  const allQ = useQuery({ queryKey: ['all-courses'], queryFn: async () => unwrapList<Course>(await get('/courses?status=PUBLISHED&limit=12')) })

  const featured = featuredQ.data || []
  const paths = pathsQ.data || []
  const all = allQ.data || []

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 py-24 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-5xl font-extrabold text-white">
            {locale === 'ar' ? 'تعلم. طور. انجح.' : 'Learn. Grow. Succeed.'}
          </h1>
          <p className="mt-4 text-xl text-blue-100">
            {locale === 'ar' ? 'اكتشف كورسات احترافية تناسب مسارك المهني' : 'Discover professional courses for your career'}
          </p>
          <Link href="/courses" className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-blue-700 hover:bg-blue-50 transition">
            {locale === 'ar' ? 'استكشف الكورسات' : 'Browse Courses'}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground">
            {locale === 'ar' ? 'الكورسات المميزة' : 'Featured Courses'}
          </h2>
          {featuredQ.isLoading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <div key={i} className="animate-pulse bg-muted aspect-video rounded-xl" />)}
            </div>
          ) : featured.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}
                  className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden hover:shadow-lg transition">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900" />
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {locale === 'ar' ? course.titleAr : course.titleEn}
                    </h3>
                    <p className="mt-1 font-bold text-primary">{course.price} {locale === 'ar' ? 'ج.م' : 'EGP'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-[color:var(--muted)]">{locale === 'ar' ? 'لا توجد كورسات مميزة حالياً' : 'No featured courses yet'}</p>
          )}
        </div>
      </section>

      {paths.length > 0 && (
        <section className="py-8 bg-[color:var(--surface)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">{locale === 'ar' ? 'التصنيفات' : 'Categories'}</h2>
            <div className="flex flex-wrap gap-3">
              {paths.map((path) => (
                <Link key={path.id} href={`/courses?careerPath=${path.id}`}
                  className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium hover:bg-primary hover:text-white transition">
                  {path.icon} {path.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">{locale === 'ar' ? 'كل الدورات' : 'All Courses'}</h2>
            <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
              {locale === 'ar' ? 'عرض الكل' : 'View all'}
            </Link>
          </div>
          {allQ.isLoading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => <div key={i} className="animate-pulse bg-muted aspect-video rounded-xl" />)}
            </div>
          ) : all.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {all.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}
                  className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden hover:shadow-lg transition">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900" />
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {locale === 'ar' ? course.titleAr : course.titleEn}
                    </h3>
                    <p className="mt-1 font-bold text-primary">{course.price} {locale === 'ar' ? 'ج.م' : 'EGP'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-[color:var(--muted)]">{locale === 'ar' ? 'لا توجد كورسات حالياً' : 'No courses yet'}</p>
          )}
        </div>
      </section>
    </div>
  )
}
