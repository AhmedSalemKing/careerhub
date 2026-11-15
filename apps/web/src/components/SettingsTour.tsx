'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_settings_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'settings-header', side: 'bottom',
    ar: { title: 'الإعدادات', description: 'إدارة حسابك الشخصي وتفضيلاتك الأمنية وإعدادات الإشعارات.' },
    en: { title: 'Settings', description: 'Manage your personal account, security preferences, and notification settings.' } },
  { target: 'settings-tabs', side: 'bottom',
    ar: { title: 'أقسام الإعدادات', description: '4 أقسام: الملف الشخصي لبياناتك، الأمان لكلمة المرور، التفضيلات للغة والدولة، الإشعارات لتحكم في التنبيهات.' },
    en: { title: 'Settings Sections', description: '4 sections: Profile for your data, Security for password, Preferences for language and country, Notifications to control alerts.' } },
  { target: 'settings-avatar', side: 'bottom',
    ar: { title: 'صورة الحساب', description: 'اضغط على الدائرة لتغيير صورة حسابك الشخصية — الصورة بتظهر في كل أنشطتك على المنصة.' },
    en: { title: 'Profile Picture', description: 'Tap the circle to change your profile photo — it appears across all your activities on the platform.' } },
  { target: 'settings-gender', side: 'bottom',
    ar: { title: 'الجنس', description: 'اختر ذكر أو أنثى — بيساعد رشيد في تخصيص ترشيحاته المهنية ليك.' },
    en: { title: 'Gender', description: 'Choose male or female — helps Rashid personalize career recommendations for you.' } },
  { target: 'settings-name', side: 'bottom',
    ar: { title: 'الاسم الأول واسم العائلة', description: 'الاسم اللي بيظهر في الترحيب ولوحة التحكم وشهاداتك — تأكد إنه صح قبل تحميل أي شهادة.' },
    en: { title: 'First and Last Name', description: 'The name shown in greetings, dashboard, and your certificates — make sure it is correct before downloading any certificate.' } },
  { target: 'settings-phone', side: 'bottom',
    ar: { title: 'رقم الموبايل', description: 'رقمك للتواصل والإشعارات — مش بيظهر للمرشدين أو المتعلمين الآخرين.' },
    en: { title: 'Phone Number', description: 'Your number for contact and notifications — not visible to mentors or other learners.' } },
  { target: 'settings-bio', side: 'bottom',
    ar: { title: 'نبذة عنك', description: 'اكتب ملخص قصير عن خلفيتك وأهدافك المهنية — بيساعد المرشدين يفهموك أكتر قبل الجلسة.' },
    en: { title: 'About You', description: 'Write a short summary of your background and career goals — helps mentors understand you better before the session.' } },
  { target: 'settings-location', side: 'bottom',
    ar: { title: 'الدولة والمدينة', description: 'موقعك الجغرافي بيأثر على العملة وأسعار الكورسات والجلسات المعروضة ليك.' },
    en: { title: 'Country and City', description: 'Your location affects the currency and prices of courses and sessions shown to you.' } },
  { target: 'settings-linkedin', side: 'bottom',
    ar: { title: 'رابط LinkedIn', description: 'أضف ملفك على LinkedIn — بيساعد المرشدين في مراجعة خلفيتك ويزيد مصداقيتك على المنصة.' },
    en: { title: 'LinkedIn Profile', description: 'Add your LinkedIn profile — helps mentors review your background and boosts your credibility on the platform.' } },
  { target: 'settings-save', side: 'top',
    ar: { title: 'حفظ التغييرات', description: 'لازم تضغط "حفظ التغييرات" بعد أي تعديل — التغييرات مش بتتحفظ تلقائياً.' },
    en: { title: 'Save Changes', description: 'You must tap "Save Changes" after any edit — changes are not saved automatically.' } },
]

export function SettingsTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function SettingsTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
