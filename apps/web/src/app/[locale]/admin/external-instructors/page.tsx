'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '../../../../lib/api'
import { UserCheck, Plus, Pencil, Trash2, BarChart2, ChevronRight } from 'lucide-react'

interface ExternalInstructor {
  id: string
  name: string
  email?: string
  phone?: string
  specialty?: string
  isActive: boolean
  createdAt: string
}

export default function ExternalInstructorsPage() {
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'
  const [instructors, setInstructors] = useState<ExternalInstructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExternalInstructor | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '', notes: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/external-instructors${includeInactive ? '?includeInactive=true' : ''}`)
      setInstructors(res.data.data ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [includeInactive])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', specialty: '', notes: '', isActive: true })
    setShowForm(true)
  }

  function openEdit(inst: ExternalInstructor) {
    setEditing(inst)
    setForm({ name: inst.name, email: inst.email ?? '', phone: inst.phone ?? '', specialty: inst.specialty ?? '', notes: '', isActive: inst.isActive })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/external-instructors/${editing.id}`, form)
      } else {
        await api.post('/external-instructors', form)
      }
      setShowForm(false)
      load()
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm(isAr ? 'هل أنت متأكد من الحذف؟' : 'Delete this instructor?')) return
    try {
      await api.delete(`/external-instructors/${id}`)
      load()
    } catch {}
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCheck size={22} color="#5120C8" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{isAr ? 'المدربون الخارجيون' : 'External Instructors'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push(`/${locale}/admin/external-instructors/report`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(81,32,200,0.1)', color: '#5120C8', border: '1px solid rgba(81,32,200,0.3)', cursor: 'pointer', fontWeight: 600 }}
          >
            <BarChart2 size={16} />
            {isAr ? 'التقرير' : 'Report'}
          </button>
          <button
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={16} />
            {isAr ? 'إضافة مدرب' : 'Add Instructor'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--muted)' }}>
          <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} />
          {isAr ? 'عرض غير النشطين' : 'Include inactive'}
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {instructors.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              {isAr ? 'لا يوجد مدربون بعد' : 'No instructors yet'}
            </div>
          )}
          {instructors.map(inst => (
            <div key={inst.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{inst.name}</span>
                  {!inst.isActive && <span style={{ fontSize: 11, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 4, padding: '2px 6px' }}>{isAr ? 'غير نشط' : 'Inactive'}</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  {[inst.specialty, inst.email, inst.phone].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => router.push(`/${locale}/admin/external-instructors/${inst.id}`)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--foreground)' }}>
                  <ChevronRight size={15} />
                </button>
                <button onClick={() => openEdit(inst)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--foreground)' }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(inst.id)} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
              {editing ? (isAr ? 'تعديل المدرب' : 'Edit Instructor') : (isAr ? 'إضافة مدرب جديد' : 'Add New Instructor')}
            </h2>
            {[
              { key: 'name', label: isAr ? 'الاسم *' : 'Name *' },
              { key: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email' },
              { key: 'phone', label: isAr ? 'الهاتف' : 'Phone' },
              { key: 'specialty', label: isAr ? 'التخصص' : 'Specialty' },
              { key: 'notes', label: isAr ? 'ملاحظات' : 'Notes' },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span style={{ fontSize: 14 }}>{isAr ? 'نشط' : 'Active'}</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#5120C8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
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
