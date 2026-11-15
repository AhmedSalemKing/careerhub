'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'career-detail-tour-seen'

const STEPS: TourStepDef[] = [
  { target: 'career-header', side: 'bottom',
    ar: { title: 'تفاصيل المسار', description: 'هنا تجد مدة المسار ومستواه واللغات المتاحة، وما إذا كان متوافقاً مع رؤية 2030.' },
    en: { title: 'Path details', description: 'Here you find the path duration, level, available languages, and whether it is aligned with Vision 2030.' } },
  { target: 'career-jobs', side: 'top',
    ar: { title: 'الوظائف التي ستؤهلك لها', description: 'بعد إتمام هذا المسار، ستكون مؤهلاً للتقدم لهذه الوظائف مع نطاق الراتب المتوقع في السوق.' },
    en: { title: 'Jobs this path qualifies you for', description: 'After completing this path you will be qualified to apply for these jobs, with the expected market salary range.' } },
  { target: 'career-plan', side: 'top',
    ar: { title: 'خطة التعلم', description: 'الكورسات مرتبة بالتسلسل الصحيح. ابدأ بالأول وأكمل بالترتيب للحصول على أفضل نتيجة.' },
    en: { title: 'Learning plan', description: 'Courses are in the right order. Start with the first and continue in sequence for the best result.' } },
  { target: 'career-cta', side: 'bottom',
    ar: { title: 'ابدأ مسارك الآن', description: 'يمكنك البدء مجاناً بالمحتوى الأساسي، أو الاشتراك في الباكدج الكامل للوصول لجميع الكورسات والشهادة.' },
    en: { title: 'Start your path now', description: 'You can start free with the basic content, or subscribe to the full package for all courses and the certificate.' } },
]

export function CareerDetailTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CareerDetailTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
