'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'assessment-tour-seen'

const STEPS: TourStepDef[] = [
  { target: 'assess-hero', side: 'bottom',
    ar: { title: 'مرشدك المهني رشيد', description: 'رشيد هو مساعدك بالذكاء الاصطناعي. سيطرح عليك أسئلة ويرشّح لك أفضل المسارات المهنية بناءً على إجاباتك.' },
    en: { title: 'Meet Rasheed, your career guide', description: 'Rasheed is your AI assistant. He asks you questions and recommends the best career paths based on your answers.' } },
  { target: 'assess-sections', side: 'top',
    ar: { title: '٦ أقسام قصيرة', description: 'التقييم مقسّم إلى ٦ أقسام، كل قسم يستغرق بضع دقائق فقط. يمكنك التنقل بين الأسئلة بحرية.' },
    en: { title: '6 short sections', description: 'The assessment has 6 sections, each taking only a few minutes. You can move between questions freely.' } },
  { target: 'assess-options', side: 'top',
    ar: { title: 'أجب بصدق', description: 'لا توجد إجابة صح أو خطأ. كلما كانت إجاباتك صادقة، كانت توصيات رشيد أدق.' },
    en: { title: 'Answer honestly', description: 'There is no right or wrong answer. The more honest your answers, the more accurate the recommendations from Rasheed.' } },
  { target: 'assess-next', side: 'top',
    ar: { title: 'انتقل للسؤال التالي', description: 'بعد الإجابة على كل سؤال، اضغط التالي للمتابعة. يمكنك العودة للأسئلة السابقة في أي وقت.' },
    en: { title: 'Go to the next question', description: 'After answering each question, press Next to continue. You can go back to earlier questions at any time.' } },
]

export function AssessmentTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function AssessmentTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
