'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../lib/api'

export default function PrivacyPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [html, setHtml] = useState('')

  useEffect(() => {
    api.get('/admin/site-config')
      .then((res) => { const d = res.data?.data ?? res.data; setHtml(d?.['pages.privacy'] || '') })
      .catch(() => {})
  }, [])

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
      <div className="text-sm leading-relaxed opacity-80" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  )
}
