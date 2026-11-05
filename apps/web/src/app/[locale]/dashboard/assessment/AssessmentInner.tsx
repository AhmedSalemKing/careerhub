'use client'
import { useRef } from 'react'
import dynamic from 'next/dynamic'
import { RasheedAvatar } from '../../../components/CharacterDuo'

const AIInterviewPage = dynamic(() => import('./AIInterviewPage'), { ssr: false })

function AssessmentContent() {
  const quizRef = useRef<HTMLDivElement>(null)

  // Single page: the intro hero and the quiz live together at /dashboard/assessment.
  // The CTA scrolls to the quiz instead of navigating. Interview mode stays hidden
  // (its code is preserved in AIInterviewPage): <AIInterviewPage mode="interview" />
  const handleStart = () => {
    quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div dir="rtl" className="dw-assess">
      <section className="dw-as-hero full">
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

          <button type="button" className="dw-as-cta" onClick={handleStart}>
            ابدأ التقييم مع رشيد
            <svg className="go down" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
          </button>

          <p className="dw-as-meta">المدة التقريبية: 15-20 دقيقة · 18 سؤالاً في 6 محاور</p>
        </div>
      </section>

      <div ref={quizRef} className="dw-as-quizsec">
        <div className="dw-as-title">
          <span className="dw-as-eyebrow dark">نحو 15-20 دقيقة</span>
          <h2>التقييم المهني المجاني مع رشيد</h2>
        </div>
        <AIInterviewPage mode="quiz" embedded />
      </div>

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
  return <AssessmentContent />
}
