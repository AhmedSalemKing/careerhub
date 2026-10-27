'use client'
import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../../lib/api'
import {
  Presentation,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
} from 'lucide-react'

interface User {
  id: string
  email: string
  accountType: string
  profile?: { firstName?: string | null; lastName?: string | null } | null
}

interface Course {
  id: string
  titleEn: string
  titleAr?: string | null
}

interface LectureRecord {
  id: string
  instructorId: string
  courseId: string
  title?: string | null
  deliveredAt: string
  durationMinutes: number
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED'
  notes?: string | null
  instructor: {
    id: string
    email: string
    profile?: { firstName?: string | null; lastName?: string | null } | null
  }
  course: {
    id: string
    titleEn: string
    titleAr?: string | null
  }
}

const STATUS_LABELS: Record<string, { ar: string; color: string; bg: string }> = {
  DRAFT: { ar: 'مسودة', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  COMPLETED: { ar: 'مكتملة', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  CANCELLED: { ar: 'ملغاة', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const EMPTY_FORM = {
  instructorId: '',
  courseId: '',
  title: '',
  deliveredAt: '',
  durationMinutes: 60,
  status: 'DRAFT' as LectureRecord['status'],
  notes: '',
}

export default function LectureRecordsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [records, setRecords] = useState<LectureRecord[]>([])
  const [instructors, setInstructors] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<LectureRecord | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const [filterInstructor, setFilterInstructor] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [recRes, instRes, courseRes] = await Promise.all([
        api.get('/lecture-records'),
        Promise.all([api.get('/users?role=INSTRUCTOR&limit=1000'), api.get('/users?role=CONSULTANT&limit=1000')]).then(
          ([r1, r2]) => [...(r1.data.data ?? []), ...(r2.data.data ?? [])]
        ),
        api.get('/courses?limit=1000'),
      ])
      setRecords(recRes.data.data?.records ?? [])
      setInstructors(instRes)
      setCourses(courseRes.data.data?.courses ?? courseRes.data.data ?? [])
    } catch (e) {
      console.error('[LectureRecords] load error', e)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterInstructor && r.instructorId !== filterInstructor) return false
      if (filterCourse && r.courseId !== filterCourse) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (filterDateFrom && new Date(r.deliveredAt) < new Date(filterDateFrom)) return false
      if (filterDateTo && new Date(r.deliveredAt) > new Date(filterDateTo + 'T23:59:59')) return false
      return true
    })
  }, [records, filterInstructor, filterCourse, filterStatus, filterDateFrom, filterDateTo])

  function getInstructorName(user?: { profile?: { firstName?: string | null; lastName?: string | null } | null; email?: string } | null) {
    const firstName = user?.profile?.firstName ?? ''
    const lastName = user?.profile?.lastName ?? ''
    const name = [firstName, lastName].filter(Boolean).join(' ').trim()
    return name || user?.email || (isAr ? 'غير معروف' : 'Unknown')
  }

  function getCourseName(course?: { titleAr?: string | null; titleEn?: string } | null) {
    return course?.titleAr || course?.titleEn || (isAr ? 'غير معروف' : 'Unknown')
  }

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m} ${isAr ? 'دقيقة' : 'min'}`
    if (m === 0) return `${h} ${isAr ? 'ساعة' : 'hr'}`
    return `${h} ${isAr ? 'ساعة و' : 'hr '}${m} ${isAr ? 'دقيقة' : 'min'}`
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(record: LectureRecord) {
    setEditing(record)
    setForm({
      instructorId: record.instructorId,
      courseId: record.courseId,
      title: record.title ?? '',
      deliveredAt: record.deliveredAt.slice(0, 10),
      durationMinutes: record.durationMinutes,
      status: record.status,
      notes: record.notes ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.instructorId || !form.courseId || !form.deliveredAt) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
      }
      if (editing) {
        await api.patch(`/lecture-records/${editing.id}`, payload)
      } else {
        await api.post('/lecture-records', payload)
      }
      setShowForm(false)
      loadData()
    } catch (e) {
      console.error('[LectureRecords] save error', e)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm(isAr ? 'هل تريد حذف هذا السجل؟' : 'Delete this record?')) return
    try {
      await api.delete(`/lecture-records/${id}`)
      loadData()
    } catch (e) {
      console.error('[LectureRecords] delete error', e)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Presentation size={22} color="#5120C8" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isAr ? 'سجل المحاضرات' : 'Lecture Records'}</h1>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} />
          {isAr ? 'إضافة محاضرة' : 'Add Lecture'}
        </button>
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
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>{isAr ? 'الدورة' : 'Course'}</label>
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13 }}>
            <option value="">{isAr ? 'الكل' : 'All'}</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{getCourseName(c)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>{isAr ? 'الحالة' : 'Status'}</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13 }}>
            <option value="">{isAr ? 'الكل' : 'All'}</option>
            <option value="DRAFT">{isAr ? 'مسودة' : 'Draft'}</option>
            <option value="COMPLETED">{isAr ? 'مكتملة' : 'Completed'}</option>
            <option value="CANCELLED">{isAr ? 'ملغاة' : 'Cancelled'}</option>
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
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'المحاضر' : 'Instructor'}</th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'الدورة' : 'Course'}</th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'التاريخ' : 'Date'}</th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'المدة' : 'Duration'}</th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'الحالة' : 'Status'}</th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700, color: 'var(--muted)' }}>{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>{isAr ? 'لا توجد سجلات' : 'No records found'}</td>
                </tr>
              )}
              {filteredRecords.map((record) => {
                const status = STATUS_LABELS[record.status] || STATUS_LABELS.DRAFT
                return (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>{getInstructorName(record.instructor)}</td>
                    <td style={{ padding: '12px 16px' }}>{getCourseName(record.course)}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{new Date(record.deliveredAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}</td>
                    <td style={{ padding: '12px 16px' }}>{formatDuration(record.durationMinutes)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: status.bg, color: status.color, fontWeight: 600 }}>
                        {isAr ? status.ar : record.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(record)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--foreground)' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(record.id)} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', color: '#ef4444' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
                {editing ? (isAr ? 'تعديل محاضرة' : 'Edit Lecture') : (isAr ? 'إضافة محاضرة' : 'Add Lecture')}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'المحاضر *' : 'Instructor *'}</label>
            <select value={form.instructorId} onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}>
              <option value="">{isAr ? 'اختر محاضراً' : 'Select instructor'}</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{getInstructorName(i)}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'الدورة *' : 'Course *'}</label>
            <select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}>
              <option value="">{isAr ? 'اختر دورة' : 'Select course'}</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{getCourseName(c)}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'عنوان المحاضرة' : 'Lecture Title'}</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={isAr ? 'عنوان اختياري' : 'Optional title'} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'تاريخ التسليم *' : 'Delivered Date *'}</label>
            <input type="date" value={form.deliveredAt} onChange={(e) => setForm((f) => ({ ...f, deliveredAt: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'المدة (دقيقة) *' : 'Duration (minutes) *'}</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 4, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>{formatDuration(form.durationMinutes)}</div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'الحالة' : 'Status'}</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}>
              <option value="DRAFT">{isAr ? 'مسودة' : 'Draft'}</option>
              <option value="COMPLETED">{isAr ? 'مكتملة' : 'Completed'}</option>
              <option value="CANCELLED">{isAr ? 'ملغاة' : 'Cancelled'}</option>
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'ملاحظات' : 'Notes'}</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 20, boxSizing: 'border-box', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving || !form.instructorId || !form.courseId || !form.deliveredAt} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? '...' : (isAr ? 'حفظ' : 'Save')}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
