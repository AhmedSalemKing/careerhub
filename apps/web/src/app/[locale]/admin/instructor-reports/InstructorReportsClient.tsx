'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../../lib/api'
import { formatMoney } from '../../../../lib/market'
import {
  BarChart3,
  Users,
  BookOpen,
  Clock,
  FileSpreadsheet,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react'

interface LessonDetail {
  lessonId: string
  lessonTitle: string
  durationMinutes: number
  lessonDate: string | Date | null
  lessonStatus?: string
  typeBadge?: string
}

interface LiveSessionDetail {
  sessionId: string
  sessionTitle: string
  sessionDate: string | Date | null
  actualDurationMinutes: number
  sessionStatus: string
}

interface CourseReport {
  courseId: string
  courseName: string
  courseTitle?: string
  courseStatus?: string
  coursePrice?: number
  courseCurrency?: string
  lessonCount: number
  liveSessionCount?: number
  enrolledStudents?: number
  paidEnrollments?: number
  freeEnrollments?: number
  grossSales?: number
  grossSalesDisplay?: string
  refunds?: number
  netRevenue?: number
  publishedAt?: string | Date | null
  createdAt?: string | Date | null
  lectureCount: number
  totalMinutes: number
  hoursDisplay: string
  lastDeliveredAt: string | null
  lessons?: LessonDetail[]
  liveSessions?: LiveSessionDetail[]
}

interface InstructorReport {
  instructorId: string
  nameAr: string
  nameEn: string
  email: string
  courseCount?: number
  totalLessons?: number
  totalLiveSessions?: number
  totalTeachingMinutes?: number
  totalStudents?: number
  totalRevenue?: number
  totalRevenueDisplay?: string
  courses: CourseReport[]
  totalLectures: number
  totalMinutes: number
  hoursDisplay: string
}

interface ConsultantSessionDetail {
  sessionId: string
  sessionTitle: string
  topic?: string
  clientName?: string
  scheduledAt?: string | Date | null
  actualStartedAt?: string | Date | null
  actualEndedAt?: string | Date | null
  actualDurationMinutes: number
  sessionStatus: string
  sessionPrice?: number
  currency?: string
  paymentStatus?: string
  paidAmount?: number
  paidAmountDisplay?: string
  refundAmount?: number
}

interface ConsultantReport {
  consultantId: string
  nameAr: string
  nameEn: string
  email: string
  sessionCount: number
  completedCount: number
  cancelledCount: number
  totalActualMinutes: number
  hoursDisplay: string
  totalClients: number
  grossCollected: number
  refunds: number
  netAmount: number
  sessions: ConsultantSessionDetail[]
}

interface CollectiveReport {
  generatedAt: string
  totalInstructors: number
  totalLectures: number
  totalMinutes: number
  totalCourses: number
  instructors: InstructorReport[]
  consultants?: ConsultantReport[]
  totalConsultants?: number
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
  type?: 'live' | 'consulting' | 'manual' | 'lesson'
  activityLabel?: string
  instructorRole?: string
  sessionStatus?: string
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
  if (!totalMinutes || totalMinutes <= 0) return '—'
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return `${hours} ساعة`
  if (hours === 0) return `${mins} دقيقة`
  return `${hours} ساعة و${mins} دقيقة`
}

function safeDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  if (d.getFullYear() === 1970) return '—'
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function InstructorReportsClient({ country }: { country: string }) {
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
  const [expandedConsultants, setExpandedConsultants] = useState<Set<string>>(new Set())
  const [lecturesByInstructor, setLecturesByInstructor] = useState<Record<string, LectureItem[]>>({})
  const [loadingLectures, setLoadingLectures] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const activeCurrency: 'SAR' | 'EGP' = country === 'EG' ? 'EGP' : 'SAR'

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
    if (activeCurrency === 'EGP') params.country = 'EG'
    return params
  }, [filterInstructor, filterFrom, filterTo, activeCurrency])

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
      alert(isAr ? 'حدث خطأ أثناء تصدير Excel' : 'Error exporting Excel')
    } finally {
      setExporting(false)
    }
  }

  async function exportPdf() {
    setExportingPdf(true)
    try {
      const res = await api.get('/instructor-reports/report/export/pdf', {
        params: buildParams(),
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `instructor-report-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('[InstructorReports] pdf export error', e)
      alert(isAr ? 'حدث خطأ أثناء تصدير PDF' : 'Error exporting PDF')
    } finally {
      setExportingPdf(false)
    }
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
    if (!report) return { instructors: 0, courses: 0, sessions: 0, minutes: 0 }
    const instructorCourses = report.instructors?.reduce((sum, inst) => {
      const c = (inst as any).courseCount ?? inst.courses?.filter((x: any) => x.courseId !== '__consulting__').length ?? 0
      return sum + c
    }, 0) || report.totalCourses || 0
    const sessionsCount = report.consultants?.reduce((sum, c) => sum + (c.sessionCount || 0), 0) || 0
    return {
      instructors: report.totalInstructors || report.instructors?.length || 0,
      courses: report.totalCourses ?? instructorCourses,
      sessions: sessionsCount,
      minutes: report.totalMinutes,
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
            <StatCard icon={Users} label={isAr ? 'عدد المحاضرين' : 'Instructors'} value={totals.instructors} />
            <StatCard icon={BookOpen} label={isAr ? 'عدد الكورسات' : 'Courses'} value={totals.courses} />
            <StatCard icon={ListChecks} label={isAr ? 'عدد الجلسات' : 'Sessions'} value={totals.sessions} />
            <StatCard
              icon={Clock}
              label={isAr ? 'إجمالي الساعات' : 'Total Hours'}
              value={formatHours(totals.minutes)}
            />
          </div>

          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            <div style={{ padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', fontWeight: 800 }}>
              {isAr ? 'قسم المحاضرين' : 'Instructors'}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>{isAr ? 'اسم المحاضر' : 'Instructor'}</th>
                  <th style={thStyle}>{isAr ? 'عدد الكورسات' : 'Courses'}</th>
                  <th style={thStyle}>{isAr ? 'إجمالي الدروس' : 'Lessons'}</th>
                  <th style={thStyle}>{isAr ? 'إجمالي ساعات التدريس' : 'Teaching Hours'}</th>
                  <th style={thStyle}>{isAr ? 'الطلاب' : 'Students'}</th>
                  <th style={thStyle}>{isAr ? 'الإيرادات' : 'Revenue'}</th>
                  <th style={thStyle}>{isAr ? 'تفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {(!report.instructors || report.instructors.length === 0) && (
                  <tr>
                    <td colSpan={7} style={{ padding: 56, textAlign: 'center', color: 'var(--muted)' }}>
                      {isAr ? 'لا توجد كورسات منشورة' : 'No published courses'}
                    </td>
                  </tr>
                )}

                {(report.instructors || []).map((instructor) => {
                  const isOpen = expanded.has(instructor.instructorId)
                  const lectures = lecturesByInstructor[instructor.instructorId]
                  const courseCount = (instructor as any).courseCount ?? instructor.courses?.filter((c:any)=>c.courseId !== '__consulting__').length ?? 0
                  const totalLessons = (instructor as any).totalLessons ?? instructor.courses?.reduce((s:any,c:any)=>s + (c.lessonCount || c.lectureCount || 0), 0) ?? instructor.totalLectures
                  const totalStudents = (instructor as any).totalStudents ?? 0
                  const totalRevenue = (instructor as any).totalRevenue ?? 0

                  return (
                    <>
                      <tr key={instructor.instructorId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700 }}>{instructor.nameAr}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{instructor.email}</div>
                        </td>
                        <td style={tdStyle}>{courseCount}</td>
                        <td style={tdStyle}>{totalLessons}</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: '#5120C8' }}>{instructor.hoursDisplay}</td>
                        <td style={tdStyle}>{totalStudents}</td>
                        <td style={tdStyle}>{formatMoney(totalRevenue, (instructor as any).totalRevenueDisplay)}</td>
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
                          <td colSpan={7} style={{ padding: 0, background: 'rgba(81,32,200,0.03)' }}>
                            <div style={{ padding: '14px 18px' }}>
                              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                                {isAr ? 'تفصيل الكورسات' : 'Course breakdown'}
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={subThStyle}>{isAr ? 'اسم الكورس' : 'Course'}</th>
                                    <th style={subThStyle}>{isAr ? 'عدد الدروس' : 'Lessons'}</th>
                                    <th style={subThStyle}>{isAr ? 'المدة' : 'Duration'}</th>
                                    <th style={subThStyle}>{isAr ? 'الطلاب' : 'Students'}</th>
                                    <th style={subThStyle}>{isAr ? 'الإيرادات' : 'Revenue'}</th>
                                    <th style={subThStyle}>{isAr ? 'تاريخ النشر' : 'Published'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {instructor.courses.filter((c:any)=>c.courseId !== '__consulting__').map((course: any) => (
                                    <tr key={course.courseId} style={{ borderBottom: '1px solid var(--border)' }}>
                                      <td style={subTdStyle}>{course.courseName || course.courseTitle}</td>
                                      <td style={subTdStyle}>{course.lessonCount || course.lessons?.length || course.lectureCount || 0}</td>
                                      <td style={subTdStyle}>{course.hoursDisplay}</td>
                                      <td style={subTdStyle}>{course.enrolledStudents ?? 0}</td>
                                      <td style={subTdStyle}>{formatMoney(course.grossSales ?? course.netRevenue, course.grossSalesDisplay)}</td>
                                      <td style={subTdStyle}>{safeDate(course.publishedAt || course.lastDeliveredAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div style={{ fontSize: 13, fontWeight: 800, margin: '16px 0 10px' }}>
                                {isAr ? 'تفصيل الدروس' : 'Lessons'}
                              </div>
                              {(instructor.courses.filter((c:any)=>c.courseId !== '__consulting__').some((c:any)=>(c.lessons && c.lessons.length>0))) ? (
                                instructor.courses.filter((c:any)=>c.courseId !== '__consulting__').map((course:any)=>(
                                  course.lessons && course.lessons.length>0 && (
                                    <div key={course.courseId} style={{ marginBottom: 16 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{course.courseName || course.courseTitle}</div>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={subThStyle}>{isAr ? 'عنوان الدرس' : 'Lesson'}</th>
                                            <th style={subThStyle}>{isAr ? 'المدة' : 'Duration'}</th>
                                            <th style={subThStyle}>{isAr ? 'التاريخ' : 'Date'}</th>
                                            <th style={subThStyle}>{isAr ? 'النوع' : 'Type'}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {course.lessons.map((lesson:any)=>(
                                            <tr key={lesson.lessonId} style={{ borderBottom: '1px solid var(--border)' }}>
                                              <td style={subTdStyle}>{lesson.lessonTitle}</td>
                                              <td style={subTdStyle}>{lesson.durationMinutes > 0 ? `${lesson.durationMinutes} ${isAr ? 'دقيقة' : 'min'}` : '—'}</td>
                                              <td style={subTdStyle}>{safeDate(lesson.lessonDate)}</td>
                                              <td style={subTdStyle}>{lesson.typeBadge || (isAr ? 'مسجل' : 'Recorded')}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )
                                ))
                              ) : (
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isAr ? 'لا توجد دروس' : 'No lessons'}</div>
                              )}

                              {lectures && lectures.length > 0 && (
                                <>
                                  <div style={{ fontSize: 13, fontWeight: 800, margin: '16px 0 10px' }}>
                                    {isAr ? 'سجل المحاضرات' : 'Lecture Log'}
                                  </div>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={subThStyle}>{isAr ? 'العنوان' : 'Title'}</th>
                                        <th style={subThStyle}>{isAr ? 'التاريخ' : 'Date'}</th>
                                        <th style={subThStyle}>{isAr ? 'المدة' : 'Duration'}</th>
                                        <th style={subThStyle}>{isAr ? 'النوع' : 'Type'}</th>
                                        <th style={subThStyle}>{isAr ? 'الحالة' : 'Status'}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {lectures.map((lec) => (
                                        <tr key={lec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                          <td style={subTdStyle}>{lec.title || lec.courseName}</td>
                                          <td style={subTdStyle}>{safeDate(lec.deliveredAt)}</td>
                                          <td style={subTdStyle}>{lec.durationMinutes > 0 ? `${lec.durationMinutes} ${isAr ? 'دقيقة' : 'min'}` : '—'}</td>
                                          <td style={subTdStyle}>{lec.activityLabel || lec.type || '—'}</td>
                                          <td style={subTdStyle}>{lec.status}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </>
                              )}
                              {loadingLectures === instructor.instructorId && (
                                <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>
                                  {isAr ? 'جاري التحميل...' : 'Loading...'}
                                </div>
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

          {report.consultants && report.consultants.length > 0 && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              <div style={{ padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', fontWeight: 800 }}>
                {isAr ? 'قسم الاستشاريين' : 'Consultants'}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>{isAr ? 'اسم الاستشاري' : 'Consultant'}</th>
                    <th style={thStyle}>{isAr ? 'عدد الجلسات' : 'Sessions'}</th>
                    <th style={thStyle}>{isAr ? 'مكتملة' : 'Completed'}</th>
                    <th style={thStyle}>{isAr ? 'ملغاة' : 'Cancelled'}</th>
                    <th style={thStyle}>{isAr ? 'إجمالي الساعات' : 'Total Hours'}</th>
                    <th style={thStyle}>{isAr ? 'تفاصيل' : 'Details'}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.consultants.map((consultant) => {
                    const isOpen = expandedConsultants.has(consultant.consultantId)
                    const toggleConsultant = () =>
                      setExpandedConsultants((prev) => {
                        const next = new Set(prev)
                        if (next.has(consultant.consultantId)) next.delete(consultant.consultantId)
                        else next.add(consultant.consultantId)
                        return next
                      })
                    return (
                      <>
                        <tr key={consultant.consultantId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700 }}>{consultant.nameAr || consultant.nameEn}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{consultant.email}</div>
                          </td>
                          <td style={tdStyle}>{consultant.sessionCount}</td>
                          <td style={tdStyle}>{consultant.completedCount}</td>
                          <td style={tdStyle}>{consultant.cancelledCount}</td>
                          <td style={{ ...tdStyle, fontWeight: 800, color: '#5120C8' }}>{consultant.hoursDisplay}</td>
                          <td style={tdStyle}>
                            <button
                              onClick={toggleConsultant}
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
                        {isOpen && consultant.sessions && consultant.sessions.length > 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: 0, background: 'rgba(81,32,200,0.03)' }}>
                              <div style={{ padding: '14px 18px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                      <th style={subThStyle}>{isAr ? 'عنوان الجلسة' : 'Session'}</th>
                                      <th style={subThStyle}>{isAr ? 'الموضوع' : 'Topic'}</th>
                                      <th style={subThStyle}>{isAr ? 'التاريخ' : 'Date'}</th>
                                      <th style={subThStyle}>{isAr ? 'المدة' : 'Duration'}</th>
                                      <th style={subThStyle}>{isAr ? 'الحالة' : 'Status'}</th>
                                      <th style={subThStyle}>{isAr ? 'المبلغ' : 'Amount'}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {consultant.sessions.map((session) => (
                                      <tr key={session.sessionId} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={subTdStyle}>{session.sessionTitle}</td>
                                        <td style={subTdStyle}>{session.topic || '—'}</td>
                                        <td style={subTdStyle}>{safeDate(session.scheduledAt as string | null)}</td>
                                        <td style={subTdStyle}>{session.actualDurationMinutes > 0 ? `${session.actualDurationMinutes} ${isAr ? 'دقيقة' : 'min'}` : '—'}</td>
                                        <td style={subTdStyle}>{session.sessionStatus}</td>
                                        <td style={subTdStyle}>{formatMoney(session.paidAmount, session.paidAmountDisplay)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
          )}
        </>
      )}

      {loaded && !loading && report && (!report.instructors || report.instructors.length === 0) && (!report.consultants || report.consultants.length === 0) && (
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
          {isAr ? 'لا يوجد نشاط في الفترة المحددة' : 'No activity in the selected period'}
        </div>
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
