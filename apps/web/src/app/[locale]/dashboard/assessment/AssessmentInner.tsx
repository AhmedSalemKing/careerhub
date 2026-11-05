'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { RasheedAvatar } from '../../../components/CharacterDuo'

const AIInterviewPage = dynamic(() => import('./AIInterviewPage'), { ssr: false })

const STEPS = [
  'فهم المستخدم',
  'الاهتمامات المهنية',
  'المهارات والقدرات',
  'السلوك المهني',
  'الدوافع وبيئة العمل',
  'الجاهزية المهنية',
]

function AssessmentContent() {
  const params = useSearchParams()
  const mode   = params.get('mode') ?? undefined
  const router = useRouter()

  // Quiz is the default flow. Interview mode is temporarily hidden (its code is preserved
  // in AIInterviewPage); a stale ?mode=interview link falls back to the intro screen.
  if (mode === 'quiz') {
    return <AIInterviewPage mode={mode} />
  }
  // if (mode === 'interview') return <AIInterviewPage mode={mode} />

  return (
    <div dir="rtl" className="dw-assess">
      <section className="dw-as-hero">
        <div className="dw-as-blob b1" aria-hidden="true" />
        <div className="dw-as-blob b2" aria-hidden="true" />

        <div className="dw-as-hero-in">
          <div className="dw-as-avatar">
            <RasheedAvatar size={96} />
          </div>

          <span className="dw-as-eyebrow">مرشد DeveWay المهني بالذكاء الاصطناعي</span>

          <h1>أهلًا، أنا رشيد</h1>

          <p className="dw-as-lede">
            أسئلة ذكية تتكيف مع إجاباتك لتحديد أنسب المسارات المهنية لك بدقة عالية، ثم أقترح عليك خطوتك القادمة.
          </p>

          <button type="button" className="dw-as-cta" onClick={() => router.push('?mode=quiz')}>
            ابدأ التقييم مع رشيد
            <svg className="go" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          <p className="dw-as-meta">المدة التقريبية: 15-20 دقيقة · 18 سؤالاً في 6 محاور</p>
        </div>
      </section>

      <section className="dw-as-steps">
        <ol>
          {STEPS.map((step, i) => (
            <li key={step}>
              <b>{i + 1}</b>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <div className="dw-as-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        التوصيات مبنية على المعلومات التي تشاركها معنا، وهي إرشاد مهني وليست ضماناً لوظيفة معينة.
      </div>
    </div>
  )
}

export function AssessmentInner() {
  return (
    <Suspense fallback={null}>
      <AssessmentContent />
    </Suspense>
  )
}
