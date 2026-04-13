'use client'

import { useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../lib/constants'
import { useState, useEffect } from 'react'

export type CourseCardCourse = {
  id: string
  title?: string | null
  titleAr?: string | null
  thumbnailUrl?: string | null
  level?: string | null
  duration?: number | null
}

export function CourseCard({ course, locale }: { course: CourseCardCourse; locale: 'ar' | 'en' }) {
  const t = useTranslations('common')
  const title = locale === 'ar' ? course.titleAr || course.title || '' : course.title || course.titleAr || ''
  
  // 🎯 Track image load state
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <a
      href={`${TRAINING_URL}/courses/${course.id}`}
      target="_blank"
      rel="noopener noreferrer"
      
      /* 🎯 Card styles */
      className="group block overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)',
        boxShadow: 'var(--shadow-xs)',
      }}
      aria-label={title || t('view')}
    >
      {/* 🎯 Image Container - Always shows image */}
      <div 
        className="aspect-[16/9] w-full relative overflow-hidden"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        {course.thumbnailUrl && !imageError ? (
          <>
            {/* Skeleton/Placeholder while loading */}
            {!imageLoaded && (
              <div 
                className="absolute inset-0 animate-pulse"
                style={{ backgroundColor: 'var(--surface-3)' }}
              />
            )}
            
            {/* 🎯 THE IMAGE - Forced visible */}
            <img 
              src={course.thumbnailUrl} 
              alt={title} 
              
              /* ✅ CRITICAL: Force image to show */
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              
              style={{
                opacity: imageLoaded ? 1 : 0,
                display: 'block',
                visibility: 'visible',
              }}
              
              /* 🎯 Load handlers */
              loading="lazy"
              decoding="async"
              
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              
              /* Prevent any hover-only showing */
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.visibility = 'visible'
              }}
            />
          </>
        ) : (
          /* Fallback if no image */
          <div 
            className="flex h-full w-full items-center justify-center text-sm"
            style={{ color: 'var(--muted)' }}
          >
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              style={{ opacity: 0.3, marginBottom: '8px' }}
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>{t('loading')}</span>
          </div>
        )}
        
        {/* Hover overlay - subtle only */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent 50%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div 
          className="line-clamp-2 text-sm font-bold"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </div>
        
        <div 
          className="mt-2 flex flex-wrap gap-2 text-xs"
          style={{ color: 'var(--muted)' }}
        >
          {course.level ? (
            <span 
              className="rounded-full px-2 py-1"
              style={{ backgroundColor: 'var(--surface-2)' }}
            >
              {course.level}
            </span>
          ) : null}
          
          {typeof course.duration === 'number' ? (
            <span 
              className="rounded-full px-2 py-1"
              style={{ backgroundColor: 'var(--surface-2)' }}
            >
              {course.duration}m
            </span>
          ) : null}
        </div>
        
        <div 
          className="mt-3 text-xs font-semibold underline-offset-2 group-hover:underline transition-all"
          style={{ color: 'var(--primary)' }}
        >
          {t('view')} ↗
        </div>
      </div>
    </a>
  )
}