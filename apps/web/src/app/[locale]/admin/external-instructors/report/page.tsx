'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '../../../../../lib/api'
import { BarChart2, Download, ArrowRight, Filter } from 'lucide-react'

interface CourseSummary {
  courseId: string
  courseTitle: string
  lectureCount: number
  totalHours: number
}

interface InstructorReport {
  instructorId: string
  instructorName: string
  courses: CourseSummary[]
  totalLectures: number
  totalHours: number
}

interface Instructor { id: string; name: string }

export default function ExternalInstructorsReportPage() {
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'
  const [report, setReport] = useState<InstructorReport[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filter, setFilter] = useState({ instructorId: '', courseId: '', dateFrom: '', dateTo: '' })

  async function loadInstructors() {
    try {
      const res = await api.get('/external-instructors')
      setInstructors(res.data.data ?? [])
    } catch {}
  }

  useEffect(() => { loadInstructors(); runReport() }, [])

  async function runReport() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.instructorId) params.set('instructorId', filter.instructorId)
      if (filter.courseId) params.set('courseId', filter.courseId)
      if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
      if (filter.dateTo) params.set('dateTo', filter.dateTo)
      const res = await api.get(`/external-instructors/report?${params}`)
      setReport(res.data.data ?? [])
    } catch {}
    setLoading(false)
  }

  async function exportFile(type: 'xlsx' | 'pdf') {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filter.instructorId) params.set('instructorId', filter.instructorId)
      if (filter.courseId) params.set('courseId', filter.courseId)
      if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
      if (filter.dateTo) params.set('dateTo', filter.dateTo)
      const token = localStorage.getItem('deveway_token') ?? ''
      const baseUrl = (api.defaults.baseURL ?? '').replace(/\/$/, '')
      const url = `${baseUrl}/external-instructors/report/export/${type}?${params}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `report.${type}`
      a.click()
    } catch {}
    setExporting(false)
  }

  const grandTotal = report.reduce((s, r) => ({ lectures: s.lectures + r.totalLectures, hours: s.hours + r.totalHours }), { lectures: 0, hours: 0 })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#5120C8', fontWeight: 600 }}>
        <ArrowRight size={16} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
        {isAr ? 'رجوع' : 'Back'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart2 size={22} color="#5120C8" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isAr ? 'تقرير المدربين الخارجيين' : 'External Instructors Report'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportFile('xlsx')} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={() => exportFile('pdf')} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'المدرب' : 'Instructor'}</label>
          <select value={filter.instructorId} onChange={e => setFilter(f => ({ ...f, instructorId: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, minWidth: 160 }}>
            <option value="">{isAr ? 'الكل' : 'All'}</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'معرف الكورس' : 'Course ID'}</label>
          <input value={filter.courseId} onChange={e => setFilter(f => ({ ...f, courseId: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, width: 140 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'من' : 'From'}</label>
          <input type="date" value={filter.dateFrom} onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'إلى' : 'To'}</label>
          <input type="date" value={filter.dateTo} onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13 }} />
        </div>
        <button onClick={runReport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          <Filter size={14} />
          {isAr ? 'تطبيق' : 'Apply'}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 24px', flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#5120C8' }}>{report.length}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{isAr ? 'مدرب' : 'Instructors'}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 24px', flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{grandTotal.lectures}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{isAr ? 'محاضرة مكتملة' : 'Completed Lectures'}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 24px', flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{grandTotal.hours.toFixed(1)}h</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{isAr ? 'إجمالي الساعات' : 'Total Hours'}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>...</div>
      ) : report.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          {isAr ? 'لا توجد بيانات بالفلاتر المحددة' : 'No data for selected filters'}
        </div>
      ) : (
        report.map(inst => (
          <div key={inst.instructorId} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{inst.instructorName}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{inst.totalLectures} {isAr ? 'محاضرة' : 'lectures'}</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{inst.totalHours}h</span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: isAr ? 'right' : 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>{isAr ? 'الكورس' : 'Course'}</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>{isAr ? 'المحاضرات' : 'Lectures'}</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }}>{isAr ? 'الساعات' : 'Hours'}</th>
                </tr>
              </thead>
              <tbody>
                {inst.courses.map(c => (
                  <tr key={c.courseId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 8px' }}>{c.courseTitle}</td>
                    <td style={{ textAlign: 'center', padding: '8px 8px' }}>{c.lectureCount}</td>
                    <td style={{ textAlign: 'center', padding: '8px 8px' }}>{c.totalHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
