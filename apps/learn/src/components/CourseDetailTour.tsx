'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_course_detail_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'course-detail-hero', side: 'bottom',
    ar: { title: 'صفحة الكورس', description: 'عنوان الكورس، المجال، المستوى، وعدد المشتركين — نظرة سريعة على ما ستتعلمه.' },
    en: { title: 'Course Page', description: 'Course title, field, level, and enrollment count — a quick overview of what you will learn.' } },
  { target: 'course-detail-instructor', side: 'bottom',
    ar: { title: 'المحاضر', description: 'اضغط على اسم المحاضر لترى ملفه الشخصي وباقي كورساته.' },
    en: { title: 'Instructor', description: 'Tap the instructor name to view their profile and other courses.' } },
  { target: 'course-detail-content', side: 'top',
    ar: { title: 'محتوى الكورس', description: 'قائمة الأقسام والدروس — توسّع أي قسم لترى دروسه قبل الاشتراك.' },
    en: { title: 'Course Content', description: 'List of sections and lessons — expand any section to preview lessons before enrolling.' } },
  { target: 'course-detail-progress', side: 'top',
    ar: { title: 'تقدمك في الكورس', description: 'لو مشترك بيعرضلك نسبة الإنجاز وعدد الدروس المكتملة. اضغط "أكمل" لتابع من حيث توقفت.' },
    en: { title: 'Your Course Progress', description: 'If enrolled, shows your completion percentage and lessons done. Tap "Continue" to resume.' } },
  { target: 'course-detail-features', side: 'top',
    ar: { title: 'مميزات الكورس', description: 'فيديوهات عالية الجودة، موارد قابلة للتحميل، وصول مدى الحياة، وشهادة إتمام معتمدة عند الانتهاء.' },
    en: { title: 'Course Features', description: 'HD videos, downloadable resources, lifetime access, and an accredited completion certificate upon finishing.' } },
  { target: 'course-detail-enroll', side: 'top',
    ar: { title: 'زرار الاشتراك', description: 'اضغط "اشترك الآن" للحصول على وصول فوري لكل محتوى الكورس. ضمان استرداد 30 يوم.' },
    en: { title: 'Enroll Button', description: 'Tap "Enroll Now" for immediate access to all course content. 30-day money-back guarantee.' } },
]

export function CourseDetailTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CourseDetailTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
