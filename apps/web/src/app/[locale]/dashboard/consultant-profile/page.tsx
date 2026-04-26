'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { get, patch } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase, GraduationCap, Star, Clock, DollarSign,
  Plus, X, Save, Linkedin, CheckCircle2
} from 'lucide-react'

export default function ConsultantProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    speciality: '',
    yearsExperience: 0,
    qualifications: [] as string[],
    consultingAreas: [] as string[],
    bio: '',
    linkedinUrl: '',
    sessionPrice: 0,
    sessionDuration: 60,
  })
  const [newQual, setNewQual] = useState('')
  const [newArea, setNewArea] = useState('')
  const [saved, setSaved] = useState(false)

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['consultant-profile'],
    queryFn: async () => {
      const res = await get('/users/consultant-profile')
      return res.data?.data
    },
    retry: false,
  })

  useEffect(() => {
    if (profileData) {
      setForm({
        speciality: profileData.speciality || '',
        yearsExperience: profileData.yearsExperience || 0,
        qualifications: profileData.qualifications || [],
        consultingAreas: profileData.consultingAreas || [],
        bio: profileData.bio || '',
        linkedinUrl: profileData.linkedinUrl || '',
        sessionPrice: profileData.sessionPrice || 0,
        sessionDuration: profileData.sessionDuration || 60,
      })
    }
  }, [profileData])

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await patch('/users/consultant-profile', data)
      return res.data
    },
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['consultant-profile'] })
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const addQualification = () => {
    if (!newQual.trim()) return
    setForm(f => ({ ...f, qualifications: [...f.qualifications, newQual.trim()] }))
    setNewQual('')
  }

  const removeQualification = (idx: number) => {
    setForm(f => ({ ...f, qualifications: f.qualifications.filter((_, i) => i !== idx) }))
  }

  const addConsultingArea = () => {
    if (!newArea.trim()) return
    setForm(f => ({ ...f, consultingAreas: [...f.consultingAreas, newArea.trim()] }))
    setNewArea('')
  }

  const removeConsultingArea = (idx: number) => {
    setForm(f => ({ ...f, consultingAreas: f.consultingAreas.filter((_, i) => i !== idx) }))
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    borderRadius: 10, border: `1px solid ${border}`,
    background: isDark ? '#0d0d0d' : '#fafafa',
    color: text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    color: text, fontSize: 13, fontWeight: 700,
    marginBottom: 6, display: 'block',
  }

  const sectionStyle = {
    background: cardBg, borderRadius: 16,
    border: `1px solid ${border}`,
    padding: '24px', marginBottom: 16,
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, padding: 24 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ height: 200, background: cardBg, borderRadius: 16 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: 24 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ color: text, fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>
          {isAr ? 'ملف المستشار' : 'Consultant Profile'}
        </h1>
        <p style={{ color: subtext, fontSize: 13, margin: '0 0 24px' }}>
          {isAr ? 'أضف معلوماتك المهنية' : 'Add your professional details'}
        </p>

        <div style={sectionStyle}>
          <h2 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 16px' }}>
            {isAr ? 'المعلومات الأساسية' : 'Basic Info'}
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>{isAr ? 'التخصص' : 'Specialization'}</label>
              <input style={inputStyle} placeholder="..." value={form.speciality}
                onChange={e => setForm(f => ({ ...f, speciality: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{isAr ? 'سنوات الخبرة' : 'Experience'}</label>
              <input type="number" style={inputStyle} value={form.yearsExperience}
                onChange={e => setForm(f => ({ ...f, yearsExperience: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={labelStyle}>{isAr ? 'نبذة' : 'Bio'}</label>
              <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>LinkedIn</label>
              <input style={inputStyle} placeholder="https://..." value={form.linkedinUrl}
                onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} />
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 16px' }}>
            {isAr ? 'إعدادات الجلسة' : 'Session Settings'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{isAr ? 'السعر (ر.س)' : 'Price (SAR)'}</label>
              <input type="number" style={inputStyle} value={form.sessionPrice}
                onChange={e => setForm(f => ({ ...f, sessionPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={labelStyle}>{isAr ? 'المدة (دقيقة)' : 'Duration'}</label>
              <select style={inputStyle} value={form.sessionDuration}
                onChange={e => setForm(f => ({ ...f, sessionDuration: parseInt(e.target.value) }))}>
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value={60}>60</option>
                <option value={90}>90</option>
              </select>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 16px' }}>
            {isAr ? 'المؤهلات' : 'Qualifications'}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="..." value={newQual}
              onChange={e => setNewQual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQualification()} />
            <button onClick={addQualification} style={{
              padding: '0 16px', borderRadius: 10, background: '#5120c8',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700,
            }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.qualifications.map((q, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                border: `1px solid ${border}`,
              }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span style={{ color: text, fontSize: 13, flex: 1 }}>{q}</span>
                <button onClick={() => removeQualification(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: subtext,
                }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: text, fontSize: 15, fontWeight: 800, margin: '0 0 16px' }}>
            {isAr ? 'مجالات الاستشارات' : 'Consulting Areas'}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="..." value={newArea}
              onChange={e => setNewArea(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addConsultingArea()} />
            <button onClick={addConsultingArea} style={{
              padding: '0 16px', borderRadius: 10, background: '#5120c8',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700,
            }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {form.consultingAreas.map((area, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20,
                background: 'rgba(81,32,200,0.08)',
                border: '1px solid rgba(81,32,200,0.2)',
              }}>
                <span style={{ color: '#5120c8', fontSize: 13, fontWeight: 600 }}>{area}</span>
                <button onClick={() => removeConsultingArea(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#5120c8',
                }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: saved ? '#16a34a' : '#5120c8',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {saved ? <><CheckCircle2 size={18} />{isAr ? 'تم!' : 'Saved!'}</> : <><Save size={16} />{isAr ? 'حفظ' : 'Save'}</>}
        </button>
      </div>
    </div>
  )
}