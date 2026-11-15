'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_quiz_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'quiz-header', side: 'bottom',
    ar: { title: 'صفحة الاختبار', description: 'هنا تتحدى نفسك — أجب على كل الأسئلة قبل انتهاء الوقت وسلّم الاختبار.' },
    en: { title: 'Quiz Page', description: 'Challenge yourself here — answer all questions before time runs out and submit the quiz.' } },
  { target: 'quiz-title', side: 'bottom',
    ar: { title: 'اسم الاختبار وعدد الأسئلة', description: 'اسم الاختبار وعدد الأسئلة مكتوبين في الأعلى — اقرأهم قبل ما تبدأ.' },
    en: { title: 'Quiz Name and Question Count', description: 'Quiz name and number of questions are shown at the top — read them before starting.' } },
  { target: 'quiz-timer', side: 'bottom',
    ar: { title: 'المؤقت', description: 'الوقت بيعدّ تنازلياً — لو خلص الوقت الاختبار بيتسلم تلقائياً بالإجابات اللي سجلتها. راقب الوقت!' },
    en: { title: 'Timer', description: 'Time counts down — if it runs out, the quiz submits automatically with your current answers. Watch the clock!' } },
  { target: 'quiz-question-number', side: 'bottom',
    ar: { title: 'رقم السؤال ودرجته', description: 'كل سؤال بيظهر رقمه ودرجته — الأسئلة بأوزان مختلفة، الأصعب بدرجات أعلى.' },
    en: { title: 'Question Number and Points', description: 'Each question shows its number and point value — harder questions are worth more points.' } },
  { target: 'quiz-mcq', side: 'bottom',
    ar: { title: 'أسئلة اختيار من متعدد', description: 'اضغط على الإجابة الصح واحدة فقط — الإجابة المختارة بتتلوّن. ممكن تغيرها قبل التسليم.' },
    en: { title: 'Multiple Choice Questions', description: 'Tap the correct answer — only one — the selected answer highlights. You can change it before submitting.' } },
  { target: 'quiz-essay', side: 'bottom',
    ar: { title: 'أسئلة مقالية', description: 'اكتب إجابتك في الحقل النصي — المحاضر هيراجعها ويعطيك الدرجة يدوياً. كن دقيقاً ومفصّلاً.' },
    en: { title: 'Essay Questions', description: 'Type your answer in the text field — the instructor reviews it and grades manually. Be precise and detailed.' } },
  { target: 'quiz-file-upload', side: 'bottom',
    ar: { title: 'أسئلة رفع ملف', description: 'ارفع ملف PDF أو Word أو صورة — الحجم الأقصى 20 ميجا. المحاضر هيراجع الملف ويصحح يدوياً.' },
    en: { title: 'File Upload Questions', description: 'Upload a PDF, Word file, or image — max 20MB. The instructor reviews the file and grades manually.' } },
  { target: 'quiz-submit', side: 'top',
    ar: { title: 'تسليم الاختبار', description: 'لما تخلص كل الأسئلة اضغط "تسليم الاختبار". مش هتقدر ترجع بعد التسليم — تأكد من إجاباتك أولاً.' },
    en: { title: 'Submit Quiz', description: 'When done with all questions tap "Submit Quiz". You cannot go back after submission — verify your answers first.' } },
]

export function QuizTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function QuizTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
