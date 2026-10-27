'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { api } from '../../../../../lib/api'
import { ArrowRight, UserCheck } from 'lucide-react'

interface Lecture {
  id: string
  courseId: string
  title?: string
  lectureDate: string
  durationMinutes: number
  status: string
  notes?: string
}

interface Instructor {
  id: string
  name: string
  email?: string
  phone?: string
  specialty?: string
  notes?: string
  isActive: boolean
  lectures: Lecture[]
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: '#22c55e',
  SCHEDULED: '#f59e0b',
  CANCELLED: '#ef4444',
}

export default function InstructorDetailPage() {
  const locale = useLocale()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const isAr = locale === 'ar'
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/external-instructors/${id}`)
      .then(res => setInstructor(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>...</div>
  if (!instructor) return <div style={{ textAlign: 'center', padding: 80, color: '#ef4444' }}>{isAr ? 'لم يُعثر على المدرب' : 'Instructor not found'}</div>

  const completed = instructor.lectures.filter(l => l.status === 'COMPLETED')
  const totalMinutes = completed.reduce((s, l) => s + l.durationMinutes, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#5120C8', fontWeight: 600 }}>
        <ArrowRight size={16} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
        {isAr ? 'رجوع' : 'Back'}
      </button>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <UserCheck size={20} color="#5120C8" />
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{instructor.name}</h1>
          {!instructor.isActive && <span style={{ fontSize: 11, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 4, padding: '2px 6px' }}>{isAr ? 'غير نشط' : 'Inactive'}</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--muted)' }}>
          {instructor.specialty && <span>{isAr ? 'التخصص: ' : 'Specialty: '}{instructor.specialty}</span>}
          {instructor.email && <span>{isAr ? 'البريد: ' : 'Email: '}{instructor.email}</span>}
          {instructor.phone && <span>{isAr ? 'الهاتف: ' : 'Phone: '}{instructor.phone}</span>}
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#5120C8' }}>{instructor.lectures.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isAr ? 'إجمالي المحاضرات' : 'Total Lectures'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{completed.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isAr ? 'مكتملة' : 'Completed'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{totalHours}h</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isAr ? 'ساعات منجزة' : 'Hours Done'}</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{isAr ? 'المحاضرات' : 'Lectures'}</h2>
      {instructor.lectures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          {isAr ? 'لا توجد محاضرات' : 'No lectures yet'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {instructor.lectures.map(lec => (
            <div key={lec.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{lec.title ?? lec.courseId}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {new Date(lec.lectureDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')} · {lec.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                </div>
              </div>
              <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: `${STATUS_COLOR[lec.status]}22`, color: STATUS_COLOR[lec.status], fontWeight: 600 }}>
                {lec.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
