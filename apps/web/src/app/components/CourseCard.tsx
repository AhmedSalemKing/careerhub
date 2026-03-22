'use client'

import { useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../lib/constants'

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

  return (
    <a
      // ⚠️ LEGAL: External training link only
      href={`${TRAINING_URL}/courses/${course.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm hover:bg-[color:var(--surface-2)]"
      aria-label={title || t('view')}
    >
      <div className="aspect-[16/9] w-full bg-[color:var(--surface-2)]">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnailUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[color:var(--muted)]">
            {t('loading')}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="line-clamp-2 text-sm font-bold text-foreground">{title}</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
          {course.level ? <span className="rounded-full bg-[color:var(--surface-2)] px-2 py-1">{course.level}</span> : null}
          {typeof course.duration === 'number' ? (
            <span className="rounded-full bg-[color:var(--surface-2)] px-2 py-1">
              {course.duration}m
            </span>
          ) : null}
        </div>
        <div className="mt-3 text-xs font-semibold text-primary group-hover:underline">{t('view')} ↗</div>
      </div>
    </a>
  )
}

