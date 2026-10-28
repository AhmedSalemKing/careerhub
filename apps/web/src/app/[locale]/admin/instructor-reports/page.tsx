'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../../lib/api'
import {
  BarChart3,
  Users,
  BookOpen,
  Clock,
  GraduationCap,
  FileSpreadsheet,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react'

interface CourseReport {
  courseId: string
  courseName: string
  lectureCount: number
  totalMinutes: number
  hoursDisplay: string
  lastDeliveredAt: string | null
}

interface InstructorReport {
  instructorId: string
  nameAr: string
  nameEn: string
  email: string
  courses: CourseReport[]
  totalLectures: number
  totalMinutes: number
  hoursDisplay: string
}

interface CollectiveReport {
  generatedAt: string
  totalInstructors: number
  totalLectures: number
  totalMinutes: number
  totalCourses: number
  instructors: InstructorReport[]
}

interface LectureItem {
  id: string
  courseId: string
  courseName: string
  title: string | null
  deliveredAt: string
  durationMinutes: number
  hoursDisplay: string
  status: string
}

interface InstructorOption {
  id: string
  email: string
  accountType: string
  nameAr: string
  nameEn: string
}

interface CourseOption {
  id: string
  titleEn: string
  titleAr?: string | null
}

const STATUSES = ['DRAFT', 'COMPLETED', 'CANCELLED'] as const

const EMPTY_FORM = {
  instructorId: '',
  courseId: '',
  title: '',
  deliveredAt: new Date().toISOString().slice(0, 10),
  durationMinutes: 60,
  status: 'DRAFT' as (typeof STATUSES)[number],
  notes: '',
}

function formatHours(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return `${hours} ساعة`
  if (hours === 0) return `${mins} دقيقة`
  return `${hours} ساعة و${mins} دقيقة`
}

export default function InstructorReportsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [instructors, setInstructors] = useState<InstructorOption[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [report, setReport] = useState<CollectiveReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const [filterInstructor, setFilterInstructor] = useState('')
  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [filterTo, setFilterTo] = useState(() => new Date().toISOString().slice(0, 10))

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [lecturesByInstructor, setLecturesByInstructor] = useState<Record<string, LectureItem[]>>({})
  const [loadingLectures, setLoadingLectures] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    async function loadOptions() {
      try {
        const [instRes, courseRes] = await Promise.all([
          api.get('/instructor-reports/instructors'),
          api.get('/courses?limit=1000'),
        ])
        setInstructors(instRes.data.data ?? [])
        const courseList = courseRes.data.data?.courses ?? courseRes.data.data ?? []
        setCourses(Array.isArray(courseList) ? courseList : [])
      } catch (e) {
        console.error('[InstructorReports] options load error', e)
      }
    }
    loadOptions()
  }, [])

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {}
    if (filterInstructor) params.instructorId = filterInstructor
    if (filterFrom) params.dateFrom = filterFrom
    if (filterTo) params.dateTo = filterTo
    return params
  }, [filterInstructor, filterFrom, filterTo])

  const loadReport = useCallback(async () => {
    setLoading(true)
    setLoaded(false)
    try {
      const res = await api.get('/instructor-reports/report', { params: buildParams() })
      setReport(res.data.data ?? null)
      setLecturesByInstructor({})
    } catch (e) {
      console.error('[InstructorReports] report load error', e)
      setReport(null)
    }
    setLoaded(true)
    setLoading(false)
  }, [buildParams])

  async function toggleDetails(instructorId: string) {
    const next = new Set(expanded)
    if (next.has(instructorId)) {
      next.delete(instructorId)
      setExpanded(next)
      return
    }

    next.add(instructorId)
    setExpanded(next)

    if (!lecturesByInstructor[instructorId]) {
      setLoadingLectures(instructorId)
      try {
        const res = await api.get(`/instructor-reports/report/instructor/${instructorId}`, {
          params: buildParams(),
        })
        const lectures = res.data.data?.lectures ?? []
        setLecturesByInstructor((prev) => ({ ...prev, [instructorId]: lectures }))
      } catch (e) {
        console.error('[InstructorReports] instructor detail error', e)
      }
      setLoadingLectures(null)
    }
  }

  async function exportExcel() {
    setExporting(true)
    try {
      const res = await api.get('/instructor-reports/report/export/xlsx', {
        params: buildParams(),
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `instructor-report-${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('[InstructorReports] export error', e)
    }
    setExporting(false)
  }

  async function exportPdf() {
    setExportingPdf(true)
    try {
      const res = await api.get('/instructor-reports/report/export/pdf', {
        params: buildParams(),
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `instructor-report-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('[InstructorReports] pdf export error', e)
    }
    setExportingPdf(false)
  }

  async function saveLecture() {
    if (!form.instructorId || !form.courseId || !form.deliveredAt || !form.durationMinutes) {
      setFormError(isAr ? 'الرجاء تعبئة الحقول المطلوبة' : 'Please fill the required fields')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await api.post('/instructor-reports/lectures', {
        instructorId: form.instructorId,
        courseId: form.courseId,
        title: form.title || undefined,
        deliveredAt: form.deliveredAt,
        durationMinutes: Number(form.durationMinutes),
        status: form.status,
        notes: form.notes || undefined,
      })
      setShowModal(false)
      setForm({ ...EMPTY_FORM })
      if (loaded) loadReport()
    } catch (e: any) {
      setFormError(e?.response?.data?.message || (isAr ? 'حدث خطأ أثناء الحفظ' : 'Save failed'))
    }
    setSaving(false)
  }

  function instructorName(option: InstructorOption) {
    return option.nameAr || option.nameEn || option.email
  }

  function courseName(course: CourseOption) {
    return course.titleAr || course.titleEn || course.id
  }

  const totals = useMemo(() => {
    if (!report) return { instructors: 0, lectures: 0, minutes: 0, courses: 0 }
    return {
      instructors: report.totalInstructors,
      lectures: report.totalLectures,
      minutes: report.totalMinutes,
      courses: report.totalCourses,
    }
  }, [report])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', direction: isAr ? 'rtl' : 'ltr' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={22} color="#5120C8" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              {isAr ? 'تقارير المحاضرين' : 'Instructor Reports'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
              {isAr
                ? 'بيانات محاضرات وساعات المحاضرين للمحاسبة الخارجية'
                : 'Lecture and hour records for external accounting'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            borderRadius: 9,
            background: '#5120C8',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Plus size={16} />
          {isAr ? 'تسجيل محاضرة' : 'Log Lecture'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          padding: 14,
          borderRadius: 12,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          marginBottom: 20,
        }}
      >
        <div>
          <label style={labelStyle}>{isAr ? 'المحاضر' : 'Instructor'}</label>
          <select value={filterInstructor} onChange={(e) => setFilterInstructor(e.target.value)} style={inputStyle}>
            <option value="">{isAr ? 'الكل' : 'All'}</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {instructorName(i)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>{isAr ? 'من' : 'From'}</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>{isAr ? 'إلى' : 'To'}</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <button
            onClick={loadReport}
            disabled={loading}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: 9,
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (isAr ? 'جاري التحميل...' : 'Loading...') : isAr ? 'عرض التقرير' : 'Show Report'}
          </button>
          <button
            onClick={exportExcel}
            disabled={exporting || !report}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 9,
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              cursor: exporting || !report ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: exporting || !report ? 0.65 : 1,
            }}
          >
            <FileSpreadsheet size={15} />
            {exporting ? (isAr ? 'جاري التصدير...' : 'Exporting...') : isAr ? 'تصدير Excel' : 'Export Excel'}
          </button>
          <button
            onClick={exportPdf}
            disabled={exportingPdf || !report}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 9,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              cursor: exportingPdf || !report ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              opacity: exportingPdf || !report ? 0.65 : 1,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </svg>
            {exportingPdf ? (isAr ? 'جاري التصدير...' : 'Exporting...') : isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>
      </div>

      {loaded && report && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <StatCard icon={Users} label={isAr ? 'إجمالي المحاضرين' : 'Instructors'} value={totals.instructors} />
            <StatCard icon={BookOpen} label={isAr ? 'إجمالي المحاضرات' : 'Lectures'} value={totals.lectures} />
            <StatCard
              icon={Clock}
              label={isAr ? 'إجمالي الساعات' : 'Total Hours'}
              value={formatHours(totals.minutes)}
            />
            <StatCard icon={GraduationCap} label={isAr ? 'عدد الدورات' : 'Courses'} value={totals.courses} />
          </div>

          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>{isAr ? 'اسم المحاضر' : 'Instructor'}</th>
                  <th style={thStyle}>{isAr ? 'عدد الدورات' : 'Courses'}</th>
                  <th style={thStyle}>{isAr ? 'عدد المحاضرات' : 'Lectures'}</th>
                  <th style={thStyle}>{isAr ? 'إجمالي الساعات' : 'Total Hours'}</th>
                  <th style={thStyle}>{isAr ? 'تفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {report.instructors.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 56, textAlign: 'center', color: 'var(--muted)' }}>
                      {isAr ? 'لا توجد محاضرات مكتملة في هذه الفترة' : 'No completed lectures in this period'}
                    </td>
                  </tr>
                )}

                {report.instructors.map((instructor) => {
                  const isOpen = expanded.has(instructor.instructorId)
                  const lectures = lecturesByInstructor[instructor.instructorId]

                  return (
                    <>
                      <tr key={instructor.instructorId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700 }}>{instructor.nameAr}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{instructor.email}</div>
                        </td>
                        <td style={tdStyle}>{instructor.courses.length}</td>
                        <td style={tdStyle}>{instructor.totalLectures}</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: '#5120C8' }}>{instructor.hoursDisplay}</td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => toggleDetails(instructor.instructorId)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--foreground)',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {isOpen ? (isAr ? 'إخفاء' : 'Hide') : isAr ? 'عرض' : 'Show'}
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0, background: 'rgba(81,32,200,0.03)' }}>
                            <div style={{ padding: '14px 18px' }}>
                              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                                {isAr ? 'تفصيل الدورات' : 'Course breakdown'}
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={subThStyle}>{isAr ? 'الدورة' : 'Course'}</th>
                                    <th style={subThStyle}>{isAr ? 'عدد المحاضرات' : 'Lectures'}</th>
                                    <th style={subThStyle}>{isAr ? 'إجمالي الساعات' : 'Hours'}</th>
                                    <th style={subThStyle}>{isAr ? 'آخر محاضرة' : 'Last Lecture'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {instructor.courses.map((course) => (
                                    <tr key={course.courseId} style={{ borderBottom: '1px solid var(--border)' }}>
                                      <td style={subTdStyle}>{course.courseName}</td>
                                      <td style={subTdStyle}>{course.lectureCount}</td>
                                      <td style={subTdStyle}>{course.hoursDisplay}</td>
                                      <td style={subTdStyle}>
                                        {course.lastDeliveredAt
                                          ? new Date(course.lastDeliveredAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')
                                          : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div style={{ fontSize: 13, fontWeight: 800, margin: '16px 0 10px' }}>
                                {isAr ? 'سجل المحاضرات' : 'Lecture log'}
                              </div>
                              {loadingLectures === instructor.instructorId && (
                                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                                  {isAr ? 'جاري التحميل...' : 'Loading...'}
                                </div>
                              )}
                              {lectures && lectures.length === 0 && (
                                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                                  {isAr ? 'لا توجد محاضرات' : 'No lectures'}
                                </div>
                              )}
                              {lectures && lectures.length > 0 && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                      <th style={subThStyle}>{isAr ? 'التاريخ' : 'Date'}</th>
                                      <th style={subThStyle}>{isAr ? 'الدورة' : 'Course'}</th>
                                      <th style={subThStyle}>{isAr ? 'العنوان' : 'Title'}</th>
                                      <th style={subThStyle}>{isAr ? 'المدة' : 'Duration'}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lectures.map((lecture) => (
                                      <tr key={lecture.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={subTdStyle}>
                                          {lecture.deliveredAt
                                            ? new Date(lecture.deliveredAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')
                                            : '—'}
                                        </td>
                                        <td style={subTdStyle}>{lecture.courseName}</td>
                                        <td style={subTdStyle}>{lecture.title || '-'}</td>
                                        <td style={subTdStyle}>{lecture.hoursDisplay}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loaded && !loading && (
        <div
          style={{
            padding: '70px 24px',
            textAlign: 'center',
            borderRadius: 12,
            border: '1px dashed var(--border)',
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          <ListChecks size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
          {isAr ? 'اختر الفلاتر واضغط "عرض التقرير"' : 'Choose filters and press "Show Report"'}
        </div>
      )}

      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 26,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                {isAr ? 'تسجيل محاضرة جديدة' : 'Log New Lecture'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)',
                  color: '#b91c1c',
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {formError}
              </div>
            )}

            <label style={labelStyle}>{isAr ? 'المحاضر *' : 'Instructor *'}</label>
            <select
              value={form.instructorId}
              onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            >
              <option value="">{isAr ? 'اختر المحاضر' : 'Select instructor'}</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {instructorName(i)}
                </option>
              ))}
            </select>

            <label style={labelStyle}>{isAr ? 'الدورة *' : 'Course *'}</label>
            <select
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            >
              <option value="">{isAr ? 'اختر الدورة' : 'Select course'}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {courseName(c)}
                </option>
              ))}
            </select>

            <label style={labelStyle}>{isAr ? 'عنوان المحاضرة' : 'Lecture Title'}</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={isAr ? 'اختياري' : 'Optional'}
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <label style={labelStyle}>{isAr ? 'تاريخ المحاضرة *' : 'Delivered Date *'}</label>
            <input
              type="date"
              value={form.deliveredAt}
              onChange={(e) => setForm((f) => ({ ...f, deliveredAt: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <label style={labelStyle}>{isAr ? 'المدة (دقيقة) *' : 'Duration (minutes) *'}</label>
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
              style={{ ...inputStyle, marginBottom: 4 }}
            />
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              {formatHours(Number(form.durationMinutes) || 0)}
            </div>

            <label style={labelStyle}>{isAr ? 'الحالة' : 'Status'}</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {isAr
                    ? status === 'DRAFT'
                      ? 'مسودة'
                      : status === 'COMPLETED'
                        ? 'مكتملة'
                        : 'ملغاة'
                    : status}
                </option>
              ))}
            </select>

            <label style={labelStyle}>{isAr ? 'ملاحظات' : 'Notes'}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, marginBottom: 18, resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveLecture}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 9,
                  background: '#5120C8',
                  color: '#fff',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? '...' : isAr ? 'حفظ' : 'Save'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 9,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string | number
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: 'rgba(81,32,200,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color="#5120C8" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--muted)',
  marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--foreground)',
  fontSize: 13,
  boxSizing: 'border-box',
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'right',
  fontSize: 12,
  fontWeight: 800,
  color: 'var(--muted)',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
}

const subThStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'right',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--muted)',
}

const subTdStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
}
