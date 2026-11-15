'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_coaching_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'coaching-hero', side: 'bottom',
    ar: { title: 'صفحة الكوتشينج', description: 'هنا مرشدونا المهنيون يشاركون خبرتهم معك — جلسات فردية، عيادات جماعية، ومراجعات متخصصة.' },
    en: { title: 'Coaching Page', description: 'Our professional mentors share their expertise with you — 1-on-1 sessions, group clinics, and expert reviews.' } },
  { target: 'coaching-hero-btns', side: 'bottom',
    ar: { title: 'زراري التنقل السريع', description: '"قدّم كمرشد" لو عندك خبرة وعايز تنضم للمرشدين. "افتح بوابة المرشدين" لو مرشد بالفعل لتدير مواعيدك.' },
    en: { title: 'Quick Action Buttons', description: '"Apply as Mentor" if experienced and want to join. "Open Mentor Portal" if already a mentor to manage your schedule.' } },
  { target: 'coaching-clinics', side: 'bottom',
    ar: { title: 'العيادات الجماعية', description: 'جلسات أسبوعية مجانية أو بسعر رمزي — مرشد واحد وعدة متعلمين. مناسبة للأسئلة العامة والمشكلات الشائعة.' },
    en: { title: 'Group Clinics', description: 'Weekly sessions at low or no cost — one mentor and multiple learners. Great for general questions and common problems.' } },
  { target: 'coaching-how-it-works', side: 'bottom',
    ar: { title: 'كيف يعمل الكوتشينج', description: '4 خطوات: قدّم طلبك كمرشد ← نطابقك بالمتعلمين ← حدّد مواعيدك ← أرشد واحصل على أجرك.' },
    en: { title: 'How Coaching Works', description: '4 steps: Apply as mentor ← We match you with learners ← Set your schedule ← Guide and get paid.' } },
  { target: 'coaching-types', side: 'bottom',
    ar: { title: 'أنواع الإرشاد', description: '3 أنواع: العيادات الجماعية (مجموعة)، مراجعات الخبراء (بدون موعد مباشر)، والجلسات الفردية (مراجعات المقابلات).' },
    en: { title: 'Mentoring Types', description: '3 types: Group Clinics (group), Expert Reviews (async, no live meeting), and 1-on-1 Sessions (interview prep).' } },
  { target: 'coaching-apply-form', side: 'top',
    ar: { title: 'نموذج التقديم كمرشد', description: 'لو تستوفي الشروط: 5 سنوات خبرة، قادر على الإرشاد بالعربية أو الإنجليزية، وعارف سوق مصر أو السعودية — قدّم هنا.' },
    en: { title: 'Mentor Application Form', description: 'If qualified: 5+ years experience, can mentor in Arabic or English, and know Egypt or Saudi market — apply here.' } },
  { target: 'coaching-apply-fields', side: 'top',
    ar: { title: 'بيانات التقديم', description: 'ستحتاج: الاسم الكامل، البريد الإلكتروني، كلمة مرور، السيرة الذاتية (PDF/Word)، الدولة، المجال، سنوات الخبرة، لغات الإرشاد.' },
    en: { title: 'Application Fields', description: 'You will need: full name, email, password, CV (PDF/Word), country, field, years of experience, mentoring languages.' } },
  { target: 'coaching-current-mentors', side: 'top',
    ar: { title: 'المرشدون الحاليون', description: 'اضغط "عرض المرشدين الحاليين" لاستعراض كل المرشدين المتاحين واختيار المناسب ليك وحجز جلسة.' },
    en: { title: 'Current Mentors', description: 'Tap "View Current Mentors" to browse all available mentors, choose the right one for you, and book a session.' } },
]

export function CoachingTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function CoachingTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
