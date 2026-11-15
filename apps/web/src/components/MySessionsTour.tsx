'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_my_sessions_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'sessions-header', side: 'bottom',
    ar: { title: 'جلساتي الإرشادية', description: 'هنا كل جلساتك مع المرشدين — القادمة، المنتظرة، المكتملة، والملغاة.' },
    en: { title: 'My Sessions', description: 'All your mentor sessions — upcoming, pending, completed, and cancelled.' } },
  { target: 'sessions-tabs', side: 'bottom',
    ar: { title: 'التبويبات', description: 'قلّب بين الجلسات القادمة وانتظار الموافقة والمكتملة والملغاة.' },
    en: { title: 'Session Tabs', description: 'Switch between upcoming, pending approval, completed, and cancelled sessions.' } },
  { target: 'sessions-new-btn', side: 'bottom',
    ar: { title: 'جلسة جديدة', description: 'اضغط هنا لاختيار مرشد وحجز جلسة إرشادية جديدة.' },
    en: { title: 'New Session', description: 'Tap here to pick a mentor and book a new guidance session.' } },
  { target: 'sessions-card', side: 'top',
    ar: { title: 'بطاقة الجلسة', description: 'تعرض المرشد، الموضوع، التاريخ، والمدة. إذا كانت غير مدفوعة يظهر زر الدفع.' },
    en: { title: 'Session Card', description: 'Shows the mentor, topic, date, and duration. If unpaid, a payment button appears.' } },
]

export function MySessionsTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function MySessionsTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
