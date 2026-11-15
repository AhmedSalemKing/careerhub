'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../lib/api'
import {
  TERMS_AR, TERMS_EN, LEGAL_UPDATED_AR, LEGAL_UPDATED_EN,
} from '../../../components/legal/legalDefaults'

// CMS content shorter than this is treated as a placeholder and the built-in terms are shown instead.
const MIN_CMS_LENGTH = 1500

export default function TermsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [html, setHtml] = useState('')

  useEffect(() => {
    api.get('/admin/site-config')
      .then((res) => { const d = res.data?.data ?? res.data; setHtml(d?.['pages.terms'] || '') })
      .catch(() => {})
  }, [])

  const sections = isAr ? TERMS_AR : TERMS_EN
  const useCms = html.replace(/<[^>]*>/g, '').trim().length >= MIN_CMS_LENGTH

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>
      <p className="text-sm opacity-60 mb-6">
        {isAr ? `آخر تحديث: ${LEGAL_UPDATED_AR}` : `Last updated: ${LEGAL_UPDATED_EN}`}
      </p>
      {useCms ? (
        <div className="text-sm leading-relaxed opacity-80" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="text-sm leading-relaxed opacity-80 space-y-6">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-semibold mb-2">{s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}
          {isAr && (
            <>
              <p>
                وتحتفظ المنصة بالحق في تعديل هذه الشروط في أي وقت، وسيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار بارز على المنصة. استمرار استخدام الخدمة بعد نشر التغييرات يُعدّ قبولاً صريحاً لها. كما تلتزم المنصة بحماية بيانات المستخدمين وفقاً لأحكام سياسة الخصوصية المعمول بها، وعدم مشاركتها مع أطراف ثالثة إلا بموافقة صريحة من المستخدم أو عند الاقتضاء القانوني. ويحق للمستخدم في أي وقت طلب حذف حسابه وجميع بياناته الشخصية من المنصة، وسيتم تنفيذ ذلك خلال مدة لا تتجاوز ثلاثين يوماً من تاريخ الطلب. هذه الشروط محكومة بأحكام القانون المعمول به في دولة الإمارات العربية المتحدة، وأي نزاع يُحال إلى الجهات القضائية المختصة.
              </p>
              <p>
                تُقدّم المنصة خدماتها بشكل مستمر مع السعي لضمان أعلى مستويات الجودة والاستمرارية، غير أنها لا تضمن خلوّ الخدمة من الانقطاعات الطارئة. في حال وقوع أي انقطاع، تلتزم المنصة بالإخطار المسبق والعمل على استعادة الخدمة في أقصر وقت ممكن. المستخدم مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة به، وأي نشاط يتم من خلال حسابه يُعدّ مسؤوليته الكاملة.
              </p>
            </>
          )}
        </div>
      )}
    </main>
  )
}
