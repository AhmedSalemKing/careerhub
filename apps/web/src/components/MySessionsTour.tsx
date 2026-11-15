'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_my_sessions_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'sessions-header', side: 'bottom',
    ar: { title: 'جلساتي الإرشادية', description: 'كل جلساتك مع المرشدين — إجمالي 23 جلسة في مثالنا بكل حالاتها.' },
    en: { title: 'My Mentoring Sessions', description: 'All your sessions with mentors — 23 total in our example across all statuses.' } },
  { target: 'sessions-total-count', side: 'bottom',
    ar: { title: 'إجمالي الجلسات', description: 'العدد الكلي لكل جلساتك — قادمة، بانتظار موافقة، مكتملة، وملغاة.' },
    en: { title: 'Total Sessions', description: 'Total count of all your sessions — upcoming, pending approval, completed, and cancelled.' } },
  { target: 'sessions-refresh-btn', side: 'bottom',
    ar: { title: 'زرار تحديث', description: 'اضغط "تحديث" لو حجزت جلسة جديدة وعايز تشوفها فوراً بدون ما تعمل refresh للصفحة.' },
    en: { title: 'Refresh Button', description: 'Tap "Refresh" if you just booked a new session and want to see it immediately without page reload.' } },
  { target: 'sessions-new-btn', side: 'bottom',
    ar: { title: 'جلسة جديدة', description: 'اضغط هنا للذهاب لصفحة المرشدين واختيار مرشد وحجز جلسة إرشادية جديدة.' },
    en: { title: 'New Session', description: 'Tap here to go to the mentors page, choose a mentor, and book a new guidance session.' } },
  { target: 'sessions-tabs', side: 'bottom',
    ar: { title: 'تبويبات الحالة', description: 'قلّب بين: القادمة (0)، انتظار الموافقة (3)، المكتملة (7)، الملغاة (1) — الأرقام بتتحدث تلقائياً.' },
    en: { title: 'Status Tabs', description: 'Switch between: Upcoming (0), Pending Approval (3), Completed (7), Cancelled (1) — numbers update automatically.' } },
  { target: 'sessions-card', side: 'top',
    ar: { title: 'بطاقة الجلسة', description: 'تعرض: اسم المرشد، مجاله، موضوع الجلسة، الحالة، التاريخ والوقت، المنصة (Daily.co)، والمدة.' },
    en: { title: 'Session Card', description: 'Shows: mentor name, field, session topic, status, date and time, platform (Daily.co), and duration.' } },
  { target: 'sessions-status-badge', side: 'top',
    ar: { title: 'شارة الحالة', description: '"بانتظار موافقة المرشد" = المرشد لسه ماوافقش. "بانتظار الدفع" = لازم تدفع. "مكتملة" = الجلسة اتمت. "ملغاة" = اتألغت.' },
    en: { title: 'Status Badge', description: '"Awaiting Mentor Approval" = mentor not yet approved. "Awaiting Payment" = payment needed. "Completed" = done. "Cancelled" = cancelled.' } },
  { target: 'sessions-payment-btn', side: 'top',
    ar: { title: 'زرار الدفع', description: 'لو ظهر زرار "ادفع" معناه الجلسة بانتظار الدفع — اضغطه وادفع عشان تتأكد حجزك.' },
    en: { title: 'Pay Button', description: 'If a "Pay" button appears, the session awaits payment — tap it and pay to confirm your booking.' } },
  { target: 'sessions-cancel-btn', side: 'top',
    ar: { title: 'زرار الإلغاء', description: 'تقدر تلغي جلسة بانتظار الموافقة قبل ما المرشد يوافق — الغيها لو غيرت رأيك.' },
    en: { title: 'Cancel Button', description: 'You can cancel a pending session before the mentor approves — cancel if you change your mind.' } },
  { target: 'sessions-empty', side: 'top',
    ar: { title: 'لو مفيش جلسات قادمة', description: 'لو مفيش جلسات في التبويب ده بيظهرلك "احجز جلستك الأولى" — اضغط "احجز جلسة" للبدء.' },
    en: { title: 'If No Upcoming Sessions', description: 'If the tab is empty, "Book Your First Session" appears — tap "Book Session" to get started.' } },
]

export function MySessionsTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function MySessionsTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
