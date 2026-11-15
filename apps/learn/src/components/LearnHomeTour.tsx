'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_learn_home_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'learn-navbar', selector: 'header.dw-header', side: 'bottom',
    ar: { title: 'شريط التنقل', description: 'من هنا تنتقل بين المسارات المهنية، منصة التعلم، والكوتشينج — ولو مشترك يظهرلك بيلك أيضاً.' },
    en: { title: 'Navigation Bar', description: 'Switch between career paths, learning platform, and coaching — your bell icon shows notifications too.' } },
  { target: 'learn-hero', side: 'bottom',
    ar: { title: 'أهلاً بك في منصة التعلم', description: 'هنا تبدأ رحلتك — كورسات مسجلة، بث مباشر، ومقرات فعلية كلها في مكان واحد.' },
    en: { title: 'Welcome to the Learning Platform', description: 'Your journey starts here — recorded courses, live streams, and in-person sessions all in one place.' } },
  { target: 'learn-continue', side: 'bottom',
    ar: { title: 'كمّل من حيث توقفت', description: 'لو مشترك في كورس بيظهرلك زرار "كمّل من هنا" مباشرة بدون بحث — اضغط عليه لتكمل فوراً.' },
    en: { title: 'Continue Where You Left Off', description: 'If enrolled in a course, a "Continue" button appears directly — tap it to resume instantly.' } },
  { target: 'learn-country-toggle', selector: 'header.dw-header .mkt', side: 'bottom',
    ar: { title: 'اختار دولتك', description: 'بدّل بين السعودية ومصر — الأسعار والعملة بتتغير تلقائياً حسب اختيارك.' },
    en: { title: 'Select Your Country', description: 'Switch between Saudi Arabia and Egypt — prices and currency update automatically.' } },
  { target: 'learn-rashid', side: 'bottom',
    ar: { title: 'رشيد — مرشدك الذكي', description: 'اضغط "ابدأ التقييم المجاني" عشان رشيد يحلل مهاراتك ويرشحلك أنسب مسار مهني.' },
    en: { title: 'Rashid — Your AI Advisor', description: 'Tap "Start Free Assessment" so Rashid can analyze your skills and recommend the best career path.' } },
  { target: 'learn-tracks', side: 'top',
    ar: { title: 'المسارات المهنية', description: 'ستة مسارات مبنية على احتياجات السوق — كل مسار فيه كورسات مرتبة بالترتيب الصح. اضغط "تفاصيل" لمعرفة محتوى أي مسار.' },
    en: { title: 'Career Tracks', description: 'Six market-driven tracks — each with courses in the right order. Tap "Details" to explore any track.' } },
  { target: 'learn-courses-section', side: 'top',
    ar: { title: 'اكتشف الكورسات', description: 'أحدث الكورسات المتاحة — صفّها حسب الأحدث أو الأكثر اشتراكاً أو الأقل سعراً.' },
    en: { title: 'Discover Courses', description: 'Latest available courses — sort by newest, most popular, or lowest price.' } },
  { target: 'learn-course-card', side: 'top',
    ar: { title: 'بطاقة الكورس', description: 'تعرض اسم الكورس، المحاضر، عدد الطلاب، والسعر. اضغط "عرض" لرؤية تفاصيل الكورس والاشتراك.' },
    en: { title: 'Course Card', description: 'Shows course name, instructor, student count, and price. Tap "View" to see details and enroll.' } },
  { target: 'learn-footer', selector: 'footer', side: 'top',
    ar: { title: 'روابط مهمة', description: 'في الفوتر تلاقي سياسة الخصوصية، الشروط والأحكام، وروابط التواصل — ارجعلها وقت الحاجة.' },
    en: { title: 'Important Links', description: 'Footer has privacy policy, terms, and contact links — come back here when needed.' } },
]

export function LearnHomeTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function LearnHomeTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
