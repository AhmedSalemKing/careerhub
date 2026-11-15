'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_invoices_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'invoices-header', side: 'bottom',
    ar: { title: 'سجل المدفوعات', description: 'كل عمليات الدفع الخاصة بك — الكورسات والجلسات الإرشادية.' },
    en: { title: 'Payment History', description: 'All your payments — courses and mentoring sessions.' } },
  { target: 'invoices-summary', side: 'bottom',
    ar: { title: 'ملخص المدفوعات', description: 'إجمالي ما دفعته، عدد الكورسات، وعدد الجلسات.' },
    en: { title: 'Payment Summary', description: 'Total amount paid, number of courses, and number of sessions.' } },
  { target: 'invoices-filters', side: 'bottom',
    ar: { title: 'الفلاتر', description: 'اعرض الكل، أو فلتر لعمليات الكورسات فقط أو الجلسات فقط.' },
    en: { title: 'Filters', description: 'View all, or filter by courses only or sessions only.' } },
  { target: 'invoices-row', side: 'top',
    ar: { title: 'سجل الدفعة', description: 'يعرض اسم الكورس أو الجلسة، التاريخ، المبلغ، ورقم المرجع.' },
    en: { title: 'Payment Record', description: 'Shows the course or session name, date, amount, and reference number.' } },
]

export function InvoicesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function InvoicesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
