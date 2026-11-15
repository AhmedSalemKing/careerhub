'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_dashboard_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'dashboard-welcome', side: 'bottom',
    ar: { title: 'لوحة التحكم', description: 'مرحباً بك! هنا مركز متابعة رحلتك التعليمية — مساراتك وكورساتك وجلساتك وشهاداتك كلها في مكان واحد.' },
    en: { title: 'Your Dashboard', description: 'Welcome! This is your learning journey hub — your paths, courses, sessions, and certificates all in one place.' } },
  { target: 'dashboard-my-courses-link', side: 'bottom',
    ar: { title: 'رابط كورساتي', description: 'اضغط "كورساتي" للوصول السريع لكل الكورسات اللي اشتركت فيها.' },
    en: { title: 'My Courses Link', description: 'Tap "My Courses" for quick access to all your enrolled courses.' } },
  { target: 'dashboard-track', side: 'bottom',
    ar: { title: 'مسارك المهني', description: 'يعرض المسار الحالي، الكورسات المكتملة من الإجمالي، ونسبة الإنجاز. اضغط "تابع" للمتابعة أو "فتح المسار المهني" لتغييره.' },
    en: { title: 'Your Career Track', description: 'Shows current track, completed vs total courses, and progress percentage. Tap "Continue" to resume or "Open Career Path" to change.' } },
  { target: 'dashboard-track-title', side: 'bottom',
    ar: { title: 'اسم المسار والوظائف', description: 'اسم المسار المهني والوظائف اللي بتأهلك ليها — مثلاً "اختراق الشبكات" يؤهلك لـ مهندس شبكات ومهندس أمن شبكات.' },
    en: { title: 'Track Name & Careers', description: 'The career track name and jobs it qualifies you for — e.g. "Network Penetration" leads to Network Engineer and Security Engineer.' } },
  { target: 'dashboard-courses', side: 'top',
    ar: { title: 'الكورسات المشتركة', description: 'كل الكورسات اللي اشتركت فيها. اضغط على أي كورس للدخول ومتابعة التعلم من حيث توقفت.' },
    en: { title: 'Enrolled Courses', description: 'All courses you have joined. Tap any course to enter and continue learning from where you left off.' } },
  { target: 'dashboard-courses-show-more', side: 'top',
    ar: { title: 'عرض المزيد من الكورسات', description: 'لو عندك أكثر من 3 كورسات بيظهر زرار "عرض المزيد" — اضغطه لتشوف باقي الكورسات.' },
    en: { title: 'Show More Courses', description: 'If you have more than 3 courses, a "Show More" button appears — tap it to see the rest.' } },
  { target: 'dashboard-track-courses', side: 'top',
    ar: { title: 'كورسات المسار', description: 'الكورسات المحددة في مسارك المهني مرتبة بالترتيب الصح — ابدأ بالأول وكمّل بالترتيب لأفضل نتيجة.' },
    en: { title: 'Track Courses', description: 'The courses in your career track in the right order — start from the first and go in order for best results.' } },
  { target: 'dashboard-sessions', side: 'top',
    ar: { title: 'جلسات المرشدين', description: 'ملخص جلساتك: القادمة، اللي بتنتظر موافقة، والمكتملة. اضغط "احجز جلسة جديدة" لحجز مع مرشد.' },
    en: { title: 'Mentor Sessions', description: 'Session summary: upcoming, awaiting approval, and completed. Tap "Book New Session" to book with a mentor.' } },
  { target: 'dashboard-rashid', side: 'top',
    ar: { title: 'ترشيحات رشيد', description: 'رشيد مرشدنا بالذكاء الاصطناعي — اضغط "ابدأ التقييم المجاني" عشان يحلل مهاراتك ويرشحلك أفضل مسار مهني.' },
    en: { title: 'Rashid Recommendations', description: 'Rashid is our AI career advisor — tap "Start Free Assessment" so he can analyze your skills and recommend the best path.' } },
  { target: 'dashboard-milestones', side: 'top',
    ar: { title: 'محطاتك في الرحلة', description: '5 محطات تتابع تقدمك: إنشاء الحساب، اختيار المسار، إكمال أول كورس، حجز جلسة، والحصول على شهادتك.' },
    en: { title: 'Your Journey Milestones', description: '5 milestones track your progress: account creation, path selection, first course, booking a session, and earning your certificate.' } },
  { target: 'dashboard-payments', side: 'top',
    ar: { title: 'سجل المدفوعات', description: 'آخر عملية دفع وإجمالي المدفوعات. اضغط "عرض سجل المدفوعات" لتفاصيل كل العمليات.' },
    en: { title: 'Payment History', description: 'Latest payment and total paid. Tap "View Payment History" for details of all transactions.' } },
  { target: 'dashboard-certificates', side: 'top',
    ar: { title: 'شهاداتي', description: 'عدد الشهادات اللي حصلت عليها. اضغط "عرض شهاداتي" لتحميل أو عرض أي شهادة.' },
    en: { title: 'My Certificates', description: 'Number of certificates you have earned. Tap "View My Certificates" to download or view any certificate.' } },
]

export function DashboardTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function DashboardTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
