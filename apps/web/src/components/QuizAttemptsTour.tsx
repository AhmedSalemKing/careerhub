'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_quiz_attempts_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'attempts-header', selector: "h1, [data-tour=\"attempts-header\"]", side: 'bottom',
    ar: { title: "صفحة محاولات الاختبار", description: "هنا ترى جميع محاولات الطلاب لاختبار معين. يمكنك مراجعة وتصحيح الأسئلة المقالية وملفات الرفع، وتتبع أداء الطلاب." },
    en: { title: "Quiz Attempts Page", description: "View all student attempts for a specific quiz. Review and grade essay questions and uploaded files, and track student performance." } },
  { target: 'attempts-filter', side: 'bottom',
    ar: { title: "تصفية المحاولات", description: "3 تصفيات: الكل — بانتظار التصحيح (محاولات تحتوي أسئلة مقالية أو ملفات لم تُصحَّح بعد) — مصحّحة (تمت مراجعتها كاملاً). ابدأ دائماً بـ \"بانتظار التصحيح\" لتعرف ما ينتظرك." },
    en: { title: "Attempts Filter", description: "3 filters: All — Pending Review (attempts with ungraded essays/files) — Graded (fully reviewed). Always start with \"Pending Review\" to see what needs your attention." } },
  { target: 'attempts-table', side: 'top',
    ar: { title: "جدول المحاولات", description: "كل صف يُمثّل محاولة طالب. الأعمدة: اسم الطالب — تاريخ البدء — الحالة — الدرجة — نتيجة النجاح/الرسوب — زر \"مراجعة\"." },
    en: { title: "Attempts Table", description: "Each row is one student attempt. Columns: student name, start date, status, score, pass/fail result, and Review button." } },
  { target: 'attempts-status-graded', side: 'top',
    ar: { title: "حالة \"مصحّح\"", description: "\"مصحّح\" = الاختبار اكتمل تصحيحه. إذا كان الاختبار يحتوي أسئلة MCQ فقط، تُصحَّح تلقائياً وتظهر كـ \"مصحّح\" فور الإرسال." },
    en: { title: "\"Graded\" Status", description: "\"Graded\" = the attempt is fully graded. If the quiz contains only MCQ questions, they auto-grade and appear as \"Graded\" immediately after submission." } },
  { target: 'attempts-status-pending', side: 'top',
    ar: { title: "حالة \"بانتظار التصحيح\"", description: "\"بانتظار التصحيح\" = الطالب أرسل المحاولة لكن هناك سؤال مقالي أو ملف مرفوع لم يُصحَّح بعد. يبقى في هذه الحالة حتى تراجع وتعطي الدرجة يدوياً." },
    en: { title: "\"Pending Review\" Status", description: "\"Pending Review\" = the student submitted but there is an essay or file question not yet graded. Stays in this state until you manually review and assign the grade." } },
  { target: 'attempts-score', side: 'top',
    ar: { title: "عمود الدرجة", description: "تُعرض الدرجة كـ [الحاصل عليه / إجمالي النقاط]. مثلاً \"90 / 100\". في الاختبارات المختلطة، تُحسب MCQ تلقائياً وتُضاف اليدوية بعد مراجعتك." },
    en: { title: "Score Column", description: "Score shown as [earned / total points]. Example: \"90 / 100\". In mixed quizzes, MCQ scores are auto-calculated; manual grades add after your review." } },
  { target: 'attempts-review-btn', side: 'top',
    ar: { title: "زر \"مراجعة\"", description: "اضغط \"مراجعة\" لفتح تفاصيل المحاولة. ستجد إجابات الطالب على كل سؤال. للأسئلة المقالية وملفات الرفع، ستجد حقلاً لإدخال الدرجة ومربع تعليق اختياري للطالب." },
    en: { title: "\"Review\" Button", description: "Click \"Review\" to open the full attempt details. See the student's answers to each question. For essays and files, you'll find a grade input field and optional feedback comment." } },
  { target: 'attempts-best-score', side: 'top',
    ar: { title: "الدرجة المسجّلة للطالب", description: "إذا سمحت بمحاولات متعددة، أفضل محاولة (الأعلى درجة) هي التي تظهر في سجل الطالب وتؤثر على شهادته. يمكنك مشاهدة كل المحاولات لكن الأفضل هي المُعتمدة." },
    en: { title: "Recorded Student Score", description: "If multiple attempts are allowed, the best attempt (highest score) is what appears in the student record and affects their certificate. You can see all attempts but only the best counts." } },
]

export function QuizAttemptsTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function QuizAttemptsTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
