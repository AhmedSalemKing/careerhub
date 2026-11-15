'use client'

import { PageTour, PageTourLauncher, type TourStepDef } from './tour/PageTour'

const TOUR_KEY = 'deveway_booking_tour_v2'

const STEPS: TourStepDef[] = [
  { target: 'booking-header', side: 'bottom',
    ar: { title: 'حجز جلسة إرشادية', description: '4 خطوات بسيطة لحجز جلستك مع المرشد — المدة، التاريخ، الوقت، وتفاصيل الجلسة.' },
    en: { title: 'Book a Mentoring Session', description: '4 simple steps to book your session — duration, date, time, and session details.' } },
  { target: 'booking-mentor-name', side: 'bottom',
    ar: { title: 'اسم المرشد', description: 'تأكيد إنك بتحجز مع المرشد الصح — الاسم ومجاله المهني ظاهرين في الأعلى.' },
    en: { title: 'Mentor Name', description: 'Confirmation you are booking with the right mentor — name and professional field shown at the top.' } },
  { target: 'booking-duration', side: 'bottom',
    ar: { title: 'اختر المدة — الخطوة 1', description: '30 دقيقة للأسئلة السريعة، 60 دقيقة للمراجعة المتعمقة، 90 دقيقة لجلسة شاملة. السعر بيتغير مع كل اختيار.' },
    en: { title: 'Choose Duration — Step 1', description: '30 min for quick questions, 60 min for in-depth review, 90 min for comprehensive session. Price changes with each choice.' } },
  { target: 'booking-duration-price', side: 'bottom',
    ar: { title: 'سعر المدة', description: 'السعر المعروض هو إجمالي الجلسة حسب المدة المختارة — مش للدقيقة الواحدة.' },
    en: { title: 'Duration Price', description: 'The shown price is the total session cost based on selected duration — not per minute.' } },
  { target: 'booking-date', side: 'bottom',
    ar: { title: 'اختر التاريخ — الخطوة 2', description: 'الأيام العادية متاحة. الأيام المظللة بالخطوط محجوزة بالكامل. اختر يوم متاح للمتابعة.' },
    en: { title: 'Choose Date — Step 2', description: 'Plain days are available. Striped days are fully booked. Choose an available day to continue.' } },
  { target: 'booking-calendar-legend', side: 'bottom',
    ar: { title: 'دليل التقويم', description: '"متاح" = فيه أوقات فاضية. "محدد" = اليوم اللي اخترته. "محجوز بالكامل" = مفيش أوقات — اختار يوم تاني.' },
    en: { title: 'Calendar Legend', description: '"Available" = has open slots. "Selected" = your chosen day. "Fully Booked" = no slots — choose another day.' } },
  { target: 'booking-time', side: 'top',
    ar: { title: 'اختر الوقت — الخطوة 3', description: 'الأوقات المتاحة واضحة. الأوقات المشطوبة محجوزة. اختار أي وقت مناسب ليك.' },
    en: { title: 'Choose Time — Step 3', description: 'Available slots are clear. Crossed-out slots are booked. Choose any time that works for you.' } },
  { target: 'booking-available-slots', side: 'top',
    ar: { title: 'عدد الأوقات المتاحة', description: 'يعرضلك "21 من 24 وقت متاح" مثلاً — يساعدك تعرف مدى الانشغال في اليوم ده.' },
    en: { title: 'Available Slots Count', description: 'Shows "21 of 24 slots available" for example — helps you gauge how busy that day is.' } },
  { target: 'booking-details', side: 'top',
    ar: { title: 'تفاصيل الجلسة — الخطوة 4', description: 'اكتب موضوع الجلسة بوضوح عشان المرشد يستعد كويس. الملاحظات اختيارية بس بتساعد.' },
    en: { title: 'Session Details — Step 4', description: 'Write a clear session topic so the mentor prepares well. Notes are optional but helpful.' } },
  { target: 'booking-summary', side: 'top',
    ar: { title: 'ملخص الحجز', description: 'راجع: اسم المرشد، المدة، التاريخ، الوقت، والإجمالي — تأكد إن كل حاجة صح قبل التأكيد.' },
    en: { title: 'Booking Summary', description: 'Review: mentor name, duration, date, time, and total — make sure everything is correct before confirming.' } },
  { target: 'booking-confirm-btn', side: 'top',
    ar: { title: 'تأكيد الحجز', description: 'اضغط "تأكيد الحجز" لإرسال طلب الجلسة. المرشد هيوافق وبعدين تدفع. تظهر الجلسة في "جلساتي".' },
    en: { title: 'Confirm Booking', description: 'Tap "Confirm Booking" to send the session request. The mentor will approve, then you pay. Session appears in "My Sessions".' } },
]

export function BookingTour({ locale, isOpen, onClose }: { locale?: string; isOpen?: boolean; onClose?: () => void }) {
  return <PageTour tourKey={TOUR_KEY} steps={STEPS} locale={locale} isOpen={isOpen} onClose={onClose} />
}

export function BookingTourLauncher({ locale }: { locale?: string }) {
  return <PageTourLauncher tourKey={TOUR_KEY} steps={STEPS} locale={locale} />
}
