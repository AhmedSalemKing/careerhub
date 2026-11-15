'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_client_sessions_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'client-sessions-header', selector: 'h1, [data-tour="client-sessions-header"]', side: 'bottom',
    ar: { title: 'جلسات عملائي', description: 'هنا تدير جميع طلبات الجلسات وجلساتك مع العملاء. مقسمة لـ 5 تابات حسب الحالة: بانتظار الموافقة — انتظار الدفع — القادمة — المكتملة — الملغاة.' },
    en: { title: 'My Client Sessions', description: 'Manage all session requests and sessions with clients. 5 tabs by status: Pending Approval — Pending Payment — Upcoming — Completed — Cancelled.' } },
  { target: 'client-sessions-summary', side: 'bottom',
    ar: { title: 'ملخص الحالات', description: 'شريط ملون يُظهر توزيع جلساتك حسب الحالة. الأرقام تتحدث فورياً. الأحمر = يحتاج إجراء منك، الأخضر = تم، الرمادي = ملغاة.' },
    en: { title: 'Status Summary', description: 'Colored bar showing session distribution by status. Numbers update in real-time. Red = needs your action, green = done, grey = cancelled.' } },
  { target: 'client-sessions-tabs', side: 'bottom',
    ar: { title: 'تابات الحالات', description: 'اضغط على أي تاب للتصفية حسب الحالة. ابدأ دائماً بـ "بانتظار موافقتي" لترى الطلبات الجديدة التي تحتاج ردك.' },
    en: { title: 'Status Tabs', description: 'Click any tab to filter by status. Always start with "Pending My Approval" to see new requests that need your response.' } },
  { target: 'client-sessions-pending-card', side: 'top',
    ar: { title: 'بطاقة طلب جديد (بانتظار الموافقة)', description: 'طلبات الجلسات الجديدة من العملاء. كل بطاقة تُظهر: اسم العميل — التاريخ والوقت المطلوب — مدة الجلسة — موضوع الجلسة. لديك 3 خيارات: موافقة أو إعادة جدولة أو رفض.' },
    en: { title: 'New Request Card (Pending Approval)', description: 'New session requests from clients. Each card shows: client name, requested date/time, duration, topic. You have 3 options: Approve, Reschedule, or Reject.' } },
  { target: 'client-sessions-approve-btn', side: 'top',
    ar: { title: 'زر الموافقة', description: 'اضغط "موافقة" لقبول طلب الجلسة. سيُرسَل إشعار للعميل وتنتقل الجلسة لحالة "انتظار الدفع". بعد دفع العميل تصبح "مؤكدة" وتظهر في جدولك الزمني.' },
    en: { title: 'Approve Button', description: 'Click "Approve" to accept the session request. The client gets a notification and the session moves to "Pending Payment". After client pays, it becomes "Confirmed" and appears in your schedule.' } },
  { target: 'client-sessions-reschedule-btn', side: 'top',
    ar: { title: 'زر إعادة الجدولة', description: 'إذا كان الوقت المطلوب لا يناسبك، اضغط "إعادة الجدولة" لاقتراح وقت بديل. يُرسَل اقتراحك للعميل الذي يملك حق القبول أو الرفض.' },
    en: { title: 'Reschedule Button', description: 'If the requested time does not work for you, click "Reschedule" to suggest an alternative time. Your suggestion is sent to the client who can accept or decline.' } },
  { target: 'client-sessions-reject-btn', side: 'top',
    ar: { title: 'زر الرفض', description: 'اضغط "رفض" لرفض الطلب. يُنصح باستخدام إعادة الجدولة بدلاً من الرفض متى أمكن — الرفض المتكرر يؤثر على تقييمك وظهورك في نتائج البحث.' },
    en: { title: 'Reject Button', description: 'Click "Reject" to decline the request. We recommend using Reschedule instead of Reject when possible — frequent rejections affect your rating and search visibility.' } },
  { target: 'client-sessions-pending-payment', side: 'bottom',
    ar: { title: 'تاب انتظار الدفع', description: 'جلسات وافقت عليها لكن العميل لم يدفع بعد. لا يلزمك فعل شيء — العميل هو من يحتاج إتمام الدفع. بعد الدفع تنتقل تلقائياً للقادمة.' },
    en: { title: 'Pending Payment Tab', description: 'Sessions you approved but the client has not paid yet. No action needed from you — the client needs to complete payment. After payment, they auto-move to Upcoming.' } },
  { target: 'client-sessions-upcoming', side: 'bottom',
    ar: { title: 'تاب القادمة', description: 'جلساتك المؤكدة والمدفوعة القادمة. ستجد زر "انضم للجلسة" عند اقتراب موعد كل جلسة. الجلسات تظهر أيضاً في الجدول الزمني.' },
    en: { title: 'Upcoming Tab', description: 'Your confirmed and paid upcoming sessions. The "Join Session" button appears as the session time approaches. Sessions also appear in your schedule calendar.' } },
  { target: 'client-sessions-join-btn', side: 'top',
    ar: { title: 'زر "انضم للجلسة"', description: 'يظهر هذا الزر للجلسات الجارية حالياً أو القريب موعدها. اضغطه للدخول لغرفة الجلسة الافتراضية. تأكد من استعداد الكاميرا والمايكروفون قبل الضغط.' },
    en: { title: '"Join Session" Button', description: 'Appears for sessions that are live now or starting soon. Click to enter the virtual session room. Make sure your camera and microphone are ready before clicking.' } },
  { target: 'client-sessions-completed', side: 'bottom',
    ar: { title: 'تاب المكتملة', description: 'سجل جميع جلساتك المكتملة. يمكنك مراجعة تفاصيل كل جلسة وملاحظاتها. الإيرادات من هذه الجلسات تظهر في صفحة الإيرادات.' },
    en: { title: 'Completed Tab', description: 'Record of all your completed sessions. Review details and notes for each. Revenue from these sessions appears on the Revenue page.' } },
  { target: 'client-sessions-cancelled', side: 'bottom',
    ar: { title: 'تاب الملغاة', description: 'الجلسات الملغاة من طرفك أو من طرف العميل. الجلسات الملغاة قبل 24 ساعة من موعدها عادة لا تُحتسب في التقييم. راجع سياسة الإلغاء في الإعدادات.' },
    en: { title: 'Cancelled Tab', description: 'Sessions cancelled by you or the client. Cancellations 24+ hours before the session usually do not affect your rating. Review the cancellation policy in Settings.' } },
]

export function ClientSessionsTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function ClientSessionsTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
