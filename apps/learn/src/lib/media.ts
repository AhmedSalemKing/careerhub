export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // Relative URL — works on all domains + mobile via proxy
  return path.startsWith('/') ? path : `/${path}`
}

export function getCourseTitle(course: any, locale: string = 'ar'): string {
  if (!course) return ''
  if (typeof course.title === 'string') return course.title
  if (typeof course.title === 'object') {
    return course.title?.[locale] || course.title?.ar || course.title?.en || 'بدون عنوان'
  }
  // Check titleAr / titleEn fields
  if (locale === 'ar') {
    return course.titleAr || course.titleEn || String(course.title || '')
  }
  return course.titleEn || course.titleAr || String(course.title || '')
}
