'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_create_course_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'create-header', selector: "h1, [data-tour=\"create-header\"]", side: 'bottom',
    ar: { title: "إنشاء كورس جديد — 4 خطوات", description: "ستمر بـ 4 خطوات لإنشاء كورسك: (1) اختيار نوع الكورس (2) المعلومات الأساسية (3) المحتوى أو إعدادات البث (4) المراجعة والنشر." },
    en: { title: "Create a New Course — 4 Steps", description: "4 steps to create your course: (1) choose type, (2) core info, (3) content or stream settings, (4) review and publish." } },
  { target: 'create-type-recorded', side: 'bottom',
    ar: { title: "نوع الكورس: كورس مسجّل", description: "الكورس المسجّل هو المحتوى المسجل مسبقاً (فيديوهات). الطلاب يتابعون بالوتيرة التي تناسبهم. مناسب للمحتوى الأكاديمي والمهاري الذي لا يتطلب تفاعلاً لحظياً." },
    en: { title: "Course Type: Recorded", description: "Pre-recorded video content. Students learn at their own pace. Best for academic or skill-based content that does not require real-time interaction." } },
  { target: 'create-type-live', side: 'bottom',
    ar: { title: "نوع الكورس: بث مباشر", description: "بث مباشر في وقت محدد مع الطلاب. ستحدد تاريخ ووقت ومدة البث. يُسجَّل البث تلقائياً ويُتاح للمسجلين بعد انتهائه. مثالي للدورات التفاعلية والأسئلة والأجوبة." },
    en: { title: "Course Type: Live Stream", description: "Real-time session with students at a set date/time. Auto-recorded and available to enrolled students afterward. Best for interactive workshops and Q&A sessions." } },
  { target: 'create-type-venue', side: 'bottom',
    ar: { title: "نوع الكورس: مقر فعلي", description: "جلسة تعليمية حضورية في مكان فعلي. تُحدد الموقع والتاريخ والوقت وأقصى عدد للحضور. يمكن الدفع أونلاين مسبقاً أو عند الحضور في المقر." },
    en: { title: "Course Type: Physical Venue", description: "In-person session at a physical location. Set venue, date, time, and max attendees. Payment can be online in advance or at the venue." } },
  { target: 'create-step-indicator', side: 'bottom',
    ar: { title: "مؤشر الخطوات", description: "يُظهر مكانك في عملية الإنشاء. الأرقام المضيئة = خطوات مكتملة. يمكنك الضغط على خطوة سابقة للعودة إليها وتعديل بياناتها." },
    en: { title: "Step Indicator", description: "Shows your progress through the creation flow. Lit numbers = completed steps. Click a previous step to go back and edit." } },
  { target: 'create-title', side: 'bottom',
    ar: { title: "عنوان الكورس", description: "اكتب عنواناً واضحاً وجذاباً يوضح ما سيتعلمه الطالب. مثال: \"أساسيات الأمن السيبراني للمبتدئين\" أفضل من \"كورس أمن\". العنوان يظهر في صفحة الكورس ونتائج البحث." },
    en: { title: "Course Title", description: "Write a clear, specific title that tells students exactly what they will learn. \"Cybersecurity Fundamentals for Beginners\" beats \"Security Course\". Appears in search results." } },
  { target: 'create-price', side: 'bottom',
    ar: { title: "سعر الكورس", description: "السعر بالجنيه المصري. يُحتسب المكافئ بالدولار تلقائياً عند الحفظ حسب سعر الصرف الحالي. اترك 0 للكورسات المجانية. تأكد من تسعير الكورس بشكل تنافسي حسب المحتوى." },
    en: { title: "Course Price", description: "Price in Egyptian Pounds. The USD equivalent is calculated automatically at save time. Enter 0 for free courses. Price competitively based on content depth." } },
  { target: 'create-category', side: 'bottom',
    ar: { title: "الفئة", description: "اختر الفئة الأنسب لكورسك — تؤثر مباشرة على ظهور الكورس في الصفحة الصحيحة وفي نتائج بحث الطلاب. اختر الأدق وصفاً للمحتوى." },
    en: { title: "Category", description: "Choose the most accurate category — directly affects where your course appears and how students find it." } },
  { target: 'create-cover', side: 'top',
    ar: { title: "صورة الغلاف", description: "صورة الغلاف هي أول ما يراه الطلاب. استخدم صورة عالية الجودة (نسبة 16:9 مثالية) واضحة وذات صلة بالمحتوى. الصورة الجيدة تزيد من نسبة التسجيل بشكل كبير." },
    en: { title: "Cover Image", description: "First thing students see. Use a high-quality image (16:9 ratio ideal) that clearly relates to the content. Good cover images significantly boost enrollment rates." } },
  { target: 'create-submit', side: 'top',
    ar: { title: "النشر والإرسال للمراجعة", description: "في الخطوة الأخيرة يمكنك: (أ) حفظ كمسودة — غير منشور للطلاب، يمكن التعديل لاحقاً. (ب) إرسال للمراجعة — يراجعه فريق DeveWay وعند الموافقة يُنشر للطلاب. بعض الكورسات تُنشر مباشرة." },
    en: { title: "Publish or Submit for Review", description: "Last step: (a) Save as draft — hidden from students, editable later. (b) Submit for review — DeveWay team reviews and publishes on approval. Some courses publish directly." } },
]

export function CreateCourseTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CreateCourseTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
