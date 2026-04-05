'use client'
import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { BookOpen, Users, ArrowLeft, Play } from 'lucide-react'

interface Course {
  id: string
  title: string
  titleAr?: string
  description?: string
  price: number
  level?: string
  thumbnail?: string
  instructor?: {
    profile?: { firstName: string; lastName: string }
  }
  _count?: { enrollments: number }
  category?: { nameAr: string; nameEn: string }
}

function getThumb(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return path  // relative URL — works through proxy
}

function getLevelAr(level?: string) {
  if (level === 'BEGINNER') return 'مبتدئ'
  if (level === 'INTERMEDIATE') return 'متوسط'
  if (level === 'ADVANCED') return 'متقدم'
  return 'عام'
}

function getLevelColor(level?: string) {
  if (level === 'BEGINNER') return '#2BBFA3'
  if (level === 'INTERMEDIATE') return '#F5A623'
  if (level === 'ADVANCED') return '#EF4444'
  return '#7B4FE8'
}

export function CoursesShowcase() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const pausedRef = useRef(false)

  const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || '/learn'

  // Fetch real courses
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    const url = `${API}/api/courses`
    console.log('[Courses] Fetching from:', url)

    fetch(url)
      .then(r => {
        console.log('[Courses] Status:', r.status)
        return r.json()
      })
      .then(d => {
        console.log('[Courses] Raw response keys:', Object.keys(d))
        // API returns { success, data: { courses: [...], meta: {...} } }
        const arr = d?.data?.courses ?? d?.data ?? d
        console.log('[Courses] Array?', Array.isArray(arr), 'Length:', arr?.length)
        setCourses(Array.isArray(arr) ? arr : [])
      })
      .catch(e => {
        console.error('[Courses] Fetch error:', e.message)
        setCourses([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (courses.length === 0) return
    const el = scrollRef.current
    if (!el) return

    let pos = 0
    const speed = 0.6

    const tick = () => {
      if (!pausedRef.current && el) {
        pos += speed
        if (pos >= el.scrollWidth / 2) pos = 0
        el.scrollLeft = pos
      }
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [courses])

  // Duplicate courses for infinite loop
  const displayCourses = courses.length > 0
    ? [...courses, ...courses]
    : []

  return (
    <section
      style={{
        background: '#0D0D0D',
        padding: '80px 0',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 40,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(81,32,200,0.15)',
              border: '1px solid rgba(81,32,200,0.25)',
              borderRadius: 100,
              padding: '6px 14px',
              marginBottom: 16,
            }}>
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: '#5120c8',
                animation: 'pulse 2s ease-in-out infinite',
                display: 'inline-block',
              }} />
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: '#A78BFA',
                letterSpacing: '0.05em',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {isAr ? 'كورسات حقيقية' : 'Real Courses'}
              </span>
            </div>
            <h2 style={{
              fontFamily: 'MadinatAlBatt, Cairo, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(24px, 4vw, 36px)',
              color: '#F8F8FA',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {isAr ? 'استكشف الكورسات المتاحة' : 'Explore Available Courses'}
            </h2>
            <p style={{
              color: 'rgba(248,248,250,0.5)',
              fontSize: 15,
              marginTop: 8,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {isAr
                ? 'كورسات احترافية من مدربين خبراء — ابدأ التعلم الآن'
                : 'Professional courses from expert instructors'}
            </p>
          </div>

          <a
            href={`${LEARN_URL}/${locale}/courses`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#5120c8',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'opacity 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
          >
            {isAr ? 'كل الكورسات' : 'All Courses'}
            <ArrowLeft size={16} />
          </a>
        </div>
      </div>

      {/* Scrolling rail — full width */}
      {loading ? (
        <div style={{
          display: 'flex',
          gap: 16,
          padding: '0 24px',
          overflowX: 'hidden',
        }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              minWidth: 280,
              height: 320,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
              flexShrink: 0,
            }} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <BookOpen size={48} color="rgba(248,248,250,0.2)" />
          <p style={{ color: 'rgba(248,248,250,0.4)', marginTop: 16, fontFamily: 'DM Sans, sans-serif' }}>
            {isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onMouseEnter={() => { pausedRef.current = true }}
          onMouseLeave={() => { pausedRef.current = false }}
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'hidden',
            padding: '8px 24px 24px',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {displayCourses.map((course, idx) => {
            const thumb = getThumb(course.thumbnail)
            const name = isAr ? (course.titleAr || course.title) : course.title
            const instructor = course.instructor?.profile
              ? `${course.instructor.profile.firstName} ${course.instructor.profile.lastName}`
              : null
            const levelColor = getLevelColor(course.level)

            return (
              <a
                key={`${course.id}-${idx}`}
                href={`${LEARN_URL}/${locale}/courses/${course.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  minWidth: 280,
                  maxWidth: 280,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(-4px)'
                  el.style.borderColor = 'rgba(81,32,200,0.4)'
                  el.style.boxShadow = '0 12px 40px rgba(81,32,200,0.15)'
                  pausedRef.current = true
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(0)'
                  el.style.borderColor = 'rgba(255,255,255,0.08)'
                  el.style.boxShadow = 'none'
                  pausedRef.current = false
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 160,
                  background: 'rgba(81,32,200,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BookOpen size={40} color="rgba(81,32,200,0.4)" />
                    </div>
                  )}

                  {/* Level badge */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: levelColor,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {getLevelAr(course.level)}
                  </div>

                  {/* Play overlay */}
                  <div
                    className="play-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div
                      className="play-icon"
                      style={{
                        width: 44, height: 44,
                        borderRadius: '50%',
                        background: 'rgba(81,32,200,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <Play size={18} color="#fff" fill="#fff" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#F8F8FA',
                    margin: '0 0 6px',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {name}
                  </h3>

                  {instructor && (
                    <p style={{
                      fontSize: 12,
                      color: 'rgba(248,248,250,0.45)',
                      margin: '0 0 12px',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {instructor}
                    </p>
                  )}

                  <div style={{ flex: 1 }} />

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#5120c8',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}>
                      {course.price > 0 ? `${course.price} ريال` : 'مجاني'}
                    </span>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: 'rgba(248,248,250,0.4)',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      <Users size={12} />
                      <span>{course._count?.enrollments ?? 0}</span>
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{
        textAlign: 'center',
        marginTop: 40,
        padding: '0 24px',
      }}>
        <a
          href={`${LEARN_URL}/${locale}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            color: '#5120c8',
            border: '1.5px solid #5120c8',
            padding: '13px 32px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'background 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = '#5120c8'
            el.style.color = '#fff'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'transparent'
            el.style.color = '#5120c8'
          }}
        >
          <Play size={18} />
          {isAr ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        a:hover .play-icon { opacity: 1 !important; }
        a:hover .play-overlay { background: rgba(0,0,0,0.3) !important; }
      `}</style>
    </section>
  )
}
