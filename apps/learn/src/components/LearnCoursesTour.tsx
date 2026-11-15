'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_learn_courses_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'courses-header', side: 'bottom',
    ar: { title: 'جميع الكورسات', description: 'أكثر من 35 كورساً — مسجلة وبث مباشر ومقرات فعلية.' },
    en: { title: 'All Courses', description: 'Over 35 courses — recorded, live and in-person.' } },
  { target: 'courses-type-tabs', side: 'bottom',
    ar: { title: 'نوع الكورس', description: 'اختر بين الكورسات المسجلة، البث المباشر، أو المقرات الفعلية.' },
    en: { title: 'Course Type', description: 'Choose between recorded courses, live streams, or in-person sessions.' } },
  { target: 'courses-filters', side: 'bottom',
    ar: { title: 'الفلاتر والترتيب', description: 'صفّح حسب المجال، المستوى، السعر، أو الأكثر طلباً.' },
    en: { title: 'Filters & Sort', description: 'Browse by field, level, price, or most popular.' } },
  { target: 'courses-card', side: 'top',
    ar: { title: 'بطاقة الكورس', description: 'تعرض اسم الكورس، المحاضر، عدد الطلاب، والسعر. اضغط "عرض" لمعرفة التفاصيل.' },
    en: { title: 'Course Card', description: 'Shows course name, instructor, student count, and price. Tap "View" for details.' } },
]

export function LearnCoursesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function LearnCoursesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
