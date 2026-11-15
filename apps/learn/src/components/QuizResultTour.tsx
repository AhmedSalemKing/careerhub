'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_quiz_result_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'result-header', side: 'bottom',
    ar: { title: 'نتيجة الاختبار', description: 'هنا نتيجتك التفصيلية — درجتك، حالتك (ناجح/راسب)، وتفاصيل كل سؤال.' },
    en: { title: 'Quiz Result', description: 'Your detailed result here — your score, status (pass/fail), and details of every question.' } },
  { target: 'result-score', side: 'bottom',
    ar: { title: 'درجتك', description: 'نسبة درجتك من 100 — الأخضر معناه ناجح، الأحمر معناه راسب. درجة النجاح مكتوبة على الاختبار.' },
    en: { title: 'Your Score', description: 'Your score percentage out of 100 — green means pass, red means fail. The passing score is listed on the quiz.' } },
  { target: 'result-status', side: 'bottom',
    ar: { title: 'حالة الاختبار', description: '"مصحّح" = درجتك نهائية. "قيد المراجعة" = فيه أسئلة مقالية أو ملفات المحاضر لسه ماراجعهاش — الدرجة ستتحدث بعد المراجعة.' },
    en: { title: 'Quiz Status', description: '"Graded" = your score is final. "Under Review" = essay or file questions pending instructor review — score updates after review.' } },
  { target: 'result-attempts', side: 'bottom',
    ar: { title: 'المحاولات', description: 'عدد المرات اللي حاولت فيها والمتبقية — كل اختبار ليه حد أقصى من المحاولات، راجعه قبل ما تعيد الاختبار.' },
    en: { title: 'Attempts', description: 'Number of attempts used and remaining — each quiz has a maximum attempt limit, check it before retaking.' } },
  { target: 'result-answers', side: 'top',
    ar: { title: 'تفاصيل الإجابات', description: 'كل سؤال بيعرضلك: إجابتك، الإجابة الصحيحة، والدرجة اللي حصلت عليها — استخدمها للمذاكرة والتعلم من الأخطاء.' },
    en: { title: 'Answer Details', description: 'Each question shows: your answer, correct answer, and points earned — use this to study and learn from mistakes.' } },
  { target: 'result-retake', side: 'top',
    ar: { title: 'إعادة الاختبار', description: 'لو عندك محاولات متبقية وعايز تحسن درجتك اضغط "إعادة المحاولة". أفضل درجة هي اللي بتتسجل في سجلك.' },
    en: { title: 'Retake Quiz', description: 'If you have remaining attempts and want to improve your score tap "Retry". Your best score is what gets recorded.' } },
  { target: 'result-back', side: 'top',
    ar: { title: 'العودة للكورس', description: 'اضغط "العودة" للرجوع للكورس ومتابعة باقي الدروس أو الانتقال للاختبار التالي.' },
    en: { title: 'Back to Course', description: 'Tap "Back" to return to the course and continue remaining lessons or move to the next quiz.' } },
]

export function QuizResultTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function QuizResultTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
