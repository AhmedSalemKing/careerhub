'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_instructor_dashboard_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'dashboard-welcome', side: 'bottom',
    ar: { title: "مرحباً في لوحة تحكم المحاضر", description: "هذه لوحة التحكم الرئيسية لك كمحاضر — ستجد هنا ملخصاً فورياً لنشاطك من كورسات وطلاب وإيرادات." },
    en: { title: "Welcome to Your Instructor Dashboard", description: "Your central hub as an instructor. See a live snapshot of your courses, students, and earnings at a glance." } },
  { target: 'dashboard-stats', side: 'bottom',
    ar: { title: "مؤشرات الأداء الرئيسية", description: "أربعة مؤشرات دفعة واحدة: عدد كورساتك، إجمالي طلابك المسجلين، إيراداتك حتى اليوم، ومعدل إتمام الطلاب للمحتوى. معدل الإتمام يساعدك في قياس جودة كورساتك." },
    en: { title: "Key Performance Metrics", description: "Four live KPIs: total courses, enrolled students, revenue to date, and content completion rate. Completion rate helps gauge your content quality." } },
  { target: 'dashboard-create-course', side: 'bottom',
    ar: { title: "إنشاء كورس جديد", description: "اضغط هنا لبدء إنشاء كورس جديد — ستمر بـ 4 خطوات: اختيار النوع (مسجل / بث مباشر / مقر فعلي)، ثم المعلومات الأساسية، ثم المحتوى، ثم المراجعة والنشر." },
    en: { title: "Create a New Course", description: "Start creating a new course here — 4 steps: choose type (recorded / live / in-person), add details, build content, then review and publish." } },
  { target: 'dashboard-recent-courses', side: 'top',
    ar: { title: "آخر الكورسات", description: "تُعرض هنا آخر 4 كورسات قمت بإنشائها. كل بطاقة تُظهر حالة الكورس (منشور/مسودة) وعدد الطلاب والسعر. اضغط على \"إدارة\" للدخول إلى صفحة إدارة الكورس." },
    en: { title: "Recent Courses", description: "Your 4 most recent courses. Each card shows status (published/draft), student count, and price. Click Manage to enter full course management." } },
  { target: 'dashboard-quick-actions', side: 'top',
    ar: { title: "الإجراءات السريعة", description: "وصول سريع لأهم الصفحات: إنشاء كورس — كورساتي — الإيرادات — الإحصائيات — الإعدادات. وفّر الوقت باستخدام هذه الاختصارات بدلاً من التنقل عبر القوائم." },
    en: { title: "Quick Actions", description: "Shortcuts to key pages: create course, my courses, revenue, analytics, settings. Use these to navigate faster." } },
  { target: 'dashboard-nav', selector: "nav, header, [data-tour=\"dashboard-nav\"]", side: 'bottom',
    ar: { title: "شريط التنقل العلوي", description: "من أعلى الصفحة يمكنك الانتقال بين: المسارات المهنية — منصة التعلم للطلاب — صفحة الإرشاد المهني. كذلك تغيير اللغة (عربي/English) وتغيير الدولة (EG/KSA)." },
    en: { title: "Top Navigation Bar", description: "Navigate between Careers, Student Learning Platform, and Coaching pages. Switch language (AR/EN) and country (EG/KSA) from here." } },
  { target: 'dashboard-notifications', side: 'bottom',
    ar: { title: "الإشعارات", description: "الرقم بجانب أيقونة الجرس يُخبرك بعدد الإشعارات غير المقروءة — قد تكون تسجيلات طلاب جدد، أو تعليقات، أو إشعارات من فريق DeveWay." },
    en: { title: "Notifications", description: "The badge shows unread notifications — new student enrollments, comments, or platform messages from the DeveWay team." } },
  { target: 'dashboard-footer', selector: "footer, [data-tour=\"dashboard-footer\"]", side: 'top',
    ar: { title: "روابط التذييل", description: "تجد في الأسفل روابط المسارات المهنية، شراكات المرشدين، سياسة الخصوصية والشروط. مفيدة لمشاركتها مع الطلاب المحتملين." },
    en: { title: "Footer Links", description: "Footer links to careers, mentor partnerships, privacy policy, and terms. Useful for sharing with prospective students." } },
]

export function InstructorDashboardTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function InstructorDashboardTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
