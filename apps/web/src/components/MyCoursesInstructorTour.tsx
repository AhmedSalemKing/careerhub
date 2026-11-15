'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_my_courses_instructor_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'my-courses-header', selector: "h1, [data-tour=\"my-courses-header\"]", side: 'bottom',
    ar: { title: "صفحة كورساتي", description: "هذه الصفحة هي مركز إدارة جميع كورساتك. تجد هنا قائمة بكل الكورسات التي أنشأتها مع أدوات التصفية والإحصائيات." },
    en: { title: "My Courses", description: "Your course management hub. All courses you have created, with filters and stats." } },
  { target: 'my-courses-stats', side: 'bottom',
    ar: { title: "الإحصائيات الإجمالية", description: "ثلاثة أرقام مجمّعة عبر جميع كورساتك: إجمالي الطلاب المسجلين، الكورسات المنشورة (المتاحة للطلاب)، وإجمالي إيراداتك. تُحدَّث تلقائياً مع كل تسجيل جديد." },
    en: { title: "Aggregate Statistics", description: "Three totals across all courses: enrolled students, published courses (live to students), and total revenue. Auto-updates with each new enrollment." } },
  { target: 'my-courses-create', side: 'bottom',
    ar: { title: "إنشاء كورس جديد", description: "زر إنشاء كورس في أعلى الصفحة — سيأخذك لـ wizard الإنشاء من 4 خطوات. يمكنك إنشاء كورسات مسجلة أو بث مباشر أو جلسات في مقر فعلي." },
    en: { title: "Create New Course", description: "Opens the 4-step course creation wizard. Choose between recorded, live stream, or physical venue courses." } },
  { target: 'my-courses-filters', side: 'bottom',
    ar: { title: "تصفية الكورسات", description: "تصفية حسب نوع الكورس: الكل — البث المباشر — المسودة (غير منشور) — المنشور (متاح للطلاب) — انتهى البث. مفيدة جداً لو عندك كورسات كتيرة وتريد التركيز على نوع معين." },
    en: { title: "Course Filters", description: "Filter by: All — Live — Draft (unpublished) — Published (live to students) — Ended. Essential when you have many courses." } },
  { target: 'my-courses-sort', side: 'bottom',
    ar: { title: "الترتيب", description: "ترتيب الكورسات حسب: الأحدث أولاً (الافتراضي) أو حسب معايير أخرى. يساعدك على إيجاد الكورسات الجديدة أو الأقدم بسرعة." },
    en: { title: "Sort Order", description: "Sort courses by newest (default) or other criteria. Helps locate recent or older courses quickly." } },
  { target: 'my-courses-card', side: 'top',
    ar: { title: "بطاقة الكورس", description: "كل بطاقة تُظهر: اسم الكورس — عدد الطلاب المسجلين — السعر — حالة الكورس (منشور/مسودة/انتهى البث). الحالة بالألوان: أخضر = منشور، رمادي = مسودة، برتقالي = انتهى." },
    en: { title: "Course Card", description: "Each card shows: course name, enrolled students, price, and status. Colors: green = published, grey = draft, orange = ended." } },
  { target: 'my-courses-manage-btn', side: 'top',
    ar: { title: "زر \"إدارة\"", description: "اضغط \"إدارة\" للدخول إلى صفحة إدارة الكورس الكاملة — ستجد فيها 5 تابات: المحتوى (الأقسام) — المحاضرات — الاختبارات — الطلاب — الإعدادات." },
    en: { title: "\"Manage\" Button", description: "Opens the full course management page with 5 tabs: Content (sections), Lectures, Quizzes, Students, Settings." } },
  { target: 'my-courses-status-published', side: 'top',
    ar: { title: "حالة \"منشور\"", description: "الكورسات المنشورة ظاهرة للطلاب ويمكنهم التسجيل فيها. لتغيير الحالة، ادخل إعدادات الكورس وغيّر الحالة من منشور إلى مسودة أو مؤرشف." },
    en: { title: "\"Published\" Status", description: "Published courses are visible to students and open for enrollment. Change status from course Settings tab." } },
  { target: 'my-courses-status-ended', side: 'top',
    ar: { title: "حالة \"انتهى البث\"", description: "تُشير إلى كورسات البث المباشر التي انتهت. التسجيل (recording) يُتاح للطلاب للمشاهدة اللاحقة بعد معالجته. لا يمكن بدء بث جديد على نفس الكورس." },
    en: { title: "\"Stream Ended\" Status", description: "Indicates live courses whose stream has ended. The recording becomes available to enrolled students after processing." } },
  { target: 'my-courses-status-rejected', side: 'top',
    ar: { title: "حالة \"REJECTED\"", description: "بعض الكورسات تحتاج مراجعة من فريق DeveWay قبل النشر. إذا رُفض الكورس، ستحتاج إلى تعديل المحتوى وإعادة الإرسال للمراجعة من تاب الإعدادات." },
    en: { title: "\"Rejected\" Status", description: "Some courses require DeveWay review before publishing. If rejected, edit the content and resubmit from the Settings tab." } },
  { target: 'my-courses-live-badge', side: 'top',
    ar: { title: "شارة \"Live\"", description: "كورسات البث المباشر الجارية حالياً تُظهر شارة \"Live\" حمراء. يمكنك إدارة البث من خلال زر \"إدارة اللايف\" في تاب إدارة الكورس." },
    en: { title: "\"Live\" Badge", description: "Currently broadcasting courses show a red \"Live\" badge. Manage the stream from the Live Management section in course manage." } },
]

export function MyCoursesInstructorTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function MyCoursesInstructorTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
