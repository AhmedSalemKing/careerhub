'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'

const QuizResultCard = dynamic(() => import('../AIInterviewPage').then((m) => m.QuizResultCard), { ssr: false })

type Stored = { result: any; answers: Record<string, string>; timestamp: number }

export default function AssessmentResultPage() {
  const router = useRouter()
  const locale = useLocale()
  const [data, setData] = useState<Stored | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('assessmentResult')
      const parsed = raw ? (JSON.parse(raw) as Stored) : null
      if (parsed?.result?.topCareers?.length) { setData(parsed); return }
    } catch { /* fall through to the redirect */ }
    router.replace(`/${locale}/dashboard/assessment`)
  }, [router, locale])

  if (!data) return null

  return (
    <QuizResultCard
      result={data.result}
      answers={data.answers ?? {}}
      onRestart={() => { sessionStorage.removeItem('assessmentResult'); router.push(`/${locale}/dashboard/assessment`) }}
    />
  )
}
