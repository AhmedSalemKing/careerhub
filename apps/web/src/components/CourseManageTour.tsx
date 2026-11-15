'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_course_manage_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'manage-header', side: 'bottom',
    ar: { title: "صفحة إدارة الكورس", description: "هذه صفحة الإدارة الكاملة لكورسك. كل شيء يخص هذا الكورس تجده هنا عبر 5 تابات: المحتوى — المحاضرات — الاختبارات — الطلاب — الإعدادات." },
    en: { title: "Course Management Page", description: "Full management page for this course. Everything course-related across 5 tabs: Content, Lectures, Quizzes, Students, Settings." } },
  { target: 'manage-status-badge', side: 'bottom',
    ar: { title: "حالة الكورس", description: "تُظهر الحالة الحالية: منشور (ظاهر للطلاب ومفتوح للتسجيل) — مسودة (مخفي) — مؤرشف (مغلق). غيّر الحالة من تاب الإعدادات." },
    en: { title: "Course Status Badge", description: "Shows current status: Published (visible & open for enrollment) — Draft (hidden) — Archived (closed). Change from Settings tab." } },
  { target: 'manage-tabs', side: 'bottom',
    ar: { title: "التابات الخمسة", description: "خمسة أقسام لإدارة كل جانب من جوانب الكورس. اضغط على أي تاب للانتقال إليه. سنستعرضها واحدة تلو الأخرى." },
    en: { title: "Five Management Tabs", description: "Five sections covering every aspect of your course. Click any tab to navigate. We will walk through each." } },
  { target: 'manage-tab-content', side: 'bottom',
    ar: { title: "تاب المحتوى (الأقسام)", description: "هنا تُنشئ وتُرتب أقسام الكورس (Chapters). كل كورس يحتاج قسماً واحداً على الأقل. الأقسام تُنظّم المحتوى وتساعد الطلاب في التنقل. اضغط \"إضافة قسم\" لإنشاء قسم جديد." },
    en: { title: "Content Tab (Sections)", description: "Create and organize course sections (chapters). Every course needs at least one section. Sections help students navigate content. Click \"Add Section\" to create one." } },
  { target: 'manage-tab-lectures', side: 'bottom',
    ar: { title: "تاب المحاضرات", description: "تُضيف المحاضرات (الدروس الفردية) داخل الأقسام. كل محاضرة يمكن أن تكون: فيديو مرفوع — رابط يوتيوب/فيميو — محتوى نصي. يمكنك تحديد المحاضرات المجانية (مرئية بدون تسجيل)." },
    en: { title: "Lectures Tab", description: "Add individual lessons inside sections. Each lecture can be: uploaded video, YouTube/Vimeo link, or text content. Mark lectures as free (viewable without enrollment)." } },
  { target: 'manage-tab-quizzes', side: 'bottom',
    ar: { title: "تاب الاختبارات", description: "أنشئ اختبارات متعددة لقياس فهم الطلاب. كل اختبار له: مدة زمنية — درجة نجاح — عدد محاولات مسموح بها. 3 أنواع أسئلة متاحة: اختيار من متعدد (تصحيح تلقائي) — مقالي (يصححه المحاضر يدوياً) — رفع ملف (يراجعه المحاضر)." },
    en: { title: "Quizzes Tab", description: "Create multiple quizzes to assess student understanding. Each quiz has: time limit, passing score, attempt limit. 3 question types: MCQ (auto-graded) — Essay (manual review by you) — File Upload (manual review)." } },
  { target: 'manage-tab-students', side: 'bottom',
    ar: { title: "تاب الطلاب", description: "قائمة بجميع الطلاب المسجلين في هذا الكورس. يمكنك رؤية تاريخ التسجيل وتفاصيل كل طالب. مفيد لمتابعة قاعدة طلابك." },
    en: { title: "Students Tab", description: "List of all students enrolled in this course. See enrollment dates and student details. Useful for tracking your student base." } },
  { target: 'manage-tab-settings', side: 'bottom',
    ar: { title: "تاب الإعدادات", description: "تعديل المعلومات الأساسية للكورس: الاسم — الوصف — الحالة (منشور/مسودة/مؤرشف). وأيضاً إعدادات الشهادة: تفعيل إصدار الشهادات بعد إعلان اكتمال الكورس." },
    en: { title: "Settings Tab", description: "Edit core course info: title, description, status (published/draft/archived). Also certificate settings: enable certificate issuance after declaring course completion." } },
  { target: 'manage-section-item', side: 'top',
    ar: { title: "عنصر القسم", description: "كل قسم يُظهر اسمه وعدد المحاضرات بداخله. يمكنك توسيعه لرؤية المحاضرات وإعادة ترتيبها. الترتيب يؤثر على تجربة الطالب في تتابع المحتوى." },
    en: { title: "Section Item", description: "Each section shows its name and lecture count. Expand to see and reorder lectures. Order affects how students progress through the content." } },
  { target: 'manage-add-section', side: 'top',
    ar: { title: "إضافة قسم جديد", description: "اضغط \"إضافة قسم\" لإضافة قسم جديد في نهاية القائمة. نصيحة: نظّم كورسك في أقسام منطقية (مثلاً: مقدمة — الأساسيات — المتقدم — المشروع التطبيقي). التنظيم يرفع معدل الإتمام." },
    en: { title: "Add New Section", description: "Click \"Add Section\" to add a new chapter at the end. Tip: organize in logical sections (Intro — Basics — Advanced — Project). Good structure improves completion rates." } },
  { target: 'manage-certificate-settings', side: 'top',
    ar: { title: "إعدادات الشهادة", description: "بعد الانتهاء من رفع جميع محتوى الكورس، اضغط \"إعلان اكتمال الكورس وتفعيل الشهادات\". بعدها، كل طالب يُكمل 100% من المحتوى سيحصل على شهادة إتمام إلكترونية يمكن مشاركتها." },
    en: { title: "Certificate Settings", description: "After uploading all course content, click \"Declare Course Complete and Enable Certificates\". After that, every student who completes 100% of the content receives a shareable digital certificate." } },
  { target: 'manage-expected-lessons', side: 'top',
    ar: { title: "العدد المتوقع للدروس", description: "حقل اختياري يُظهر للطلاب العدد الكلي للدروس المتوقعة في الكورس — مفيد عندما تكون لا تزال ترفع المحتوى تدريجياً. يُعطي الطلاب توقعاً بحجم الكورس الكامل." },
    en: { title: "Expected Lesson Count", description: "Optional field showing students the total expected lesson count — useful while still uploading content gradually. Gives students an expectation of the full course scope." } },
]

export function CourseManageTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CourseManageTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
