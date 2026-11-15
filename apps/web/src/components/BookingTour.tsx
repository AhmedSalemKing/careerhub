'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_booking_tour_v1'

const STEPS: TourStepDef[] = [
  { target: 'booking-duration', side: 'bottom',
    ar: { title: 'اختر المدة', description: 'حدد مدة الجلسة: 30 أو 60 أو 90 دقيقة — السعر يتغير تلقائياً.' },
    en: { title: 'Choose Duration', description: 'Select session length: 30, 60, or 90 minutes — the price updates automatically.' } },
  { target: 'booking-date', side: 'bottom',
    ar: { title: 'اختر التاريخ', description: 'الأيام الخضراء متاحة، المظللة محجوزة بالكامل.' },
    en: { title: 'Choose Date', description: 'Green days are available, striped days are fully booked.' } },
  { target: 'booking-time', side: 'top',
    ar: { title: 'اختر الوقت', description: 'الأوقات المتاحة تظهر بوضوح — المحجوزة مشطوبة.' },
    en: { title: 'Choose Time', description: 'Available slots appear clearly — booked ones are crossed out.' } },
  { target: 'booking-details', side: 'top',
    ar: { title: 'تفاصيل الجلسة', description: 'أدخل موضوع الجلسة وأي ملاحظات تريد إرسالها للمرشد، ثم أكد الحجز.' },
    en: { title: 'Session Details', description: 'Enter your session topic and any notes for the mentor, then confirm the booking.' } },
]

export function BookingTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function BookingTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
