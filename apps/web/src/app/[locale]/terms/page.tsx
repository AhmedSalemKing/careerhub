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
        </div>
      )}
    </main>
  )
}
