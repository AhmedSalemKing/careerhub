'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_certificates_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'certs-header', side: 'bottom',
    ar: { title: 'شهاداتي', description: 'كل الشهادات اللي حصلت عليها بعد إتمام الكورسات — 5 شهادات في مثالنا.' },
    en: { title: 'My Certificates', description: 'All certificates earned after completing courses — 5 in our example.' } },
  { target: 'certs-count', side: 'bottom',
    ar: { title: 'عدد الشهادات', description: 'إجمالي الشهادات المكتسبة — بيزيد تلقائياً لما تكمل أي كورس.' },
    en: { title: 'Certificate Count', description: 'Total earned certificates — increases automatically when you complete any course.' } },
  { target: 'certs-my-courses-link', side: 'bottom',
    ar: { title: 'رابط كورساتي', description: 'اضغط "كورساتي" للرجوع لقائمة الكورسات ومتابعة كورس ناقص لتحصل على شهادته.' },
    en: { title: 'My Courses Link', description: 'Tap "My Courses" to go back to your courses list and continue an incomplete course to earn its certificate.' } },
  { target: 'certs-card', side: 'top',
    ar: { title: 'بطاقة الشهادة', description: 'تعرض: نوع الشهادة، اسم الكورس، تاريخ الإصدار، ورقم الشهادة الفريد زي DVW-MP8FMXXB-C654BC48.' },
    en: { title: 'Certificate Card', description: 'Shows: certificate type, course name, issue date, and unique number like DVW-MP8FMXXB-C654BC48.' } },
  { target: 'certs-cert-type', side: 'top',
    ar: { title: 'نوع الشهادة', description: 'كل الشهادات الحالية من نوع "شهادة إتمام" — قريباً سيضاف نوع "شهادة كفاءة" للاختبارات.' },
    en: { title: 'Certificate Type', description: 'All current certificates are "Completion Certificates" — "Proficiency Certificate" for assessments coming soon.' } },
  { target: 'certs-actions', side: 'top',
    ar: { title: 'أزرار الشهادة', description: 'زرار "تحميل الشهادة" لحفظها على جهازك كـ PNG جاهز للطباعة أو المشاركة على LinkedIn.' },
    en: { title: 'Certificate Buttons', description: '"Download Certificate" saves it to your device as a PNG ready for printing or sharing on LinkedIn.' } },
  { target: 'certs-view-btn', side: 'top',
    ar: { title: 'زرار عرض', description: 'اضغط "عرض" لفتح الشهادة في نافذة جديدة والتحقق منها قبل التحميل.' },
    en: { title: 'View Button', description: 'Tap "View" to open the certificate in a new window and verify it before downloading.' } },
  { target: 'certs-cert-id', side: 'top',
    ar: { title: 'رقم الشهادة الفريد', description: 'كل شهادة ليها رقم فريد مثل DVW-MP8FMXXB-C654BC48 — ممكن يستخدم للتحقق من صحة الشهادة.' },
    en: { title: 'Certificate ID', description: 'Each certificate has a unique ID like DVW-MP8FMXXB-C654BC48 — can be used to verify the certificate authenticity.' } },
]

export function CertificatesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CertificatesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
