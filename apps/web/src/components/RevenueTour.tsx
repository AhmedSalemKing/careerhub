'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_revenue_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'revenue-header', selector: "h1, [data-tour=\"revenue-header\"]", side: 'bottom',
    ar: { title: "صفحة الإيرادات", description: "تتبّع جميع إيراداتك من كورسات DeveWay في مكان واحد. تُحدَّث الأرقام تلقائياً مع كل عملية شراء." },
    en: { title: "Revenue Page", description: "Track all your earnings from DeveWay courses in one place. Numbers update automatically with each purchase." } },
  { target: 'revenue-total', side: 'bottom',
    ar: { title: "إجمالي الإيرادات", description: "مجموع كل ما حصّلته من مبيعات الكورسات. هذا الرقم يمثل إيراداتك الإجمالية منذ انضمامك للمنصة." },
    en: { title: "Total Revenue", description: "Sum of all earnings from course sales since joining the platform." } },
  { target: 'revenue-stats-row', side: 'bottom',
    ar: { title: "الإحصائيات الإجمالية", description: "إجمالي الطلاب — الكورسات المنشورة — إجمالي الكورسات. تعطيك صورة شاملة عن حجم نشاطك على المنصة." },
    en: { title: "Summary Statistics", description: "Total students, published courses, total courses. Gives a full picture of your activity volume on the platform." } },
  { target: 'revenue-breakdown-title', side: 'top',
    ar: { title: "جدول تفصيل الإيرادات", description: "جدول يُفصّل الإيرادات لكل كورس على حدة. 4 أعمدة: اسم الكورس — عدد الطلاب — السعر لكل طالب — إجمالي الإيرادات من هذا الكورس." },
    en: { title: "Revenue Breakdown Table", description: "4-column table breaking down revenue per course: course name, student count, per-student price, total earnings from that course." } },
  { target: 'revenue-table', side: 'top',
    ar: { title: "صفوف الكورسات", description: "كل صف يمثل كورساً. الصفوف بـ \"0 ج.م\" هي كورسات مجانية أو لم يسجل فيها طلاب بعد. الصفوف بأرقام هي الكورسات التي حققت إيرادات." },
    en: { title: "Course Rows", description: "Each row is a course. Rows showing \"0 ج.م\" are free courses or courses with no paid enrollments yet. Highlighted rows with numbers are your earning courses." } },
  { target: 'revenue-total-row', side: 'top',
    ar: { title: "صف الإجمالي", description: "آخر صف في الجدول يُجمّع كل الإيرادات. يساعدك في التحقق من أن الإجمالي أعلاه صحيح." },
    en: { title: "Total Row", description: "The last row totals all revenue. Use it to verify the summary number at the top." } },
  { target: 'revenue-top-earner', side: 'top',
    ar: { title: "الكورس الأعلى إيراداً", description: "الكورس بأعلى إيرادات في الجدول هو ركيزتك الرئيسية. استثمر فيه بتحديث المحتوى وإضافة محاضرات جديدة للحفاظ على تسجيلات عالية." },
    en: { title: "Top Earning Course", description: "The highest-earning course is your main revenue driver. Invest in it by updating content and adding new lectures to maintain high enrollment." } },
  { target: 'revenue-footer', selector: "footer, [data-tour=\"revenue-footer\"]", side: 'top',
    ar: { title: "ملاحظة حول مواعيد الدفع", description: "الإيرادات المعروضة هي المبالغ المدفوعة من الطلاب. تواصل مع فريق DeveWay للاستفسار عن مواعيد تحويل الأرباح لحسابك." },
    en: { title: "Payment Notes", description: "Displayed revenue is what students paid. Contact DeveWay team for information about payout schedules to your account." } },
]

export function RevenueTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function RevenueTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
