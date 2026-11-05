'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BookOpen, Users, ArrowLeft, ArrowRight, Play } from 'lucide-react'
import api from '../../lib/api'
import { learnUrlWithToken } from '../../lib/learn-link'
import { formatCoursePrice } from '../../lib/market'

/* ════════════════════════════════════════
   INTERFACES
   ════════════════════════════════════════ */

interface Course {
  id: string
  title: string
  titleAr?: string
  description?: string
  price: number
  priceDisplay?: string | null
  currency?: string | null
  level?: string
  thumbnail?: string
  instructor?: {
    id?: string
    profile?: { firstName: string; lastName: string }
  }
  _count?: { enrollments: number }
  category?: { nameAr: string; nameEn: string }
}

/* ════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════ */

function getThumb(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return path
}

function getLevelKey(level?: string) {
  if (level === 'BEGINNER') return 'beginner'
  if (level === 'INTERMEDIATE') return 'intermediate'
  if (level === 'ADVANCED') return 'advanced'
  return 'general'
}

/** How many courses the home page grid shows (the API call still fetches up to 10). */
const GRID_LIMIT = 6

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */

export function CoursesShowcase() {
  const locale = useLocale()
  const t = useTranslations('coursesShowcase')
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // learnUrl() from constants appends the auth token for cross-domain nav

  // ── Fetch real courses ──
  // Country is injected automatically by the Axios interceptor via the market cookie.
  useEffect(() => {
    let mounted = true

    api.get('/courses?status=PUBLISHED&limit=10')
      .then((res) => {
        if (!mounted) return

        let arr: Course[] = []

        if (res.data?.data?.courses && Array.isArray(res.data.data.courses)) {
          arr = res.data.data.courses
        }
        else if (res.data?.courses && Array.isArray(res.data.courses)) {
          arr = res.data.courses
        }
        else if (Array.isArray(res.data)) {
          arr = res.data
        }
        else if (res.data?.data && Array.isArray(res.data.data)) {
          arr = res.data.data
        }

        setCourses(arr)
        setError(null)
      })
      .catch((err) => {
        console.error('[CoursesShowcase] ❌ Error:', err.message)

        if (mounted) {
          setError(err.message)
          setCourses([])
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  const gridCourses = courses.slice(0, GRID_LIMIT)
  const Arrow = isAr ? ArrowLeft : ArrowRight

  return (
    <section
      className="dw-section dw-section-alt"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="dw-wrap">

        {/* ── Header ── */}
        <div className="dw-head-row">
          <div className="dw-head">
            <span className="dw-eyebrow">{t('badge')}</span>
            <h2>{t('title')}</h2>
            <p>{t('subtitle')}</p>
          </div>
        </div>

        {/* ── Tab ── */}
        <div className="dw-tabs">
          <a
            href={learnUrlWithToken(`/${locale}/courses`)}
            target="_blank"
            rel="noopener noreferrer"
            className="dw-tab dw-tab-active"
          >
            {t('all_courses')}
          </a>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="dw-courses">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="dw-skel"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="dw-empty">
            <BookOpen size={48} aria-hidden="true" />
            <p>{t('no_courses')}</p>
            {error && (
              <p className="mt-2 text-xs opacity-60">Error: {error}</p>
            )}
          </div>
        ) : (
          <div className="dw-courses">
            {gridCourses.map((course) => {
              const thumb = getThumb(course.thumbnail)
              const name = isAr ? (course.titleAr || course.title) : course.title
              const instructor = course.instructor?.profile
                ? `${course.instructor.profile.firstName} ${course.instructor.profile.lastName}`
                : null

              return (
                <article key={course.id} className="card">
                  {/* Thumbnail */}
                  <div className="dw-thumb">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={name}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <BookOpen size={40} aria-hidden="true" />
                    )}

                    <span className="dw-level" data-level={course.level ?? 'GENERAL'}>
                      {t(getLevelKey(course.level))}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="dw-card-body">
                    <h3>
                      <a
                        href={learnUrlWithToken(`/${locale}/courses/${course.id}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dw-card-link"
                      >
                        {name}
                      </a>
                    </h3>

                    {instructor && course.instructor?.id && (
                      <a
                        href={`/${locale}/profile/${course.instructor.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dw-instructor"
                      >
                        {instructor}
                      </a>
                    )}
                    {instructor && !course.instructor?.id && (
                      <span className="dw-instructor">{instructor}</span>
                    )}

                    <div className="dw-spacer" />

                    <div className="dw-card-foot">
                      <span className="dw-price">
                        {formatCoursePrice(course)}
                      </span>

                      <span className="dw-enroll">
                        <Users size={12} aria-hidden="true" />
                        {course._count?.enrollments ?? 0}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className="dw-center-cta">
          <a
            href={learnUrlWithToken(`/${locale}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <Play size={18} aria-hidden="true" />
            {t('start_learning')}
            <Arrow size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
