'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_schedule_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'schedule-header', selector: 'h1, [data-tour="schedule-header"]', side: 'bottom',
    ar: { title: 'جدول مواعيدي', description: 'عرض بصري لجميع جلساتك في تقويم أسبوعي أو يومي أو قائمة. تتبّع مواعيدك بسهولة ولمحة واحدة.' },
    en: { title: 'My Schedule', description: 'Visual calendar of all your sessions in weekly, daily, or list view. Track all your appointments at a glance.' } },
  { target: 'schedule-stats', side: 'bottom',
    ar: { title: 'إحصائيات الأسبوع', description: 'ثلاثة أرقام للأسبوع الحالي: جلسات هذا الأسبوع (المؤكدة القادمة) — مواعيد قادمة — ساعات مكتملة. تتحدث تلقائياً مع انتهاء كل جلسة.' },
    en: { title: 'Weekly Stats', description: 'Three numbers for the current week: sessions this week (confirmed upcoming) — upcoming appointments — completed hours. Auto-updates as sessions complete.' } },
  { target: 'schedule-week-nav', side: 'bottom',
    ar: { title: 'التنقل بين الأسابيع', description: 'اضغط الأسهم للتنقل للأسبوع السابق أو القادم. اضغط "اليوم" للعودة للأسبوع الحالي فوراً.' },
    en: { title: 'Week Navigation', description: 'Click arrows to navigate to previous or next week. Click "Today" to instantly return to the current week.' } },
  { target: 'schedule-view-toggle', side: 'bottom',
    ar: { title: 'تبديل طريقة العرض', description: 'ثلاث طرق عرض: أسبوع (الافتراضي — أعمدة أيام الأسبوع) — يوم (يوم واحد مفصّل) — قائمة (عرض نصي للجلسات القادمة). اختر ما يناسبك.' },
    en: { title: 'View Toggle', description: 'Three views: Week (default — 7-day columns) — Day (one day detailed) — List (text view of upcoming sessions). Choose what works for you.' } },
  { target: 'schedule-calendar', side: 'top',
    ar: { title: 'شبكة التقويم', description: 'كل عمود يمثل يوماً والصفوف تمثل الساعات. الجلسات تظهر كمستطيلات ملونة حسب حالتها. اضغط على أي جلسة لرؤية تفاصيلها.' },
    en: { title: 'Calendar Grid', description: 'Each column is a day and rows are hours. Sessions appear as colored blocks by status. Click any session to see its details.' } },
  { target: 'schedule-session-block', side: 'top',
    ar: { title: 'بلوك الجلسة في التقويم', description: 'كل بلوك يُظهر: موضوع الجلسة — اسم العميل — الوقت. اللون يدل على الحالة (انظر مفتاح الألوان). الجلسات المتداخلة تظهر جنباً لجنب.' },
    en: { title: 'Session Block in Calendar', description: 'Each block shows: session topic, client name, time. Color indicates status (see legend). Overlapping sessions appear side by side.' } },
  { target: 'schedule-legend', side: 'bottom',
    ar: { title: 'مفتاح الألوان', description: 'الألوان الستة: أخضر = مؤكدة — أزرق/بنفسجي = جارية الآن — رمادي غامق = مكتملة — أصفر/برتقالي = بانتظار الدفع — برتقالي فاتح = بانتظار الموافقة — رمادي = ملغاة.' },
    en: { title: 'Color Legend', description: 'Six colors: green = confirmed — blue/purple = live now — dark grey = completed — yellow/orange = pending payment — light orange = pending approval — grey = cancelled.' } },
  { target: 'schedule-refresh', side: 'bottom',
    ar: { title: 'زر التحديث', description: 'اضغط لتحديث الجدول وتحميل أي جلسات جديدة أو تغييرات في الحالات. مفيد لو كنت تنتظر موافقة عميل على إعادة جدولة.' },
    en: { title: 'Refresh Button', description: 'Click to refresh the schedule and load any new sessions or status changes. Useful when waiting for a client to confirm a reschedule.' } },
  { target: 'schedule-manage-btn', side: 'bottom',
    ar: { title: 'زر إدارة الجلسات', description: 'ينقلك لصفحة "جلسات عملائي" الكاملة حيث تُدير كل الجلسات وتُوافق على الطلبات وترد على العملاء.' },
    en: { title: 'Manage Sessions Button', description: 'Takes you to the full "Client Sessions" page where you manage all sessions, approve requests, and respond to clients.' } },
  { target: 'schedule-footer', selector: 'footer, [data-tour="schedule-footer"]', side: 'top',
    ar: { title: 'ملاحظة حول مزامنة التقويم', description: 'تُحدَّث الجلسات تلقائياً عند أي تغيير في الحالة. إذا رأيت جلسة قديمة ما زالت "جارية"، استخدم زر التحديث أو تواصل مع الدعم الفني.' },
    en: { title: 'Calendar Sync Note', description: 'Sessions auto-update on any status change. If you see an old session still showing as "Live", use the refresh button or contact support.' } },
]

export function ScheduleTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function ScheduleTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
