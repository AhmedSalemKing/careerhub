'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_learn_courses_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'courses-hero', side: 'bottom',
    ar: { title: 'صفحة الكورسات', description: 'أكثر من 35 كورساً — مسجلة، بث مباشر، ومقرات فعلية. كلها هنا.' },
    en: { title: 'Courses Page', description: 'Over 35 courses — recorded, live streams, and in-person. All here.' } },
  { target: 'courses-type-tabs', side: 'bottom',
    ar: { title: 'نوع الكورس', description: 'اختر "كورسات مسجلة" للفيديوهات، "بث مباشر" للجلسات المباشرة مع المحاضر، أو "مقرات فعلية" للحضور الشخصي.' },
    en: { title: 'Course Type', description: 'Choose "Recorded" for videos, "Live Stream" for live sessions with instructors, or "In-Person" for physical attendance.' } },
  { target: 'courses-category-filter', side: 'bottom',
    ar: { title: 'فلتر المجال', description: 'صفّح حسب المجال: البرمجة والتقنية، التصميم، التسويق الرقمي، أو إدارة الأعمال.' },
    en: { title: 'Category Filter', description: 'Filter by field: Programming & Tech, Design, Digital Marketing, or Business Management.' } },
  { target: 'courses-sort', side: 'bottom',
    ar: { title: 'الترتيب', description: 'رتّب الكورسات حسب الأحدث، الأكثر طلباً، الأقل سعراً، أو الأعلى سعراً.' },
    en: { title: 'Sort Order', description: 'Sort courses by newest, most popular, lowest price, or highest price.' } },
  { target: 'courses-level-filter', side: 'bottom',
    ar: { title: 'فلتر المستوى', description: 'اختر مستوى الكورس: الكل، مبتدئ، متوسط، أو متقدم.' },
    en: { title: 'Level Filter', description: 'Choose course level: all, beginner, intermediate, or advanced.' } },
  { target: 'courses-price-filter', side: 'bottom',
    ar: { title: 'فلتر السعر', description: 'اعرض الكل، الكورسات المجانية فقط، أو الكورسات المدفوعة فقط.' },
    en: { title: 'Price Filter', description: 'Show all, free courses only, or paid courses only.' } },
  { target: 'courses-count', side: 'bottom',
    ar: { title: 'عدد الكورسات', description: 'بيتحدث تلقائياً مع كل فلتر تطبقه — يعرفك كام كورس متاح حسب اختيارك.' },
    en: { title: 'Course Count', description: 'Updates automatically with every filter — shows how many courses match your selection.' } },
  { target: 'courses-enrolled-badge', side: 'top',
    ar: { title: 'شارة "مسجل"', description: 'الكورسات اللي اشتركت فيها بيظهر عليها شارة "مسجل" — اضغط "متابعة" لتكمل من حيث توقفت.' },
    en: { title: '"Enrolled" Badge', description: 'Courses you joined show an "Enrolled" badge — tap "Continue" to resume from where you left off.' } },
  { target: 'courses-card', side: 'top',
    ar: { title: 'بطاقة الكورس', description: 'تعرض: اسم الكورس، المحاضر، عدد المشتركين، والسعر. اضغط "عرض" لصفحة تفاصيل الكورس.' },
    en: { title: 'Course Card', description: 'Shows: course name, instructor, enrolled students, and price. Tap "View" for the course detail page.' } },
  { target: 'courses-load-more', side: 'top',
    ar: { title: 'عرض المزيد', description: 'مش شايف الكورس اللي تبحث عنه؟ اضغط "عرض المزيد" لتظهر باقي الكورسات.' },
    en: { title: 'Load More', description: 'Not seeing the course you want? Tap "Show More" to reveal the remaining courses.' } },
]

export function LearnCoursesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function LearnCoursesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
