'use client'

interface CandidatePath {
  pathSlug: string
  titleAr: string
  titleEn: string
  status: 'PROVISIONAL'
  ranked: false
  evidenceFor: string[]
  evidenceAgainst: string[]
  skillsPresent: string[]
  skillsMissing: string[]
  marketReadinessLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null
}

interface ReportData {
  report?: {
    candidatePaths?: CandidatePath[]
    strengthsAr?: string[]
    skillGapsAr?: string[]
    experienceGapsAr?: string[]
    limitations?: string | null
    profileSummaryAr?: string | null
  }
  dimensionEvidence?: {
    confidence?: number | null
    evidenceFindings?: Record<string, { observations: string[]; answerCount: number; isComplete: boolean }>
  }
}

const DIMENSION_LABELS: Record<string, string> = {
  INTERESTS: 'الاهتمامات',
  SKILLS: 'المهارات',
  BEHAVIORAL_INDICATORS: 'المؤشرات السلوكية',
  MOTIVATION: 'الدوافع',
  WORK_PREFERENCES: 'تفضيلات العمل',
  MARKET_READINESS: 'الاستعداد للسوق',
}

const MARKET_LABEL: Record<string, string> = { LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'مرتفع' }
const MARKET_COLOR: Record<string, string> = { LOW: '#ef4444', MEDIUM: '#f59e0b', HIGH: '#10b981' }

export function DiscoveryReport({ report: data }: { report: ReportData }) {
  const report = data?.report
  const evidence = data?.dimensionEvidence

  return (
    <div dir="rtl" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif', marginBottom: 8 }}>
          تقرير بوصلة المسار المهني
        </h1>
        {/* Provisional notice */}
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, color: '#f59e0b' }}>
          ⚠ المسارات المقترحة مبدئية وغير مُرتّبة — تستوجب مراجعة الأوزان المعتمدة
        </div>
      </div>

      {/* Limitations */}
      {report?.limitations && (
        <div style={{ padding: 14, marginBottom: 20, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>
          <strong>ملاحظة:</strong> {report.limitations}
        </div>
      )}

      {/* Profile summary */}
      {report?.profileSummaryAr && (
        <div style={{ padding: 16, marginBottom: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>ملخص الملف المهني</h2>
          <p style={{ fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.7 }}>{report.profileSummaryAr}</p>
        </div>
      )}

      {/* Confidence */}
      {evidence?.confidence != null && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>اكتمال الأدلة:</span>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${evidence.confidence}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{evidence.confidence}%</span>
        </div>
      )}

      {/* Dimension evidence overview */}
      {evidence?.evidenceFindings && Object.keys(evidence.evidenceFindings).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--foreground)' }}>نظرة على الأبعاد</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(evidence.evidenceFindings).map(([dim, finding]) => (
              <div key={dim} style={{ padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: finding.isComplete ? '#10b981' : '#f59e0b',
                }} />
                <span style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 500 }}>{DIMENSION_LABELS[dim] ?? dim}</span>
                <span style={{ marginRight: 'auto', fontSize: 11, color: 'var(--muted-foreground)' }}>
                  {finding.answerCount} إجابة · {finding.isComplete ? 'مكتمل' : 'جزئي'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate paths */}
      {report?.candidatePaths && report.candidatePaths.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--foreground)' }}>المسارات المبدئية المقترحة</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {report.candidatePaths.map((path) => (
              <div key={path.pathSlug} style={{ padding: 18, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>{path.titleAr}</h3>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{path.titleEn}</span>
                  {path.marketReadinessLevel && (
                    <span style={{ marginRight: 'auto', fontSize: 11, color: MARKET_COLOR[path.marketReadinessLevel] ?? 'var(--muted-foreground)', fontWeight: 600 }}>
                      استعداد للسوق: {MARKET_LABEL[path.marketReadinessLevel]}
                    </span>
                  )}
                </div>

                {path.evidenceFor.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 6 }}>أدلة داعمة</p>
                    {path.evidenceFor.map((e, i) => (
                      <p key={i} style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 3 }}>• {e}</p>
                    ))}
                  </div>
                )}

                {path.skillsMissing.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>مهارات ناقصة</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {path.skillsMissing.map(s => (
                        <span key={s} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#fde68a', fontSize: 11 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {report?.strengthsAr && report.strengthsAr.length > 0 && (
        <Section title="نقاط القوة" items={report.strengthsAr} color="#10b981" />
      )}

      {/* Skill gaps */}
      {report?.skillGapsAr && report.skillGapsAr.length > 0 && (
        <Section title="الفجوات المهارية" items={report.skillGapsAr} color="#f59e0b" />
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: 32, padding: 14, background: 'var(--secondary)', borderRadius: 10, fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center' }}>
        هذه التوصيات إرشاد مهني مبني على إجاباتك ولا تمثّل ضماناً لوظيفة أو قبول في برنامج تدريبي.
      </div>
    </div>
  )
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--foreground)' }}>{title}</h2>
      <ul style={{ paddingRight: 18, margin: 0 }}>
        {items.map((item, i) => <li key={i} style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 5, lineHeight: 1.6 }}>{item}</li>)}
      </ul>
    </div>
  )
}
