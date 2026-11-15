'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_grades_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'grades-header', side: 'bottom',
    ar: { title: 'درجاتي', description: 'نتائجك في كل اختبارات الكورسات — ملخص شامل لأدائك في كل كورس.' },
    en: { title: 'My Grades', description: 'Your results across all course quizzes — a comprehensive overview of your performance in every course.' } },
  { target: 'grades-summary-total', side: 'bottom',
    ar: { title: 'إجمالي الاختبارات', description: 'عدد كل الاختبارات اللي خضت فيها عبر كل الكورسات.' },
    en: { title: 'Total Quizzes', description: 'Total number of quizzes you have taken across all courses.' } },
  { target: 'grades-summary-pass', side: 'bottom',
    ar: { title: 'الناجح', description: 'عدد الاختبارات اللي نجحت فيها — النجاح بيعتمد على درجة النجاح المحددة لكل اختبار (عادة 60%).' },
    en: { title: 'Passed', description: 'Number of quizzes you passed — passing depends on the minimum score set for each quiz (usually 60%).' } },
  { target: 'grades-summary-fail', side: 'bottom',
    ar: { title: 'الراسب', description: 'عدد الاختبارات اللي لم تنجح فيها — راجع تفاصيلها وأعد المحاولة لو عندك محاولات متبقية.' },
    en: { title: 'Failed', description: 'Number of quizzes you did not pass — review their details and retry if you have remaining attempts.' } },
  { target: 'grades-summary-review', side: 'bottom',
    ar: { title: 'قيد المراجعة', description: 'اختبارات فيها أسئلة مقالية أو ملفات لسه المحاضر ماراجعهاش — درجتها ستتحدث تلقائياً بعد المراجعة.' },
    en: { title: 'Under Review', description: 'Quizzes with essay or file questions not yet reviewed by instructor — scores update automatically after review.' } },
  { target: 'grades-summary-avg', side: 'bottom',
    ar: { title: 'متوسط الدرجات', description: 'متوسط كل درجاتك في كل الاختبارات — مؤشر جيد على مستواك العام في المنصة.' },
    en: { title: 'Average Score', description: 'Average of all your quiz scores — a good indicator of your overall performance on the platform.' } },
  { target: 'grades-course-filter', side: 'bottom',
    ar: { title: 'فلتر الكورسات', description: 'فلتر لعرض درجات كورس بعينه — مفيد لو مشترك في أكثر من كورس وعايز تراجع كورس محدد.' },
    en: { title: 'Course Filter', description: 'Filter to show grades for a specific course — useful when enrolled in multiple courses and reviewing one.' } },
  { target: 'grades-quiz-row', side: 'top',
    ar: { title: 'صف الاختبار', description: 'يعرض: اسم الاختبار، اسم الدرس، درجة النجاح، عدد المحاولات المستخدمة والمتبقية، وحالة الاختبار.' },
    en: { title: 'Quiz Row', description: 'Shows: quiz name, lesson name, passing score, attempts used and remaining, and quiz status.' } },
  { target: 'grades-quiz-score', side: 'top',
    ar: { title: 'أفضل درجة', description: 'الدرجة المعروضة هي أفضل محاولة ليك — مش المتوسط. لو حاولت 3 مرات وأعلى درجة 90% هي اللي تتسجل.' },
    en: { title: 'Best Score', description: 'The shown score is your best attempt — not the average. If you tried 3 times and got 90% once, that is what counts.' } },
  { target: 'grades-quiz-actions', side: 'top',
    ar: { title: 'أزرار الاختبار', description: '"ابدأ الاختبار" لأول محاولة، "أكمل الاختبار" لو بدأت ولم تكمل، "عرض النتيجة" للاختبارات المصححة، "إعادة المحاولة" لو ناجح وعايز تحسن.' },
    en: { title: 'Quiz Actions', description: '"Start Quiz" for first attempt, "Continue Quiz" if started but not finished, "View Result" for graded quizzes, "Retry" to improve your score.' } },
  { target: 'grades-status-badge', side: 'top',
    ar: { title: 'شارة الحالة', description: '"مصحّح" = النتيجة نهائية. "قيد التنفيذ" = بدأت ولم تكمل. "قيد المراجعة" = ينتظر المحاضر. لا شارة = لم تبدأ بعد.' },
    en: { title: 'Status Badge', description: '"Graded" = result is final. "In Progress" = started but not finished. "Under Review" = awaiting instructor. No badge = not started yet.' } },
]

export function GradesTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function GradesTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
