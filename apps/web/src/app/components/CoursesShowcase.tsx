'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BookOpen, Users, ArrowLeft, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../lib/api'

/* ════════════════════════════════════════
   INTERFACES
   ════════════════════════════════════════ */

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

function getLevelColor(level?: string) {
  if (level === 'BEGINNER') return '#2BBFA3'
  if (level === 'INTERMEDIATE') return '#F5A623'
  if (level === 'ADVANCED') return '#EF4444'
  return '#7B4FE8'
}

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
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // ✅ متغيرات محسنة للسكرول التلقائي
  const animRef = useRef<number>(0)
  const pausedRef = useRef(false)
  const positionRef = useRef(0)
  const lastTimeRef = useRef<number>(0)
  const velocityRef = useRef(0)
  const targetVelocityRef = useRef(0.5)
  
  // حالة للأزرار
  const [showNavButtons, setShowNavButtons] = useState(false)

  const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || '/learn'

  // ── Fetch real courses ──
  useEffect(() => {
    let mounted = true
    
    console.log('[CoursesShowcase] Starting fetch...')
    
    api.get('/courses?status=PUBLISHED&limit=10')
      .then((res) => {
        console.log('[CoursesShowcase] ✅ Response received:')
        console.log('[CoursesShowcase] - Status:', res.status)
        console.log('[CoursesShowcase] - Data:', res.data)
        
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
        
        console.log(`[CoursesShowcase] 📊 Loaded ${arr.length} courses`)
        
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

  // ── Auto-scroll animation ──
  useEffect(() => {
    if (courses.length === 0) return
    const el = scrollRef.current
    if (!el) return

    positionRef.current = 0
    velocityRef.current = 0
    lastTimeRef.current = performance.now()

    const tick = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime
      
      const clampedDelta = Math.min(deltaTime, 100)
      
      if (el && el.scrollWidth > 0) {
        const halfWidth = el.scrollWidth / 2
        
        if (!pausedRef.current) {
          const acceleration = 0.02
          targetVelocityRef.current = 0.5
          
          if (velocityRef.current < targetVelocityRef.current) {
            velocityRef.current += acceleration * clampedDelta
            velocityRef.current = Math.min(velocityRef.current, targetVelocityRef.current)
          }
          
          positionRef.current += velocityRef.current * clampedDelta * 0.06
          
          if (positionRef.current >= halfWidth) {
            positionRef.current = positionRef.current % halfWidth
          }
          
          el.scrollLeft = positionRef.current
        } else {
          const deceleration = 0.08
          velocityRef.current *= (1 - deceleration * clampedDelta * 0.1)
          if (velocityRef.current < 0.01) velocityRef.current = 0
        }
      }
      
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    
    return () => cancelAnimationFrame(animRef.current)
  }, [courses])

  // دالة للسكرول اليدوي بالأزرار
  const scrollToDirection = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    
    const cardWidth = 298
    const scrollAmount = direction === 'right' ? cardWidth : -cardWidth
    
    velocityRef.current = direction === 'right' ? 8 : -8
    positionRef.current = Math.max(0, el.scrollLeft + scrollAmount)
    el.scrollTo({
      left: positionRef.current,
      behavior: 'smooth'
    })
    
    setTimeout(() => setShowNavButtons(false), 3000)
  }

  // Duplicate for infinite loop
  const displayCourses = courses.length > 0 ? [...courses, ...courses] : []

  return (
    <section 
      className="courses-showcase-section" 
      dir={isAr ? 'rtl' : 'ltr'}
      onMouseEnter={() => setShowNavButtons(true)}
      onMouseLeave={() => setShowNavButtons(false)}
    >
      
      {/* ═══ Theme Variables + Font Import ═══ */}
      <style jsx global>{`
        
        /* ========================================
           ✅ PINGARLT FONT IMPORT
           ======================================== */
        
        @font-face {
          font-family: 'PingARLT';
          src: url('/fonts/alfont_com_PingARLT-Black.otf') format('opentype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'PingARLT';
          src: url('/fonts/PingARLT-Black.ttf') format('truetype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        /* ─── DARK MODE (Default) ─── */
        .courses-showcase-section {
          --cs-bg: #0D0D0D;
          --cs-fg: #F8F8FA;
          --cs-muted: rgba(248, 248, 250, 0.5);
          --cs-muted-2: rgba(248, 248, 250, 0.4);
          --cs-muted-3: rgba(248, 248, 250, 0.2);
          --cs-border: rgba(255, 255, 255, 0.08);
          --cs-border-hover: rgba(81, 32, 200, 0.5);
          --cs-card-bg: rgba(255, 255, 255, 0.03);
          --cs-card-border: rgba(255, 255, 255, 0.18);
          --cs-card-border-strong: rgba(255, 255, 255, 0.24);
          --cs-card-hover-bg: rgba(255, 255, 255, 0.06);
          --cs-thumb-bg: rgba(81, 32, 200, 0.15);
          --cs-thumb-icon: rgba(81, 32, 200, 0.4);
          --cs-badge-text: #A78BFA;
          --cs-badge-bg: rgba(81, 32, 200, 0.15);
          --cs-badge-border: rgba(81, 32, 200, 0.25);
          --cs-primary: #5120c8;
          --cs-primary-shadow: rgba(81, 32, 200, 0.18);
          --cs-btn-bg: #5120c8;
          --cs-btn-fg: #ffffff;
          --cs-btn-hover-opacity: 0.85;
          --cs-skeleton-from: rgba(255, 255, 255, 0.04);
          --cs-skeleton-to: rgba(255, 255, 255, 0.08);

          padding: 80px 0;
          overflow: hidden;
          border-top: 1px solid var(--cs-border);
          background: var(--cs-bg);
          color: var(--cs-fg);
          transition: background-color 0.3s ease, color 0.3s ease;
          position: relative;
        }

        /* ─── LIGHT MODE ─── */
        :root:not(.dark) .courses-showcase-section {
          --cs-bg: #F8F8FA;
          --cs-fg: #1B2340;
          --cs-muted: rgba(27, 35, 64, 0.6);
          --cs-muted-2: rgba(27, 35, 64, 0.45);
          --cs-muted-3: rgba(27, 35, 64, 0.25);
          --cs-border: rgba(27, 35, 64, 0.1);
          --cs-border-hover: rgba(81, 32, 200, 0.45);
          --cs-card-bg: #FFFFFF;
          --cs-card-border: rgba(27, 35, 64, 0.2);
          --cs-card-border-strong: rgba(27, 35, 64, 0.28);
          --cs-card-hover-bg: #FFFFFF;
          --cs-thumb-bg: rgba(81, 32, 200, 0.08);
          --cs-thumb-icon: rgba(81, 32, 200, 0.3);
          --cs-badge-text: #7C3AED;
          --cs-badge-bg: rgba(81, 32, 200, 0.08);
          --cs-badge-border: rgba(81, 32, 200, 0.18);
          --cs-primary: #5120c8;
          --cs-primary-shadow: rgba(81, 32, 200, 0.12);
          --cs-btn-bg: #5120c8;
          --cs-btn-fg: #ffffff;
          --cs-btn-hover-opacity: 0.92;
          --cs-skeleton-from: rgba(27, 35, 64, 0.04);
          --cs-skeleton-to: rgba(27, 35, 64, 0.08);
        }

        /* Smooth transitions on theme change */
        .courses-showcase-section,
        .courses-showcase-section *,
        .courses-showcase-section *::before,
        .courses-showcase-section *::after {
          transition: background-color 0.3s ease,
                      border-color 0.3s ease,
                      color 0.3s ease,
                      box-shadow 0.3s ease;
        }

        .courses-showcase-section a,
        .courses-showcase-section a * {
          transition-property: initial;
        }

        /* Fade edges for professional look */
        .cs-scroll-wrapper {
          position: relative;
        }

        .cs-scroll-wrapper::before,
        .cs-scroll-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 28px;
          width: 80px;
          z-index: 10;
          pointer-events: none;
        }

        .cs-scroll-wrapper::before {
          left: 0;
          background: linear-gradient(to right, var(--cs-bg), transparent);
        }

        .cs-scroll-wrapper::after {
          right: 0;
          background: linear-gradient(to left, var(--cs-bg), transparent);
        }

        /* Navigation buttons styling */
        .cs-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--cs-card-bg);
          border: 1.5px solid var(--cs-card-border);
          color: var(--cs-fg);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .cs-nav-btn:hover {
          background: var(--cs-primary);
          border-color: var(--cs-primary);
          color: white;
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 6px 24px var(--cs-primary-shadow);
        }

        .cs-nav-btn.cs-visible {
          opacity: 1;
          visibility: visible;
        }

        .cs-nav-left {
          left: 16px;
        }

        .cs-nav-right {
          right: 16px;
        }
      `}</style>

      {/* ═══ Container ═══ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Header ── */}
        <div className="cs-header">
          <div>
            <span className="cs-badge">
              <span className="cs-badge-dot" />
              {t('badge')}
            </span>
            <h2 className="cs-title">
              {t('title')}
            </h2>
            <p className="cs-subtitle">
              {t('subtitle')}
            </p>
          </div>

          <a
            href={`${LEARN_URL}/${locale}/courses`}
            target="_blank"
            rel="noopener noreferrer"
            className="cs-header-btn"
          >
            {t('all_courses')}
            <ArrowLeft size={16} />
          </a>
        </div>
      </div>

      {/* ═══ Scrolling Rail ═══ */}
      <div className="cs-scroll-wrapper">
        
        {/* Navigation Buttons */}
        {!loading && courses.length > 0 && (
          <>
            <button
              className={`cs-nav-btn cs-nav-left ${showNavButtons ? 'cs-visible' : ''}`}
              onClick={() => scrollToDirection('left')}
              aria-label={t('previous')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={`cs-nav-btn cs-nav-right ${showNavButtons ? 'cs-visible' : ''}`}
              onClick={() => scrollToDirection('right')}
              aria-label={t('next')}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {loading ? (
          <div className="cs-rail cs-rail-loading">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="cs-skeleton"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="cs-empty">
            <BookOpen size={48} />
            <p>{t('no_courses')}</p>
            {error && (
              <p className="mt-2 text-xs opacity-60">Error: {error}</p>
            )}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="cs-rail"
            onMouseEnter={() => { 
              pausedRef.current = true
            }}
            onMouseLeave={() => { 
              pausedRef.current = false
              setTimeout(() => {
                pausedRef.current = false
              }, 300)
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
                  className="cs-card"
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.transform = 'translateY(-6px) scale(1.02)'
                    el.style.borderColor = 'var(--cs-border-hover)'
                    el.style.boxShadow = 
                      '0 20px 50px var(--cs-primary-shadow), ' +
                      '0 0 0 1px var(--cs-border-hover), ' +
                      'inset 0 1px 0 rgba(255,255,255,0.1)'
                    pausedRef.current = true
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.transform = 'translateY(0) scale(1)'
                    el.style.borderColor = 'var(--cs-card-border)'
                    el.style.boxShadow = 
                      '0 2px 8px rgba(0,0,0,0.12), ' +
                      'inset 0 1px 0 rgba(255,255,255,0.04)'
                    pausedRef.current = false
                  }}
                >
                  {/* Thumbnail Area */}
                  <div className="cs-thumb">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={name}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="cs-thumb-placeholder">
                        <BookOpen size={40} />
                      </div>
                    )}

                    {/* Level Badge */}
                    <span
                      className="cs-level-badge"
                      style={{ background: levelColor }}
                    >
                      {t(getLevelKey(course.level))}
                    </span>

                    {/* Play Overlay */}
                    <div className="cs-play-overlay">
                      <div className="cs-play-icon">
                        <Play size={18} color="#fff" fill="#fff" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="cs-body">
                    <h3 className="cs-card-title">{name}</h3>

                    {instructor && (
                      <p className="cs-instructor">{instructor}</p>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* ✅ FOOTER with PingARLT Price */}
                    <div className="cs-footer">
                      {/* ✅ PRICE - PingARLT Font Applied Here */}
                      <span className="cs-price">
                        {course.price > 0 ? `${course.price} ${t('sar')}` : t('free')}
                      </span>

                      <span className="cs-enrollments">
                        <Users size={12} />
                        {course._count?.enrollments ?? 0}
                      </span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══ Bottom CTA ═══ */}
      <div className="cs-bottom-cta">
        <a
          href={`${LEARN_URL}/${locale}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cs-cta-btn"
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.background = 'var(--cs-btn-bg)'
            el.style.color = 'var(--cs-btn-fg)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.background = 'transparent'
            el.style.color = 'var(--cs-primary)'
          }}
        >
          <Play size={18} />
          {t('start_learning')}
        </a>
      </div>

      {/* ═══ Component Styles ═══ */}
      <style jsx>{`
        /* ─── Header ─── */
        .cs-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .cs-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--cs-badge-bg);
          border: 1px solid var(--cs-badge-border);
          border-radius: 100px;
          padding: 6px 14px;
          margin-bottom: 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--cs-badge-text);
          letter-spacing: 0.05em;
          font-family: "DM Sans", sans-serif;
        }

        .cs-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cs-primary);
          animation: cs-pulse 2s ease-in-out infinite;
          display: inline-block;
        }

        .cs-title {
          font-family: "PingARLT", "Cairo", sans-serif;
          font-weight: 700;
          font-size: clamp(24px, 4vw, 36px);
          color: var(--cs-fg);
          margin: 0;
          line-height: 1.2;
        }

        .cs-subtitle {
          color: var(--cs-muted);
          font-size: 15px;
          margin-top: 8px;
          font-family: "DM Sans", sans-serif;
        }

        .cs-header-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--cs-btn-bg);
          color: var(--cs-btn-fg);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          font-family: "DM Sans", sans-serif;
          whiteSpace: nowrap;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .cs-header-btn:hover {
          opacity: var(--cs-btn-hover-opacity);
          transform: translateY(-1px);
        }

        /* ─── Rail / Scroll Container ─── */
        .cs-rail {
          display: flex;
          gap: 18px;
          overflow-x: hidden;
          padding: 8px 60px 28px;
          cursor: grab;
          userSelect: none;
          will-change: scroll-position;
          -webkit-overflow-scrolling: touch;
        }
        .cs-rail-loading {
          padding: 0 60px;
        }

        /* ─── Skeleton Loaders ─── */
        .cs-skeleton {
          min-width: 280px;
          height: 340px;
          border-radius: 16px;
          background: linear-gradient(
            90deg,
            var(--cs-skeleton-from) 0%,
            var(--cs-skeleton-to) 50%,
            var(--cs-skeleton-from) 100%
          );
          background-size: 200% 100%;
          animation: cs-shimmer 1.5s ease-in-out infinite;
          flex-shrink: 0;
          border: 1.5px solid var(--cs-card-border);
        }

        /* ─── Empty State ─── */
        .cs-empty {
          text-align: center;
          padding: 60px 24px;
          color: var(--cs-muted-2);
        }
        .cs-empty p {
          margin-top: 16px;
          font-family: "DM Sans", sans-serif;
          font-size: 15px;
        }

        /* ════════════════════════════════
           CARD — PROFESSIONAL BORDERS
           ════════════════════════════════ */
        
        .cs-card {
          min-width: 280px;
          max-width: 280px;
          border-radius: 16px;
          overflow: hidden;
          background: var(--cs-card-bg);
          
          border: 1.5px solid var(--cs-card-border);
          
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          
          text-decoration: none;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.3s ease,
                      box-shadow 0.3s ease;
          will-change: transform, box-shadow;
        }

        /* ─── Thumbnail ─── */
        .cs-thumb {
          height: 160px;
          background: var(--cs-thumb-bg);
          position: relative;
          overflow: hidden;
          border-bottom: 1.5px solid var(--cs-card-border);
        }

        .cs-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .cs-card:hover .cs-thumb img {
          transform: scale(1.05);
        }

        .cs-thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cs-thumb-icon);
        }

        .cs-level-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          font-family: "DM Sans", sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          z-index: 2;
        }

        .cs-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s ease;
          z-index: 1;
        }

        .cs-play-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(81, 32, 200, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 20px rgba(81, 32, 200, 0.4);
        }

        .cs-card:hover .cs-play-icon {
          opacity: 1 !important;
          transform: scale(1.1);
        }
        .cs-card:hover .cs-play-overlay {
          background: rgba(0, 0, 0, 0.35) !important;
        }

        /* ─── Body ─── */
        .cs-body {
          padding: 18px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .cs-card-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--cs-fg);
          margin: 0 0 6px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }

        .cs-card:hover .cs-card-title {
          color: var(--cs-primary);
        }

        .cs-instructor {
          font-size: 12px;
          color: var(--cs-muted-2);
          margin: 0 0 14px;
          font-family: "DM Sans", sans-serif;
        }

        /* ─── Footer ─── */
        .cs-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 14px;
          border-top: 1.5px solid var(--cs-card-border-strong);
        }

        /* ✅✅✅ PRICE - PINGARLT FONT APPLIED ✅✅✅ */
        .cs-price {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 900 !important;
          font-size: 20px !important;
          color: var(--cs-primary);
          letter-spacing: -0.02em !important;
          line-height: 1 !important;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .cs-enrollments {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--cs-muted-3);
          font-family: "DM Sans", sans-serif;
          padding: 4px 10px;
          border-radius: 20px;
          background: var(--cs-card-bg);
          border: 1px solid var(--cs-card-border);
        }

        /* ─── Bottom CTA ─── */
        .cs-bottom-cta {
          text-align: center;
          margin-top: 48px;
          padding: 0 24px;
        }

        .cs-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          color: var(--cs-primary);
          border: 1.5px solid var(--cs-primary);
          padding: 14px 36px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          font-family: "DM Sans", sans-serif;
          transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
        }
        .cs-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px var(--cs-primary-shadow);
        }

        /* ─── Animations ─── */
        @keyframes cs-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes cs-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .cs-rail:hover .cs-card {
          border-color: var(--cs-card-border-strong);
        }
      `}</style>
    </section>
  )
}