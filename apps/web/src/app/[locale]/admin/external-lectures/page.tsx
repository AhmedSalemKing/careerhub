'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../../lib/api'
import { ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react'

interface Instructor { id: string; name: string }
interface Lecture {
  id: string
  instructorId: string
  courseId: string
  title?: string
  lectureDate: string
  durationMinutes: number
  status: string
  notes?: string
  instructor: Instructor
}

const STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED']
const STATUS_COLOR: Record<string, string> = { COMPLETED: '#22c55e', SCHEDULED: '#f59e0b', CANCELLED: '#ef4444' }

const EMPTY_FORM = { instructorId: '', courseId: '', title: '', lectureDate: '', durationMinutes: 60, status: 'SCHEDULED', notes: '' }

export default function ExternalLecturesPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Lecture | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [lecRes, instRes] = await Promise.all([
        api.get('/external-lectures'),
        api.get('/external-instructors'),
      ])
      setLectures(lecRes.data.data ?? [])
      setInstructors(instRes.data.data ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(lec: Lecture) {
    setEditing(lec)
    setForm({
      instructorId: lec.instructorId,
      courseId: lec.courseId,
      title: lec.title ?? '',
      lectureDate: lec.lectureDate.slice(0, 10),
      durationMinutes: lec.durationMinutes,
      status: lec.status,
      notes: lec.notes ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.instructorId || !form.courseId || !form.lectureDate) return
    setSaving(true)
    try {
      const payload = { ...form, durationMinutes: Number(form.durationMinutes) }
      if (editing) {
        await api.put(`/external-lectures/${editing.id}`, payload)
      } else {
        await api.post('/external-lectures', payload)
      }
      setShowForm(false)
      load()
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm(isAr ? 'هل أنت متأكد من الحذف؟' : 'Delete this lecture?')) return
    try { await api.delete(`/external-lectures/${id}`); load() } catch {}
  }

  const visible = filterStatus ? lectures.filter(l => l.status === filterStatus) : lectures

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClipboardList size={22} color="#5120C8" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isAr ? 'المحاضرات الخارجية' : 'External Lectures'}</h1>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} />
          {isAr ? 'تسجيل محاضرة' : 'Log Lecture'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', background: filterStatus === s ? '#5120C8' : 'var(--surface)', color: filterStatus === s ? '#fff' : 'var(--foreground)' }}>
            {s || (isAr ? 'الكل' : 'All')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>{isAr ? 'لا توجد محاضرات' : 'No lectures found'}</div>
          )}
          {visible.map(lec => (
            <div key={lec.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{lec.instructor?.name ?? lec.instructorId}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {lec.title ? `${lec.title} · ` : ''}{lec.courseId} · {new Date(lec.lectureDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')} · {lec.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                </div>
              </div>
              <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: `${STATUS_COLOR[lec.status]}22`, color: STATUS_COLOR[lec.status], fontWeight: 600, flexShrink: 0 }}>
                {lec.status}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(lec)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--foreground)' }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(lec.id)} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
              {editing ? (isAr ? 'تعديل المحاضرة' : 'Edit Lecture') : (isAr ? 'تسجيل محاضرة جديدة' : 'Log New Lecture')}
            </h2>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'المدرب *' : 'Instructor *'}</label>
            <select value={form.instructorId} onChange={e => setForm(f => ({ ...f, instructorId: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}>
              <option value="">{isAr ? 'اختر مدرباً' : 'Select instructor'}</option>
              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'معرف الكورس *' : 'Course ID *'}</label>
            <input value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} placeholder={isAr ? 'معرف الكورس' : 'Course ID'} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'عنوان المحاضرة' : 'Lecture Title'}</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'تاريخ المحاضرة *' : 'Lecture Date *'}</label>
            <input type="date" value={form.lectureDate} onChange={e => setForm(f => ({ ...f, lectureDate: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'المدة (دقائق) *' : 'Duration (minutes) *'}</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'الحالة' : 'Status'}</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{isAr ? 'ملاحظات' : 'Notes'}</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, marginBottom: 20, boxSizing: 'border-box', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving || !form.instructorId || !form.courseId || !form.lectureDate} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
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
