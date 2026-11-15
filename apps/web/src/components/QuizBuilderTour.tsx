'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_quiz_builder_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'quiz-builder-header', selector: "h1, [data-tour=\"quiz-builder-header\"]", side: 'bottom',
    ar: { title: "منشئ الاختبارات", description: "هنا تُنشئ وتُعدّل اختبارات الكورس. كل اختبار يمكن أن يحتوي على أسئلة متعددة من 3 أنواع مختلفة. الاختبارات تُقيّم فهم الطلاب وتُضاف درجاتها لسجل إنجازاتهم." },
    en: { title: "Quiz Builder", description: "Create and edit course quizzes. Each quiz can contain multiple questions of 3 different types. Quizzes assess student understanding and their scores are recorded." } },
  { target: 'quiz-status-badge', side: 'bottom',
    ar: { title: "حالة الاختبار", description: "\"منشور\" = الاختبار متاح للطلاب المسجلين. \"مسودة\" = الاختبار مخفي. لتغيير الحالة، اضغط \"إيقاف النشر\" أو \"نشر\" من الزر في الأعلى." },
    en: { title: "Quiz Status", description: "\"Published\" = quiz is live for enrolled students. \"Draft\" = hidden. Toggle status with the Publish/Unpublish button at the top." } },
  { target: 'quiz-add-question', side: 'bottom',
    ar: { title: "إضافة سؤال جديد", description: "اضغط \"إضافة سؤال\" لإضافة سؤال جديد في نهاية الاختبار. ستختار نوع السؤال أولاً ثم تكتب نصه والبيانات المطلوبة." },
    en: { title: "Add New Question", description: "Click \"Add Question\" to append a new question. First select question type, then write the question and required data." } },
  { target: 'quiz-question-mcq', side: 'bottom',
    ar: { title: "نوع 1: اختيار من متعدد (تصحيح تلقائي)", description: "أسئلة الاختيار من متعدد تُصحَّح تلقائياً فور إرسال الطالب للاختبار. تُحدد الإجابة الصحيحة أنت عند إنشاء السؤال. مناسب لقياس الحفظ والفهم السريع." },
    en: { title: "Type 1: Multiple Choice (Auto-graded)", description: "MCQ questions are automatically graded immediately when the student submits. You define the correct answer when creating. Best for testing recall and comprehension." } },
  { target: 'quiz-question-essay', side: 'bottom',
    ar: { title: "نوع 2: سؤال مقالي (يراجعه المحاضر)", description: "الأسئلة المقالية تتطلب مراجعة يدوية منك كمحاضر. الطالب يكتب إجابته، وأنت تعطيه الدرجة يدوياً من صفحة \"المحاولات\". مناسب للأسئلة التحليلية والتطبيقية." },
    en: { title: "Type 2: Essay (Instructor Review)", description: "Essay questions require your manual review. The student writes their answer; you assign the grade manually from the Attempts page. Best for analytical and application questions." } },
  { target: 'quiz-question-file', side: 'bottom',
    ar: { title: "نوع 3: رفع ملف (يراجعه المحاضر)", description: "الطالب يرفع ملفاً كإجابة (مشروع، تقرير، صورة). أنت تراجعه وتعطيه الدرجة يدوياً. مناسب للمهام العملية والمشاريع التطبيقية." },
    en: { title: "Type 3: File Upload (Instructor Review)", description: "The student uploads a file as their answer (project, report, image). You review and manually grade from the Attempts page. Best for practical assignments and projects." } },
  { target: 'quiz-question-points', side: 'bottom',
    ar: { title: "نقاط السؤال", description: "حدد نقاط كل سؤال. المجموع الكلي يُحسب تلقائياً. تأكد من توزيع النقاط بشكل عادل يعكس صعوبة وأهمية كل سؤال. الأسئلة المقالية وملف الرفع عادة تستحق نقاطاً أعلى لأنها تقييم شامل." },
    en: { title: "Question Points", description: "Set points per question. Total is auto-calculated. Distribute points fairly to reflect each question's difficulty and importance. Essay and file questions typically deserve higher points as comprehensive assessments." } },
  { target: 'quiz-settings-panel', side: 'left',
    ar: { title: "إعدادات الاختبار", description: "جانب الإعدادات يحتوي على: العنوان — الوصف — المدة بالدقائق (0 = بلا حد) — درجة النجاح % — عدد المحاولات المسموح بها." },
    en: { title: "Quiz Settings", description: "Settings panel contains: title, description, duration in minutes (0 = unlimited), passing grade %, and allowed attempt count." } },
  { target: 'quiz-duration', side: 'left',
    ar: { title: "مدة الاختبار", description: "المدة بالدقائق. عند انتهاء الوقت، يُرسَل الاختبار تلقائياً حتى لو لم يضغط الطالب \"إرسال\". اترك 0 لاختبار بلا مهلة زمنية. نصيحة: خصص دقيقتين أو ثلاثة لكل سؤال كمعدل." },
    en: { title: "Quiz Duration", description: "Duration in minutes. When time runs out, the quiz auto-submits even if the student hasn't clicked submit. Enter 0 for no time limit. Tip: allow 2-3 minutes per question as a baseline." } },
  { target: 'quiz-passing-score', side: 'left',
    ar: { title: "درجة النجاح", description: "النسبة المئوية المطلوبة للنجاح. مثلاً 60% يعني الطالب يحتاج 60 من كل 100 نقطة. الطلاب الذين يحصلون على أقل من درجة النجاح يُصنَّفون \"راسب\". يمكنك تحديد عدد محاولات الإعادة." },
    en: { title: "Passing Score", description: "Percentage required to pass. E.g. 60% means 60 out of every 100 points. Students below this threshold are marked Failed. Set retry attempts to allow another try." } },
  { target: 'quiz-attempts', side: 'left',
    ar: { title: "عدد المحاولات", description: "عدد المحاولات المسموح لكل طالب. 1 = محاولة واحدة فقط (للاختبارات الرسمية). 2+ = يُسمح بالإعادة. أفضل محاولة (الأعلى درجة) هي التي تُسجَّل في سجل الطالب النهائي." },
    en: { title: "Attempt Limit", description: "How many tries each student gets. 1 = one shot only (for formal exams). 2+ = retries allowed. The student's best score (highest grade across all attempts) is the one recorded." } },
  { target: 'quiz-shuffle', side: 'left',
    ar: { title: "خيارات خلط الأسئلة", description: "\"خلط الأسئلة\" = كل طالب يرى الأسئلة بترتيب مختلف. \"خلط الخيارات\" = خيارات الاختيار من متعدد تُخلط. يُقلّل الغش بين الطلاب. يُنصح بتفعيلهما في الاختبارات الرسمية." },
    en: { title: "Shuffle Options", description: "\"Shuffle Questions\" = each student sees questions in a different order. \"Shuffle Choices\" = MCQ options are shuffled. Reduces academic dishonesty. Recommended for formal assessments." } },
]

export function QuizBuilderTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function QuizBuilderTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
