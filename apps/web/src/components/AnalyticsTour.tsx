'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_analytics_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'analytics-header', selector: "h1, [data-tour=\"analytics-header\"]", side: 'bottom',
    ar: { title: "صفحة الإحصائيات", description: "تحليل شامل لأداء كورساتك وطلابك. ستجد هنا مؤشرات مجمّعة وقائمة تفصيلية بأداء كل كورس." },
    en: { title: "Analytics Page", description: "Comprehensive analysis of your course and student performance. Aggregated KPIs and per-course performance breakdown." } },
  { target: 'analytics-users', side: 'bottom',
    ar: { title: "إجمالي المستخدمين", description: "إجمالي عدد الطلاب المسجلين في جميع كورساتك. يشمل كل الكورسات المدفوعة والمجانية." },
    en: { title: "Total Users", description: "Total students enrolled across all your courses. Includes both paid and free courses." } },
  { target: 'analytics-courses', side: 'bottom',
    ar: { title: "الكورسات المنشورة", description: "عدد الكورسات المتاحة حالياً للطلاب. الكورسات المسودة أو المؤرشفة لا تُحتسب هنا." },
    en: { title: "Published Courses", description: "Number of courses currently available to students. Drafts and archived courses are not counted here." } },
  { target: 'analytics-rating', side: 'bottom',
    ar: { title: "متوسط التقييم", description: "متوسط تقييمات الطلاب لجميع كورساتك. إذا كان \"لا يوجد\"، لا يوجد تقييمات بعد. التقييم العالي يرفع ظهور كورساتك في نتائج البحث." },
    en: { title: "Average Rating", description: "Average student rating across all courses. \"N/A\" means no ratings yet. Higher ratings boost your courses in search results." } },
  { target: 'analytics-revenue', side: 'bottom',
    ar: { title: "إجمالي الإيرادات (في الإحصائيات)", description: "نفس الرقم من صفحة الإيرادات، معروض هنا للمقارنة السريعة مع باقي المؤشرات." },
    en: { title: "Total Revenue (in Analytics)", description: "Same figure as the Revenue page, shown here for quick comparison with other KPIs." } },
  { target: 'analytics-certificates', side: 'bottom',
    ar: { title: "الشهادات المصدرة", description: "عدد الشهادات الإلكترونية التي حصل عليها طلابك. كل شهادة تعني طالباً أكمل 100% من الكورس. هذا المؤشر يقيس جودة المحتوى وقدرته على الإبقاء على الطلاب حتى النهاية." },
    en: { title: "Certificates Issued", description: "Number of digital certificates earned by your students. Each certificate = a student who completed 100% of a course. This KPI measures content quality and student retention." } },
  { target: 'analytics-completion', side: 'bottom',
    ar: { title: "معدل الإكمال", description: "النسبة المئوية للطلاب الذين أكملوا الكورسات مقارنة بالمسجلين. معدل منخفض (أقل من 20%) يعني أن الطلاب يغادرون في المنتصف — راجع هيكل الكورس وجودة المحتوى." },
    en: { title: "Completion Rate", description: "Percentage of students who completed courses vs. enrolled. Low rate (<20%) means students drop off mid-course — review course structure and content quality." } },
  { target: 'analytics-course-list', side: 'top',
    ar: { title: "أداء كل كورس على حدة", description: "قائمة بجميع كورساتك مع: عدد المستخدمين لكل كورس — حالته (منشور/مسودة) — سعره. يمكنك مقارنة أداء الكورسات ومعرفة أيها يحتاج تحسيناً." },
    en: { title: "Per-Course Performance", description: "List of all courses with: student count per course, status (published/draft), and price. Compare course performance to identify which ones need improvement." } },
  { target: 'analytics-low-performing', side: 'top',
    ar: { title: "الكورسات بـ 0 طلاب", description: "الكورسات التي لم يسجل فيها أحد تحتاج مراجعة: هل السعر مناسب؟ هل العنوان والوصف جذابان؟ هل الفئة صحيحة؟ فكّر في مراجعة كل هذه العناصر لزيادة التسجيلات." },
    en: { title: "Zero-Student Courses", description: "Courses with no students need review: Is the price right? Are the title and description compelling? Is the category correct? Consider revising all these elements to boost enrollments." } },
]

export function AnalyticsTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function AnalyticsTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
