'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_course_player_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'player-back', side: 'bottom',
    ar: { title: 'العودة للكورس', description: 'اضغط "العودة للكورس" للرجوع لصفحة تفاصيل الكورس في أي وقت.' },
    en: { title: 'Back to Course', description: 'Tap "Back to Course" to return to the course detail page at any time.' } },
  { target: 'player-progress-bar', side: 'bottom',
    ar: { title: 'شريط التقدم', description: 'يعرض نسبة إنجازك في الكورس — بيتحدث تلقائياً مع كل درس تكمله.' },
    en: { title: 'Progress Bar', description: 'Shows your course completion percentage — updates automatically as you complete lessons.' } },
  { target: 'player-video', side: 'bottom',
    ar: { title: 'مشغل الفيديو', description: 'شاهد الدرس هنا. تقدر تغير سرعة التشغيل من 0.75x لـ 2x. الملفات والصور متاحة في تبويبات منفصلة.' },
    en: { title: 'Video Player', description: 'Watch your lesson here. Change playback speed from 0.75x to 2x. Files and images are in separate tabs.' } },
  { target: 'player-tabs', side: 'bottom',
    ar: { title: 'تبويبات المحتوى', description: 'انتقل بين الفيديو، ملف PDF، والصورة حسب نوع محتوى الدرس الحالي.' },
    en: { title: 'Content Tabs', description: 'Switch between Video, PDF file, and Image depending on the current lesson type.' } },
  { target: 'player-lesson-actions', side: 'top',
    ar: { title: 'أدوات الدرس', description: '"مفيد" لو استفدت من الدرس، "اسأل سؤال" لطرح سؤال على المحاضر، "مشاركة" لمشاركة رابط الدرس.' },
    en: { title: 'Lesson Tools', description: '"Helpful" if the lesson helped you, "Ask a Question" to ask the instructor, "Share" to share the lesson link.' } },
  { target: 'player-nav-buttons', side: 'top',
    ar: { title: 'التنقل بين الدروس', description: 'اضغط "التالي" للانتقال للدرس التالي أو "السابق" للرجوع. الكورس بيعرفك على أي درس أنت.' },
    en: { title: 'Lesson Navigation', description: 'Tap "Next" to go to the next lesson or "Previous" to go back. The course tracks which lesson you are on.' } },
  { target: 'player-sidebar-content', side: 'right',
    ar: { title: 'قائمة الدروس', description: 'كل دروس الكورس هنا — الدروس المكتملة عليها علامة صح. اضغط على أي درس للانتقال إليه مباشرة.' },
    en: { title: 'Lesson List', description: 'All course lessons are here — completed ones have a checkmark. Tap any lesson to jump to it directly.' } },
  { target: 'player-quiz-btn', side: 'top',
    ar: { title: 'اختبار الدرس', description: 'بعض الدروس عليها زرار "اختبار" — اضغطه لفتح اختبار الدرس واختبر فهمك لما شاهدته.' },
    en: { title: 'Lesson Quiz', description: 'Some lessons have a "Quiz" button — tap it to open the lesson quiz and test your understanding.' } },
  { target: 'player-quiz-info', side: 'top',
    ar: { title: 'أنواع أسئلة الاختبار', description: 'الاختبارات فيها 3 أنواع أسئلة: اختيار من متعدد (بيتصحح تلقائي)، مقالي (بيراجعه المحاضر)، ورفع ملف (PDF أو Word — بيراجعه المحاضر).' },
    en: { title: 'Quiz Question Types', description: 'Quizzes have 3 question types: Multiple choice (auto-graded), Essay (instructor reviews), and File upload (PDF or Word — instructor reviews).' } },
  { target: 'player-quiz-attempts', side: 'top',
    ar: { title: 'محاولات الاختبار', description: 'كل اختبار ليه عدد محدد من المحاولات — راجع العدد قبل ما تبدأ. أفضل درجة هي اللي بتتسجل في سجل درجاتك.' },
    en: { title: 'Quiz Attempts', description: 'Each quiz has a limited number of attempts — check the count before starting. Your best score is what gets recorded in your grades.' } },
  { target: 'player-grades-link', side: 'top',
    ar: { title: 'سجل الدرجات', description: 'درجاتك في كل اختبارات هذا الكورس موجودة في صفحة الدرجات — اضغط "الدرجات" في لوحة التحكم للوصول إليها.' },
    en: { title: 'Grades Record', description: 'Your scores for all quizzes in this course are in the grades page — tap "Grades" in the dashboard to access it.' } },
]

export function CoursePlayerTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CoursePlayerTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
