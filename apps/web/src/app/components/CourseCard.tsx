'use client'

import { useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../lib/constants'
import { useState, useRef } from 'react'
import { Clock, Signal, ExternalLink, Play, BookOpen } from 'lucide-react'
import VerifiedBadge from '../../components/VerifiedBadge'

export type CourseCardCourse = {
  id: string
  title?: string | null
  titleAr?: string | null
  thumbnailUrl?: string | null
  level?: string | null
  duration?: number | null
  price?: number | null
  instructor?: string | { id?: string; isVerified?: boolean; profile?: { firstName?: string; lastName?: string; avatar?: string } } | null
  category?: string | null
}

/* ════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════ */

// ✅ FIXED: Accept string | null | undefined
function getLevelInfo(level: string | null | undefined) {
  const levels: Record<string, { labelAr: string; labelEn: string; color: string }> = {
    BEGINNER: { labelAr: 'مبتدئ', labelEn: 'Beginner', color: '#10B981' },
    INTERMEDIATE: { labelAr: 'متوسط', labelEn: 'Intermediate', color: '#F59E0B' },
    ADVANCED: { labelAr: 'متقدم', labelEn: 'Advanced', color: '#EF4444' },
  }
  
  // ✅ FIXED: Handle undefined safely
  const levelKey = level?.toUpperCase() || ''
  return levels[levelKey] || { 
    labelAr: 'عام', 
    labelEn: 'All Levels', 
    color: '#8B5CF6' 
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */

export function CourseCard({ 
  course, 
  locale,
  index = 0 
}: { 
  course: CourseCardCourse; 
  locale: 'ar' | 'en';
  index?: number;
}) {
  const t = useTranslations('common')
  const isAr = locale === 'ar'
  
  const title = isAr ? (course.titleAr || course.title || '') : (course.title || course.titleAr || '')
  
  // ✅ FIXED: Pass course.level directly (now accepts undefined)
  const levelInfo = getLevelInfo(course.level)
  const levelLabel = isAr ? levelInfo.labelAr : levelInfo.labelEn
  
  // 🎯 Track image load state
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const cardRef = useRef<HTMLAnchorElement>(null)

  // 🎯 Staggered animation delay
  const animationDelay = `${index * 0.1}s`

  // ✅ FIXED: Safe price access with nullish coalescing
  const price = course.price ?? 0
  const duration = course.duration ?? 0

  return (
    <a
      ref={cardRef}
      href={`${TRAINING_URL}/courses/${course.id}`}
      target="_blank"
      rel="noopener noreferrer"
      
      className="course-card group block overflow-hidden rounded-2xl transition-all duration-500 ease-out"
      style={{
        animationDelay,
        '--card-border': 'var(--border)',
        '--card-bg': 'var(--surface)',
        '--card-shadow': 'var(--shadow-sm)',
        '--card-shadow-hover': 'rgba(81, 32, 200, 0.15)',
        '--card-primary': '#5120c8',
      } as React.CSSProperties}
      
      aria-label={title || t('view')}
    >
      
      {/* ═══ STYLES ═══ */}
      <style jsx global>{`
        
        /* ========================================
           ✅ PINGARLT FONT - Global Import
           ======================================== */
        
        @font-face {
          font-family: 'PingARLT';
          src: url('/fonts/alfont_com_PingARLT-Black.otf') format('opentype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        /* Fallback for TTF if needed */
        @font-face {
          font-family: 'PingARLT';
          src: url('/fonts/alfont_com_PingARLT-Black.ttf') format('truetype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <style jsx>{`
        
        .course-card {
          position: relative;
          background: var(--surface);
          border: 1.5px solid var(--border);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(0);
          opacity: 0;
          animation: cardFadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--animation-delay, 0s);
        }

        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .course-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(81, 32, 200, 0.4);
          box-shadow: 
            0 20px 40px rgba(81, 32, 200, 0.12),
            0 0 0 1px rgba(81, 32, 200, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        /* ─── Image Container ─── */
        .cc-image-wrapper {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            rgba(81, 32, 200, 0.05) 0%,
            rgba(81, 32, 200, 0.1) 50%,
            rgba(81, 32, 200, 0.05) 100%
          );
        }

        .cc-image-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.4) 0%,
            transparent 50%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
        }

        .course-card:hover .cc-image-wrapper::after {
          opacity: 1;
        }

        .cc-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(128, 128, 128, 0.1) 0%,
            rgba(128, 128, 128, 0.2) 50%,
            rgba(128, 128, 128, 0.1) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .cc-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
        }

        .course-card:hover .cc-image {
          transform: scale(1.08);
        }

        .cc-image.loaded {
          opacity: 1;
        }

        .cc-image.loading {
          opacity: 0;
        }

        /* ─── Fallback Placeholder ─── */
        .cc-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          color: var(--muted);
          background: linear-gradient(
            135deg,
            var(--surface-2) 0%,
            var(--surface-3) 100%
          );
        }

        /* ─── Level Badge ─── */
        .cc-level-badge {
          position: absolute;
          top: 12px;
          ${isAr ? 'left' : 'right'}: 12px;
          z-index: 5;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease;
        }

        .course-card:hover .cc-level-badge {
          transform: scale(1.05);
        }

        /* ─── Play Button Overlay ─── */
        .cc-play-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.8);
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(81, 32, 200, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 24px rgba(81, 32, 200, 0.4);
        }

        .course-card:hover .cc-play-btn {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        /* ─── Content Area ─── */
        .cc-content {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cc-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          line-height: 1.45;
          color: var(--foreground);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.25s ease;
        }

        .course-card:hover .cc-title {
          color: #5120c8;
        }

        /* ─── Meta Info Row ─── */
        .cc-meta-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .cc-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          background: var(--surface-2);
          color: var(--muted);
          border: 1px solid var(--border);
          transition: all 0.25s ease;
        }

        .course-card:hover .cc-meta-item {
          background: rgba(81, 32, 200, 0.08);
          border-color: rgba(81, 32, 200, 0.2);
          color: #5120c8;
        }

        .cc-meta-icon {
          width: 13px;
          height: 13px;
          flex-shrink: 0;
        }

        /* ─── CTA Footer ─── */
        .cc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }

        /* ✅ UPDATED: Price with PingARLT Font */
        .cc-price {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 900 !important;
          font-size: 20px !important;
          color: #5120c8;
          letter-spacing: -0.02em !important;
          line-height: 1 !important;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .cc-price.free {
          color: #10B981;
        }

        .cc-view-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #5120c8;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }

        .course-card:hover .cc-view-link {
          opacity: 1;
          transform: translateX(0);
        }

        .cc-arrow-icon {
          transition: transform 0.3s ease;
        }

        .course-card:hover .cc-arrow-icon {
          transform: translateX(4px);
        }

        /* ─── Glow Effect ─── */
        .cc-glow {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 40px;
          background: radial-gradient(
            ellipse at center,
            rgba(81, 32, 200, 0.15) 0%,
            transparent 70%
          );
          filter: blur(12px);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }

        .course-card:hover .cc-glow {
          opacity: 1;
        }
      `}</style>

      {/* 🎯 Glow Effect */}
      <div className="cc-glow" />

      {/* 🎯 Image Container */}
      <div className="cc-image-wrapper">
        {/* Skeleton while loading */}
        {!imageLoaded && !imageError && course.thumbnailUrl && (
          <div className="cc-skeleton" />
        )}

        {course.thumbnailUrl && !imageError ? (
          <>
            <img 
              src={course.thumbnailUrl} 
              alt={title}
              className={`cc-image ${imageLoaded ? 'loaded' : 'loading'}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          /* Fallback placeholder */
          <div className="cc-fallback">
            <BookOpen size={40} strokeWidth={1.5} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {isAr ? 'كورس' : 'Course'}
            </span>
          </div>
        )}

        {/* Level Badge */}
        {course.level && (
          <span 
            className="cc-level-badge"
            style={{ backgroundColor: levelInfo.color }}
          >
            {levelLabel}
          </span>
        )}

        {/* Play Button Overlay */}
        <div className="cc-play-btn">
          <Play size={22} color="#fff" fill="#fff" />
        </div>
      </div>

      {/* 🎯 Content */}
      <div className="cc-content">
        {/* Title */}
        <h3 className="cc-title">{title}</h3>
        
        {/* Meta Information */}
        <div className="cc-meta-row">
          {/* Duration ✅ FIXED: Use safe duration variable */}
          {duration > 0 && (
            <span className="cc-meta-item">
              <Clock className="cc-meta-icon" />
              {formatDuration(duration)}
            </span>
          )}
          
          {/* Level */}
          {course.level && (
            <span 
              className="cc-meta-item"
              style={{ 
                color: levelInfo.color,
                borderColor: `${levelInfo.color}30`,
                background: `${levelInfo.color}10`
              }}
            >
              <Signal className="cc-meta-icon" />
              {levelLabel}
            </span>
          )}
          
          {/* Category */}
          {course.category && (
            <span className="cc-meta-item">
              {course.category}
            </span>
          )}

          {/* Instructor with Verified Badge */}
          {typeof course.instructor === 'object' && course.instructor?.profile && (
            <span className="cc-meta-item">
              <span>
                {course.instructor.profile.firstName} {course.instructor.profile.lastName}
              </span>
              {course.instructor.isVerified && <VerifiedBadge size="xs" showTooltip={false} />}
            </span>
          )}
        </div>
        
        {/* Footer: Price + CTA ✅ FIXED: Use safe price variable + PingARLT Font */}
        <div className="cc-footer">
          <span className={`cc-price ${price === 0 ? 'free' : ''}`}>
            {price > 0 
              ? `${price} ${isAr ? 'ريال' : 'SAR'}`
              : isAr ? 'مجاني' : 'Free'
            }
          </span>

          <span className="cc-view-link">
            {t('view')}
            <ExternalLink size={14} className="cc-arrow-icon" />
          </span>
        </div>
      </div>
    </a>
  )
}

/* ════════════════════════════════════════
   GRID CONTAINER COMPONENT
   ════════════════════════════════════════ */

interface CourseGridProps {
  courses: CourseCardCourse[]
  locale: 'ar' | 'en'
  columns?: number
}

export function CourseGrid({ 
  courses, 
  locale, 
  columns = 3 
}: CourseGridProps) {
  
  return (
    <div 
      className="course-grid"
      style={{
        '--grid-columns': columns,
      } as React.CSSProperties}
    >
      <style jsx>{`
        .course-grid {
          display: grid;
          grid-template-columns: repeat(var(--grid-columns, 3), 1fr);
          gap: 24px;
          padding: 8px 0;
        }

        @media (max-width: 1024px) {
          .course-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }

        @media (max-width: 640px) {
          .course-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>

      {courses.map((course, index) => (
        <CourseCard
          key={course.id}
          course={course}
          locale={locale}
          index={index}
        />
      ))}
    </div>
  )
}