'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'assessment-result-tour-seen'

const STEPS: TourStepDef[] = [
  { target: 'result-rasheed', side: 'bottom',
    ar: { title: 'تحليل رشيد الشخصي', description: 'رشيد درس إجاباتك وكتب لك تحليلاً شخصياً يشرح نقاط قوتك وكيف يمكنك الاستفادة منها.' },
    en: { title: 'Personal analysis from Rasheed', description: 'Rasheed studied your answers and wrote a personal analysis explaining your strengths and how to make use of them.' } },
  { target: 'result-top-card', side: 'top',
    ar: { title: 'المسار الأنسب لك', description: 'هذا هو المسار الذي يتوافق أكثر مع مهاراتك واهتماماتك. اضغط "ابدأ هذا المسار" لترى التفاصيل.' },
    en: { title: 'Your best-fit path', description: 'This is the path that best matches your skills and interests. Click "Start this path" to see the details.' } },
  { target: 'result-alt-cards', side: 'top',
    ar: { title: 'خيارات بديلة', description: 'رشيد يقترح ٣ مسارات مرتبة حسب التوافق. يمكنك استكشاف أي منها قبل اتخاذ قرارك.' },
    en: { title: 'Alternative options', description: 'Rasheed suggests 3 paths ranked by fit. You can explore any of them before deciding.' } },
  { target: 'result-next', side: 'top',
    ar: { title: 'خطوتك التالية', description: 'بعد اختيار مسارك، تصفّح الكورسات المتاحة وابدأ رحلتك التعليمية مباشرة.' },
    en: { title: 'Your next step', description: 'After choosing your path, browse the available courses and start learning right away.' } },
  { target: 'result-retake', side: 'top',
    ar: { title: 'يمكنك إعادة التقييم', description: 'إذا تغيرت ظروفك أو أردت تجربة إجابات مختلفة، يمكنك إعادة التقييم في أي وقت.' },
    en: { title: 'You can retake the assessment', description: 'If your circumstances change or you want to try different answers, you can retake the assessment at any time.' } },
]

export function AssessmentResultTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function AssessmentResultTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
