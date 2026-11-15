'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_invoices_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'invoices-header', side: 'bottom',
    ar: { title: 'سجل المدفوعات', description: 'سجل شامل لكل عمليات الدفع — الكورسات والجلسات الإرشادية كلها هنا بالتسلسل الزمني.' },
    en: { title: 'Payment History', description: 'Comprehensive record of all payments — courses and mentoring sessions all here in chronological order.' } },
  { target: 'invoices-total', side: 'bottom',
    ar: { title: 'إجمالي المدفوعات', description: 'كل اللي دفعته على DeveWay لحد الآن — الكورسات والجلسات مع بعض.' },
    en: { title: 'Total Paid', description: 'Everything you have paid on DeveWay so far — courses and sessions combined.' } },
  { target: 'invoices-courses-count', side: 'bottom',
    ar: { title: 'عدد الكورسات المدفوعة', description: 'كام كورس دفعت عليه — مش بيشمل الكورسات المجانية.' },
    en: { title: 'Paid Courses Count', description: 'How many courses you have paid for — does not include free courses.' } },
  { target: 'invoices-sessions-count', side: 'bottom',
    ar: { title: 'عدد الجلسات المدفوعة', description: 'كام جلسة إرشادية دفعت عليها لحد الآن.' },
    en: { title: 'Paid Sessions Count', description: 'How many mentoring sessions you have paid for so far.' } },
  { target: 'invoices-filters', side: 'bottom',
    ar: { title: 'فلاتر النوع', description: 'فلتر لتعرض الكل، كورسات بس، أو جلسات بس — مفيد لو عايز تراجع دفعات نوع معين.' },
    en: { title: 'Type Filters', description: 'Filter to show all, courses only, or sessions only — useful when reviewing payments of a specific type.' } },
  { target: 'invoices-row', side: 'top',
    ar: { title: 'سجل الدفعة', description: 'يعرض: نوع الدفعة (كورس/جلسة)، اسم الكورس أو "جلسة استشارية"، التاريخ والوقت، المبلغ، ورقم المرجع الفريد.' },
    en: { title: 'Payment Record', description: 'Shows: payment type (course/session), course name or "Advisory Session", date and time, amount, and unique reference number.' } },
  { target: 'invoices-reference', side: 'top',
    ar: { title: 'رقم المرجع', description: 'رقم مرجعي فريد لكل دفعة زي IEH0NRXI — احتفظ بيه لو احتجت تراجع أي دفعة مع الدعم.' },
    en: { title: 'Reference Number', description: 'Unique reference for each payment like IEH0NRXI — keep it if you ever need to review a payment with support.' } },
  { target: 'invoices-session-mentor', side: 'top',
    ar: { title: 'اسم المرشد في الجلسات', description: 'جلسات المرشدين بيظهر فيها "المرشد: Cursor" أو اسم المرشد — سهّل عليك تعرف كل دفعة لمين.' },
    en: { title: 'Session Mentor Name', description: 'Mentoring sessions show "Mentor: Cursor" or the mentor name — helps you identify each payment easily.' } },
  { target: 'invoices-pagination', side: 'top',
    ar: { title: 'التنقل بين الصفحات', description: 'لو عندك أكثر من 20 دفعة بتتوزع على صفحات — استخدم "التالي" و"السابق" للتنقل.' },
    en: { title: 'Pagination', description: 'If you have more than 20 payments they are split across pages — use "Next" and "Previous" to navigate.' } },
]

export function InvoicesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function InvoicesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
