'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_live_manage_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'live-header', side: 'bottom',
    ar: { title: 'صفحة إدارة البث المباشر', description: 'هنا تتابع كل تفاصيل البث المباشر لكورسك وتدير التسجيل الخاص به. الصفحة مقسمة لـ 5 تابات: نظرة عامة — التسجيل — المحاضرين — الاشتراكات — الإعدادات.' },
    en: { title: 'Live Stream Management', description: 'Track all details of your live stream and manage its recording. 5 tabs: Overview, Recording, Presenters, Subscriptions, Settings.' } },
  { target: 'live-status-badge', side: 'left',
    ar: { title: 'حالة البث', description: 'ثلاث حالات ممكنة: "جارٍ البث" (البث مباشر الآن) — "تم الانتهاء" (انتهى البث) — "لم يبدأ بعد" (قبل الموعد المحدد). الحالة تتحدث تلقائياً.' },
    en: { title: 'Stream Status', description: 'Three possible states: "Live Now" (stream is active) — "Ended" (stream finished) — "Not Started Yet" (before scheduled time). Status updates automatically.' } },
  { target: 'live-details', side: 'top',
    ar: { title: 'تفاصيل البث', description: 'تاريخ ووقت البدء والمدة الفعلية وعدد المشاهدين أثناء البث. المدة الفعلية تُسجَّل من بداية البث حتى نهايته، وقد تختلف عن المدة المتوقعة التي حددتها.' },
    en: { title: 'Stream Details', description: 'Date, start time, actual duration, and viewer count during the stream. Actual duration is recorded from stream start to end and may differ from your estimated duration.' } },
  { target: 'live-share-btn', side: 'bottom',
    ar: { title: 'مشاركة رابط البث مع الطلاب', description: 'اضغط هذا الزر لنسخ رابط صفحة الكورس للطلاب. أرسله لطلابك عبر واتساب أو بريد إلكتروني أو قناة تيليغرام ليصلوا للبث أو التسجيل بعد انتهائه.' },
    en: { title: 'Share Stream Link with Students', description: 'Click to copy the student-facing course link to clipboard. Share via WhatsApp, email, or Telegram so students can access the live stream or recording after it ends.' } },
  { target: 'live-tab-overview', side: 'bottom',
    ar: { title: 'تاب نظرة عامة', description: 'ملخص البث: الحالة، التاريخ، المدة، عدد المشاهدين المتزامنين. استخدمه للتحقق السريع من أن كل شيء يسير كما هو مخطط.' },
    en: { title: 'Overview Tab', description: 'Stream summary: status, date, duration, concurrent viewers. Use it to quickly verify everything went as planned.' } },
  { target: 'live-tab-recording', side: 'bottom',
    ar: { title: 'تاب التسجيل', description: 'بعد انتهاء البث يبدأ تجهيز التسجيل تلقائياً. قد يستغرق بضع دقائق حتى ساعة حسب مدة البث. بعد الانتهاء يظهر مشغّل الفيديو هنا ويصبح متاحاً للطلاب المسجلين في الكورس.' },
    en: { title: 'Recording Tab', description: 'After the stream ends, recording processing starts automatically. May take a few minutes to an hour depending on stream duration. Once ready, the video player appears here and becomes available to enrolled students.' } },
  { target: 'live-tab-presenters', side: 'bottom',
    ar: { title: 'تاب المحاضرين', description: 'قائمة المحاضرين الذين شاركوا في البث. إذا دعوت محاضرين إضافيين للانضمام للبث، تجد معلوماتهم هنا.' },
    en: { title: 'Presenters Tab', description: 'List of presenters who participated in the stream. If you invited additional presenters to join, their information appears here.' } },
  { target: 'live-tab-subscriptions', side: 'bottom',
    ar: { title: 'تاب الاشتراكات', description: 'قائمة الطلاب المسجلين في هذا الكورس. يمكنك هنا رؤية من حضر البث ومن سيتابع التسجيل لاحقاً.' },
    en: { title: 'Subscriptions Tab', description: 'List of students enrolled in this course. See who attended the live stream and who will watch the recording later.' } },
  { target: 'live-tab-settings', side: 'bottom',
    ar: { title: 'تاب الإعدادات', description: 'إعدادات البث: تعديل العنوان، الوصف، وإعدادات الخصوصية. بعض الإعدادات لا تظهر بعد انتهاء البث.' },
    en: { title: 'Settings Tab', description: 'Stream settings: edit title, description, and privacy settings. Some settings may not be editable after the stream ends.' } },
  { target: 'live-go-to-course', side: 'top',
    ar: { title: 'الذهاب إلى صفحة الكورس', description: 'اضغط "الذهاب إلى الكورس" لفتح صفحة الكورس كما يراها الطالب. يمكنك من هنا التحقق من أن التسجيل يظهر بشكل صحيح للطلاب المسجلين.' },
    en: { title: 'Go to Course Page', description: 'Click "Go to Course" to open the student-facing course page. Use this to verify the recording is displaying correctly for enrolled students.' } },
]

export function LiveManageTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function LiveManageTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
