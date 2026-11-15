'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_my_courses_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'my-courses-header', side: 'bottom',
    ar: { title: 'كورساتي', description: 'هنا تلاقي كل الكورسات اللي اشتركت فيها — سواء منشورة أو مسودة أو بث مباشر.' },
    en: { title: 'My Courses', description: 'All your enrolled courses — published, drafts, or live streams.' } },
  { target: 'my-courses-filters', side: 'bottom',
    ar: { title: 'الفلاتر', description: 'صفّح كورساتك حسب النوع: الكل، بث مباشر، مسودة، منشور، أو منتهي.' },
    en: { title: 'Filters', description: 'Browse your courses by type: all, live, draft, published, or ended.' } },
  { target: 'my-courses-card', side: 'top',
    ar: { title: 'بطاقة الكورس', description: 'اضغط "متابعة" للدخول للكورس والاستمرار في التعلم.' },
    en: { title: 'Course Card', description: 'Tap "Continue" to enter the course and keep learning.' } },
]

export function MyCoursesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function MyCoursesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
