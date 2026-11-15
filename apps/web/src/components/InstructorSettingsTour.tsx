'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_instructor_settings_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'settings-header', selector: "h1, [data-tour=\"settings-header\"]", side: 'bottom',
    ar: { title: "الإعدادات الشخصية", description: "إدارة كاملة لحسابك وتفضيلاتك كمحاضر. تجد هنا 5 تابات: الملف الشخصي — الأمان — التفضيلات — الإشعارات — توثيق الهوية." },
    en: { title: "Personal Settings", description: "Complete management of your account and preferences as an instructor. 5 tabs: Profile, Security, Preferences, Notifications, Identity Verification." } },
  { target: 'settings-tab-profile', side: 'bottom',
    ar: { title: "تاب الملف الشخصي", description: "تعديل معلوماتك الشخصية الظاهرة للطلاب: الاسم، الصورة الشخصية، الجنس، رقم الهاتف، السيرة الذاتية، الموقع، رابط LinkedIn. الملف الشخصي الكامل يبني الثقة مع الطلاب." },
    en: { title: "Profile Tab", description: "Edit personal info visible to students: name, photo, gender, phone, bio, location, LinkedIn. A complete profile builds student trust." } },
  { target: 'settings-avatar', side: 'bottom',
    ar: { title: "الصورة الشخصية", description: "صورتك الشخصية تظهر على كل كورساتك وفي الملف الشخصي. استخدم صورة واضحة احترافية (وجه واضح، خلفية بسيطة). الصور الاحترافية تزيد من تسجيلات الطلاب." },
    en: { title: "Profile Photo", description: "Your photo appears on all your courses and profile page. Use a clear, professional headshot (clear face, simple background). Professional photos significantly increase student enrollment." } },
  { target: 'settings-name', side: 'bottom',
    ar: { title: "الاسم الكامل", description: "اسمك الظاهر على كورساتك وشهاداتك وإشعارات الطلاب. استخدم اسمك الحقيقي أو المهني الذي يعرفك به طلابك وزملاؤك." },
    en: { title: "Full Name", description: "Your name appears on courses, certificates, and student notifications. Use your real or professional name as known to students and colleagues." } },
  { target: 'settings-bio', side: 'bottom',
    ar: { title: "السيرة الذاتية (Bio)", description: "وصف مختصر لخبراتك ومؤهلاتك. يظهر في صفحة كل كورس من كورساتك ويؤثر على قرار الطالب في التسجيل. اذكر: خبرتك — مجالاتك — إنجازاتك البارزة. اكتبه بنبرة ودية ومهنية." },
    en: { title: "Bio", description: "Brief summary of your expertise and qualifications. Appears on each of your course pages and influences student enrollment decisions. Include: your experience, fields, and notable achievements. Write in a friendly, professional tone." } },
  { target: 'settings-linkedin', side: 'bottom',
    ar: { title: "رابط LinkedIn", description: "رابط ملفك الشخصي على LinkedIn. يظهر في صفحة المحاضر ويمنح الطلاب إمكانية التحقق من خبراتك ومتابعتك على المنصة المهنية." },
    en: { title: "LinkedIn URL", description: "Your LinkedIn profile URL. Shown on your instructor profile page, letting students verify your credentials and follow you on the professional network." } },
  { target: 'settings-tab-security', side: 'bottom',
    ar: { title: "تاب الأمان", description: "إدارة أمان حسابك: تغيير كلمة المرور، إعدادات المصادقة الثنائية (2FA). يُنصح بشدة بتفعيل 2FA لحماية حسابك وكورساتك وإيراداتك." },
    en: { title: "Security Tab", description: "Manage account security: change password, two-factor authentication (2FA) settings. Strongly recommended to enable 2FA to protect your account, courses, and earnings." } },
  { target: 'settings-tab-preferences', side: 'bottom',
    ar: { title: "تاب التفضيلات", description: "إعدادات تجربة الاستخدام: اللغة المفضلة، الدولة (EG/KSA)، المظهر (فاتح/داكن). تؤثر على واجهة لوحة التحكم فقط ولا تؤثر على ما يراه الطلاب." },
    en: { title: "Preferences Tab", description: "UX preferences: preferred language, country (EG/KSA), theme (light/dark). Affects your dashboard view only, not what students see." } },
  { target: 'settings-tab-notifications', side: 'bottom',
    ar: { title: "تاب الإشعارات", description: "تحكم في أنواع الإشعارات التي تصلك: تسجيلات طلاب جدد — أسئلة ومراجعات — رسائل من DeveWay — تذكيرات الاختبارات المعلقة. اضبط ما يهمك وأوقف ما لا تريده." },
    en: { title: "Notifications Tab", description: "Control notification types: new student enrollments, questions and reviews, messages from DeveWay, pending quiz reminders. Enable what matters to you, disable the rest." } },
  { target: 'settings-tab-verification', side: 'bottom',
    ar: { title: "تاب توثيق الهوية", description: "بعض ميزات المنصة تتطلب توثيق هويتك (مثل الحصول على المدفوعات وتجاوز حدود معينة). العملية بسيطة: رفع وجه بطاقة الهوية + ظهر البطاقة ثم إرسال الطلب." },
    en: { title: "Identity Verification Tab", description: "Some platform features require identity verification (e.g., receiving payouts, exceeding certain limits). Simple process: upload front and back of your ID, then submit the request." } },
  { target: 'settings-id-front', side: 'top',
    ar: { title: "وجه البطاقة", description: "ارفع صورة واضحة لوجه (الأمامي) بطاقة هويتك القومية أو جواز السفر. الصورة يجب أن تكون: واضحة وغير ضبابية — الأرقام والأسماء مقروءة — بدون وميض أو ظلال مبالغ فيها." },
    en: { title: "ID Front Face", description: "Upload a clear photo of the front face of your national ID or passport. Requirements: sharp and in-focus — numbers and names readable — no excessive glare or shadows." } },
  { target: 'settings-id-back', side: 'top',
    ar: { title: "ظهر البطاقة", description: "ارفع صورة واضحة لظهر (الخلفي) بطاقة هويتك. نفس متطلبات الجودة. بعض أنواع الهويات (جواز السفر) قد تحتاج صفحة البيانات فقط." },
    en: { title: "ID Back Face", description: "Upload a clear photo of the back of your ID. Same quality requirements. Some ID types (passports) may only need the data page." } },
  { target: 'settings-submit-verification', side: 'top',
    ar: { title: "تقديم طلب التوثيق", description: "بعد رفع الصورتين، اضغط \"تقديم طلب التوثيق\". يراجع فريق DeveWay طلبك خلال 1-3 أيام عمل ويُرسل إشعاراً بالنتيجة. إذا رُفض، ستحصل على سبب المراجعة وتستطيع إعادة التقديم." },
    en: { title: "Submit Verification Request", description: "After uploading both images, click \"Submit Verification Request\". DeveWay team reviews within 1-3 business days and sends a notification. If rejected, you receive a reason and can resubmit." } },
]

export function InstructorSettingsTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function InstructorSettingsTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
