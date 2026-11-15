'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_learn_home_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'learn-hero', side: 'bottom',
    ar: { title: 'منصة التعلّم', description: 'هنا تلاقي كل الكورسات — مسجلة، بث مباشر، ومقرات فعلية.' },
    en: { title: 'Learning Platform', description: 'Find all courses here — recorded, live streams, and in-person.' } },
  { target: 'learn-continue', side: 'bottom',
    ar: { title: 'كمّل من حيث توقفت', description: 'لو مشترك في كورس، تقدر تكمل مباشرة من هنا بدون بحث.' },
    en: { title: 'Continue Where You Left Off', description: 'If enrolled in a course, continue directly from here without searching.' } },
  { target: 'learn-tracks', side: 'top',
    ar: { title: 'المسارات المهنية', description: 'كل مسار يجمع كورسات من جهات متعددة بالترتيب الصح — اختر مسارك وابدأ.' },
    en: { title: 'Career Tracks', description: 'Each track combines courses from multiple providers in the right order — choose yours.' } },
  { target: 'learn-courses', side: 'top',
    ar: { title: 'اكتشف الكورسات', description: 'تصفح الكورسات المتاحة وصفّها حسب الأحدث أو الأكثر اشتراكاً أو السعر.' },
    en: { title: 'Discover Courses', description: 'Browse available courses and sort by newest, most popular, or price.' } },
]

export function LearnHomeTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function LearnHomeTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
