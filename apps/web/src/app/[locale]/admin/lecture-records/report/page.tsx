'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../../../lib/api'
import {
  BarChart3,
  Users,
  BookOpen,
  Clock,
  GraduationCap,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
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
  id: string
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

interface UserOption {
  id: string
  profile?: { firstName?: string | null; lastName?: string | null } | null
  email: string
}

export default function LectureReportPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [report, setReport] = useState<CollectiveReport | null>(null)
  const [instructors, setInstructors] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [filterInstructor, setFilterInstructor] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    async function loadInstructors() {
      try {
        const [r1, r2] = await Promise.all([
          api.get('/users?role=INSTRUCTOR&limit=1000'),
          api.get('/users?role=CONSULTANT&limit=1000'),
        ])
        setInstructors([...(r1.data.data ?? []), ...(r2.data.data ?? [])])
      } catch (e) {
        console.error('[LectureReport] instructors load error', e)
      }
    }
    loadInstructors()
  }, [])

  async function loadReport() {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterInstructor) params.instructorId = filterInstructor
      if (filterDateFrom) params.from = filterDateFrom
      if (filterDateTo) params.to = filterDateTo

      const res = await api.get('/lecture-records/report', { params })
      setReport(res.data.data ?? null)
    } catch (e) {
      console.error('[LectureReport] report load error', e)
    }
    setLoading(false)
  }

  function exportExcel() {
    const params = new URLSearchParams()
    if (filterInstructor) params.set('instructorId', filterInstructor)
    if (filterDateFrom) params.set('from', filterDateFrom)
    if (filterDateTo) params.set('to', filterDateTo)

    const url = `${api.defaults.baseURL}/lecture-records/report/export/xlsx?${params.toString()}`
    window.open(url, '_blank')
  }

  function toggleExpand(id: string) {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  function getInstructorName(user?: UserOption | null) {
    const firstName = user?.profile?.firstName ?? ''
    const lastName = user?.profile?.lastName ?? ''
    const name = [firstName, lastName].filter(Boolean).join(' ').trim()
    return name || user?.email || (isAr ? 'غير معروف' : 'Unknown')
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={22} color="#5120C8" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isAr ? 'تقارير المحاضرين' : 'Lecture Reports'}</h1>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20, padding: 14, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>{isAr ? 'المحاضر' : 'Instructor'}</label>
          <select value={filterInstructor} onChange={(e) => setFilterInstructor(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13 }}>
            <option value="">{isAr ? 'الكل' : 'All'}</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{getInstructorName(i)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>{isAr ? 'من' : 'From'}</label>
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>{isAr ? 'إلى' : 'To'}</label>
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <button onClick={loadReport} style={{ flex: 1, padding: '8px 16px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {isAr ? 'عرض التقرير' : 'Show Report'}
          </button>
          <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}>
            <FileSpreadsheet size={16} />
            {isAr ? 'تصدير Excel' : 'Export Excel'}
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard icon={Users} label={isAr ? 'إجمالي المحاضرين' : 'Total Instructors'} value={report.totalInstructors} />
            <StatCard icon={BookOpen} label={isAr ? 'إجمالي المحاضرات' : 'Total Lectures'} value={report.totalLectures} />
            <StatCard icon={Clock} label={isAr ? 'إجمالي الساعات' : 'Total Hours'} value={formatHours(report.totalMinutes, isAr)} />
            <StatCard icon={GraduationCap} label={isAr ? 'عدد الدورات' : 'Total Courses'} value={report.totalCourses} />
          </div>

          {/* Report Table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'اسم المحاضر' : 'Instructor Name'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'عدد الدورات' : 'Courses'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'عدد المحاضرات' : 'Lectures'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'إجمالي الساعات' : 'Total Hours'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'تفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {report.instructors.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>{isAr ? 'لا توجد بيانات' : 'No data'}</td>
                  </tr>
                )}
                {report.instructors.map((inst) => {
                  const isExpanded = expanded.has(inst.id)
                  return (
                    <>
                      <tr key={inst.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{inst.nameAr}</td>
                        <td style={{ padding: '12px 16px' }}>{inst.courses.length}</td>
                        <td style={{ padding: '12px 16px' }}>{inst.totalLectures}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#5120C8' }}>{inst.hoursDisplay}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => toggleExpand(inst.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}>
                            {isExpanded ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'عرض' : 'Show')}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0, background: 'rgba(81,32,200,0.03)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                  <th style={{ padding: '10px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: 'var(--muted)' }}>{isAr ? 'الدورة' : 'Course'}</th>
                                  <th style={{ padding: '10px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: 'var(--muted)' }}>{isAr ? 'عدد المحاضرات' : 'Lectures'}</th>
                                  <th style={{ padding: '10px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: 'var(--muted)' }}>{isAr ? 'إجمالي الساعات' : 'Total Hours'}</th>
                                  <th style={{ padding: '10px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: 'var(--muted)' }}>{isAr ? 'آخر محاضرة' : 'Last Lecture'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inst.courses.map((course) => (
                                  <tr key={course.courseId} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px 16px' }}>{course.courseName}</td>
                                    <td style={{ padding: '10px 16px' }}>{course.lectureCount}</td>
                                    <td style={{ padding: '10px 16px' }}>{course.hoursDisplay}</td>
                                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                                      {course.lastDeliveredAt ? new Date(course.lastDeliveredAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB') : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color="#5120C8" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>{value}</div>
      </div>
    </div>
  )
}

function formatHours(totalMinutes: number, isAr: boolean): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return `${hours} ${isAr ? 'ساعة' : 'hr'}`
  if (hours === 0) return `${mins} ${isAr ? 'دقيقة' : 'min'}`
  return `${hours} ${isAr ? 'ساعة و' : 'hr '}${mins} ${isAr ? 'دقيقة' : 'min'}`
}
