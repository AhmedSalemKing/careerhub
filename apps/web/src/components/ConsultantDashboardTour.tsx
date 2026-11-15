'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_consultant_dashboard_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'consultant-welcome', side: 'bottom',
    ar: { title: 'مرحباً في لوحة تحكم المرشد', description: 'هذه لوحة تحكمك كمرشد مهني على DeveWay. ستجد هنا ملخصاً فورياً لجلساتك وطلبات العملاء وإيراداتك.' },
    en: { title: 'Welcome to Your Mentor Dashboard', description: 'Your central hub as a professional mentor on DeveWay. See a live snapshot of your sessions, client requests, and earnings.' } },
  { target: 'consultant-stats', side: 'bottom',
    ar: { title: 'مؤشرات الأداء', description: 'أربعة مؤشرات رئيسية: طلبات جديدة (تحتاج موافقتك) — جلسات مؤكدة (قادمة) — جلسات مكتملة (التاريخية) — إجمالي الإيرادات من جميع الجلسات.' },
    en: { title: 'Performance Metrics', description: 'Four key metrics: new requests (awaiting your approval) — confirmed sessions (upcoming) — completed sessions (historical) — total revenue from all sessions.' } },
  { target: 'consultant-upcoming', side: 'top',
    ar: { title: 'الجلسات القادمة', description: 'قائمة بجلساتك المؤكدة القادمة مع العملاء. كل بطاقة تُظهر اسم العميل، الموضوع، التاريخ والوقت. اضغط "عرض الكل" للذهاب لقائمة الجلسات الكاملة.' },
    en: { title: 'Upcoming Sessions', description: 'Your confirmed upcoming sessions with clients. Each card shows client name, topic, date and time. Click "View All" for the full sessions list.' } },
  { target: 'consultant-quick-links', side: 'left',
    ar: { title: 'الروابط السريعة', description: 'وصول سريع لأهم الصفحات: إدارة الجلسات — الجدول الزمني — طلبات العملاء — الإيرادات — الإعدادات.' },
    en: { title: 'Quick Links', description: 'Quick access to key pages: Session Management, Schedule, Client Requests, Revenue, Settings.' } },
  { target: 'consultant-nav', selector: 'nav, header, [data-tour="consultant-nav"]', side: 'bottom',
    ar: { title: 'شريط التنقل', description: 'من الأعلى يمكنك التنقل بين صفحات المنصة المختلفة وتغيير اللغة والدولة. الأيقونة بجانب اسمك تُظهر الإشعارات.' },
    en: { title: 'Navigation Bar', description: 'Navigate between platform pages and switch language and country. The icon next to your name shows notifications.' } },
]

export function ConsultantDashboardTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function ConsultantDashboardTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
