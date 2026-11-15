'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_certificates_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'certs-header', side: 'bottom',
    ar: { title: 'شهاداتي', description: 'كل الشهادات التي حصلت عليها بعد إتمام الكورسات.' },
    en: { title: 'My Certificates', description: 'All certificates earned after completing courses.' } },
  { target: 'certs-card', side: 'top',
    ar: { title: 'بطاقة الشهادة', description: 'تعرض اسم الكورس، تاريخ الإصدار، ورقم الشهادة الفريد.' },
    en: { title: 'Certificate Card', description: 'Shows the course name, issue date, and unique certificate number.' } },
  { target: 'certs-actions', side: 'top',
    ar: { title: 'تحميل أو عرض', description: 'اضغط "تحميل الشهادة" لحفظها على جهازك، أو "عرض" لفتحها في المتصفح.' },
    en: { title: 'Download or View', description: 'Tap "Download Certificate" to save it, or "View" to open it in the browser.' } },
]

export function CertificatesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CertificatesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
