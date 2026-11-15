'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_my_courses_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'my-courses-header', side: 'bottom',
    ar: { title: 'كورساتي', description: 'كل الكورسات اللي اشتركت فيها — 14 كورس في مثالنا. كورسات المسار والكورسات الفردية كلها هنا.' },
    en: { title: 'My Courses', description: 'All courses you have enrolled in — 14 in our example. Track courses and individual courses all here.' } },
  { target: 'my-courses-count', side: 'bottom',
    ar: { title: 'عدد الكورسات', description: 'إجمالي الكورسات المشترك فيها — بيتحدث تلقائياً لما تضيف أو تلغي اشتراك.' },
    en: { title: 'Course Count', description: 'Total enrolled courses — updates automatically when you add or cancel an enrollment.' } },
  { target: 'my-courses-filters', side: 'bottom',
    ar: { title: 'فلاتر النوع', description: 'صفّح كورساتك حسب: الكل، بث مباشر، مسودة، منشور، أو انتهى البث — مفيد لو عندك كورسات كتير.' },
    en: { title: 'Type Filters', description: 'Filter your courses by: all, live stream, draft, published, or ended — useful when you have many courses.' } },
  { target: 'my-courses-sort', side: 'bottom',
    ar: { title: 'الترتيب', description: 'رتّب الكورسات حسب الأحدث — قريباً هيضاف ترتيب حسب التقدم والأسم.' },
    en: { title: 'Sort Order', description: 'Sort courses by newest — sorting by progress and name coming soon.' } },
  { target: 'my-courses-card', side: 'top',
    ar: { title: 'بطاقة الكورس', description: 'تعرض اسم الكورس، عدد الطلاب، والسعر. اضغط "متابعة" للدخول فوراً ومتابعة التعلم.' },
    en: { title: 'Course Card', description: 'Shows course name, student count, and price. Tap "Continue" to enter immediately and keep learning.' } },
  { target: 'my-courses-continue-btn', side: 'top',
    ar: { title: 'زرار متابعة', description: 'اضغط هنا لفتح الكورس في منصة التعلم والمتابعة من الدرس الأخير اللي وصلتله.' },
    en: { title: 'Continue Button', description: 'Tap here to open the course on the learning platform and resume from your last lesson.' } },
  { target: 'my-courses-empty', side: 'top',
    ar: { title: 'لو مفيش كورسات', description: 'لو لسه ماشتركتش في أي كورس هيظهرلك رسالة — اضغط "اكتشف الكورسات" للذهاب لصفحة الكورسات.' },
    en: { title: 'If No Courses Yet', description: 'If not yet enrolled in any course, a message appears — tap "Discover Courses" to go to the courses page.' } },
]

export function MyCoursesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function MyCoursesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
