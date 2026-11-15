'use client'

import { useLocale } from 'next-intl'

// Each entry is [Arabic, English].
const faqs: { q: [string, string]; a: [string, string] }[] = [
  {
    q: ['كيف أبدأ التعلم في DeveWay؟', 'How do I start learning on DeveWay?'],
    a: ['اختر كورساً من صفحة الكورسات، سجل حسابك، وابدأ التعلم فوراً. جميع الكورسات متاحة عند الاشتراك.', 'Pick a course from the courses page, create your account, and start learning right away. All courses are available once you subscribe.'],
  },
  {
    q: ['هل الشهادات معتمدة؟', 'Are the certificates accredited?'],
    a: ['نعم، شهاداتنا معتمدة ويمكن التحقق منها عبر موقعنا من خلال رابط التحقق الخاص بكل شهادة.', 'Yes, our certificates are accredited and can be verified on our website through the verification link of each certificate.'],
  },
  {
    q: ['هل يمكن استرداد المبلغ؟', 'Can I get a refund?'],
    a: ['نعم، نوفر ضمان استرداد خلال 30 يوماً من تاريخ الاشتراك إذا لم تكن راضياً عن الكورس.', 'Yes, we offer a refund guarantee within 30 days of subscribing if you are not satisfied with the course.'],
  },
  {
    q: ['كيف أتواصل مع المحاضر؟', 'How do I contact the instructor?'],
    a: ['يمكنك التواصل مع المحاضرين عبر نظام المحادثات المدمج داخل كل كورس.', 'You can contact instructors through the built-in chat system inside each course.'],
  },
  {
    q: ['هل توجد جلسات إرشادية؟', 'Are there mentoring sessions?'],
    a: ['نعم، نوفر جلسات إرشادية فردية مع خبراء متخصصين في مختلف المجالات المهنية.', 'Yes, we offer one-to-one mentoring sessions with specialized experts across different career fields.'],
  },
]

export default function FaqPage() {
  const isAr = useLocale() === 'ar'
  const L = isAr ? 0 : 1
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q[L],
            acceptedAnswer: { '@type': 'Answer', text: faq.a[L] },
          })),
        })
      }} />
      <div dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth:'800px', margin:'0 auto', padding:'3rem 1rem' }}>
        <h1 style={{ fontSize:'2rem', fontWeight:700, marginBottom:'2rem' }}>{isAr ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h1>
        {faqs.map((item, i) => (
          <div key={i} style={{ marginBottom:'1.5rem', padding:'1.25rem', border:'1px solid var(--border)', borderRadius:'10px' }}>
            <h3 style={{ fontWeight:600, marginBottom:'0.5rem' }}>{item.q[L]}</h3>
            <p style={{ color:'var(--muted-foreground)', margin:0 }}>{item.a[L]}</p>
          </div>
        ))}
      </div>
    </>
  )
}
