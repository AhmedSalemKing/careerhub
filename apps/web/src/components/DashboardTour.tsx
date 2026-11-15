'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_dashboard_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'dashboard-welcome', side: 'bottom',
    ar: { title: 'مرحباً في لوحة التحكم', description: 'هنا تتابع كل شيء — مساراتك وكورساتك وجلساتك وشهاداتك في مكان واحد.' },
    en: { title: 'Your Dashboard', description: 'Track everything here — your paths, courses, sessions and certificates in one place.' } },
  { target: 'dashboard-track', side: 'bottom',
    ar: { title: 'مسارك المهني', description: 'يعرض المسار الحالي ونسبة إنجازك — اضغط "تابع" للمتابعة من حيث توقفت.' },
    en: { title: 'Your Career Track', description: 'Shows your current track and progress — tap "Continue" to pick up where you left off.' } },
  { target: 'dashboard-courses', side: 'top',
    ar: { title: 'الكورسات المشتركة', description: 'كل الكورسات اللي اشتركت فيها — اضغط على أي كورس لتبدأ أو تكمل.' },
    en: { title: 'Enrolled Courses', description: 'All courses you have joined — tap any course to start or continue.' } },
  { target: 'dashboard-sessions', side: 'top',
    ar: { title: 'جلسات المرشدين', description: 'جلساتك القادمة والمنتظرة — احجز جلسة جديدة مع أي مرشد.' },
    en: { title: 'Mentor Sessions', description: 'Upcoming and pending sessions — book a new session with any mentor.' } },
  { target: 'dashboard-rashid', side: 'top',
    ar: { title: 'ترشيحات رشيد', description: 'مرشدنا الذكي يحلل مهاراتك ويقترح المسار الأنسب — جربه مجاناً.' },
    en: { title: 'Rashid Recommendations', description: 'Our AI advisor analyzes your skills and suggests the best path — try it free.' } },
  { target: 'dashboard-milestones', side: 'top',
    ar: { title: 'محطاتك', description: 'تتبع رحلتك من إنشاء الحساب حتى الحصول على شهادتك الأولى.' },
    en: { title: 'Your Milestones', description: 'Track your journey from creating your account to earning your first certificate.' } },
]

export function DashboardTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function DashboardTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
