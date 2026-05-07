'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { post, get } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { useAuthStore } from '../../../../stores/authStore'
import {
  Video, Radio, MapPin, ChevronRight, ChevronLeft,
  Upload, Calendar, Clock, Users, DollarSign,
  ToggleLeft, ToggleRight, CheckCircle2, X,
  CheckCircle, Image as ImageIcon, Plus, Trash2,
  Play, Mic, Camera, ArrowRight, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

const COURSE_TYPES = [
  {
    key: 'recorded',
    icon: Video,
    ar: 'كورس مسجل',
    en: 'Recorded Course',
    descAr: 'ارفع فيديوهات وملفات للطلاب',
    descEn: 'Upload videos and files for students',
    color: '#5120c8',
  },
  {
    key: 'live',
    icon: Radio,
    ar: 'بث مباشر',
    en: 'Live Stream',
    descAr: 'دروس مباشرة عبر البث الحي',
    descEn: 'Real-time live streaming sessions',
    color: '#dc2626',
  },
  {
    key: 'offline',
    icon: MapPin,
    ar: 'مقر فعلي',
    en: 'Physical Location',
    descAr: 'كورس في مكان فعلي محدد',
    descEn: 'In-person course at a physical location',
    color: '#16a34a',
  },
]

const LEVELS = [
  { value: 'BEGINNER', ar: 'مبتدئ', en: 'Beginner' },
  { value: 'INTERMEDIATE', ar: 'متوسط', en: 'Intermediate' },
  { value: 'ADVANCED', ar: 'متقدم', en: 'Advanced' },
]

type Section = { title: string }

interface SearchableSelectProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder?: string
  isRtl?: boolean
}

function SearchableSelect({
  options, value, onChange, placeholder, searchPlaceholder, isRtl
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          color: selected ? 'var(--foreground)' : 'var(--muted-foreground, #888)',
          fontSize: '0.9rem',
          textAlign: isRtl ? 'right' : 'left' as const,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, opacity: 0.5,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          background: 'var(--card, #1a1a2e)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          zIndex: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ position:'absolute', left:'10px', top:'50%',
                  transform:'translateY(-50%)', opacity:0.4 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder || 'بحث...'}
                dir={isRtl ? 'rtl' : 'ltr'}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setSearch('') }}
              style={{
                width: '100%', padding: '9px 14px',
                background: 'transparent',
                border: 'none', cursor: 'pointer',
                color: 'var(--muted-foreground, #888)',
                fontSize: '0.85rem',
                textAlign: isRtl ? 'right' : 'left' as const,
                fontFamily: 'inherit',
              }}
            >
              {placeholder}
            </button>

            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', color: '#666',
                fontSize: '0.85rem', textAlign: 'center' }}>
                {isRtl ? 'لا توجد نتائج' : 'No results'}
              </div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  style={{
                    width: '100%', padding: '9px 14px',
                    background: opt.value === value
                      ? 'rgba(81,32,200,0.15)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: opt.value === value
                      ? '#a78bfa' : 'var(--foreground)',
                    fontSize: '0.875rem',
                    textAlign: isRtl ? 'right' : 'left' as const,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateCoursePage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (user && (user.accountType === 'CONSULTANT' || user.accountType === 'STUDENT')) {
      router.push(`/${locale}/dashboard`)
    }
  }, [user, locale, router])

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    type: '' as 'recorded' | 'live' | 'offline' | '',
    title: '',
    titleAr: '',
    description: '',
    price: '0',
    level: 'BEGINNER',
    status: 'DRAFT',
    categoryId: '',
    careerPathId: '',
    thumbnail: '',
    previewVideo: '',
    sections: [{ title: '' }] as Section[],
    liveDate: '',
    liveTime: '',
    liveDuration: 60,
    autoPublishRecording: false,
    autoDeleteAfterLive: false,
    saveRecording: true,
    locationName: '',
    locationAddress: '',
    locationLat: null as number | null,
    locationLng: null as number | null,
    maxAttendees: '',
    offlineDate: '',
    offlineTime: '',
    offlinePaymentType: 'online' as 'online' | 'on_site',
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['course-categories'],
    queryFn: async () => {
      try {
        const res = await get('/courses/categories')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  const { data: careerPaths = [] } = useQuery({
    queryKey: ['career-paths-list'],
    queryFn: async () => {
      try {
        const res = await get('/career/paths')
        return (res?.data as any)?.data?.careerPaths ?? (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  const [thumbUploading, setThumbUploading] = useState(false)
  const [thumbPreview, setThumbPreview] = useState('')
  const thumbRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Load Google Maps for offline type
  useEffect(() => {
    if (form.type === 'offline' && step === 3) {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!key || key === 'xxxxxxxxxxxx') return
      if ((window as any).google?.maps) return
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => initMap()
      document.head.appendChild(script)
    }
  }, [form.type, step])

  function initMap() {
    if (!mapRef.current || !(window as any).google?.maps) return
    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 24.7136, lng: 46.6753 },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
    })
    let marker: any = null
    map.addListener('click', (e: any) => {
      if (marker) marker.setMap(null)
      marker = new (window as any).google.maps.Marker({
        position: e.latLng,
        map,
        animation: (window as any).google.maps.Animation.DROP,
      })
      setForm(f => ({ ...f, locationLat: e.latLng.lat(), locationLng: e.latLng.lng() }))
    })
  }

  async function handleThumbUpload(file: File) {
    setThumbUploading(true)
    setThumbPreview(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
      const res = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setForm(f => ({ ...f, thumbnail: data.data.url }))
    } catch {
      setError(isAr ? 'فشل رفع الصورة' : 'Failed to upload image')
    } finally {
      setThumbUploading(false)
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError(isAr ? 'عنوان الكورس مطلوب' : 'Course title is required'); return }
    setSaving(true)
    setError('')
    try {
      const payload: any = {
        title: form.title,
        titleAr: form.titleAr,
        description: form.description,
        price: parseFloat(form.price) || 0,
        level: form.level,
        status: form.status,
        categoryId: form.categoryId || undefined,
        careerPathId: form.careerPathId || undefined,
        thumbnail: form.thumbnail || undefined,
        previewVideo: form.previewVideo || undefined,
        type: form.type,
        sections: form.sections.filter(s => s.title.trim()).map(s => ({ title: s.title })),
      }

      if (form.type === 'live') {
        payload.liveStartTime = `${form.liveDate}T${form.liveTime}:00`
        payload.autoPublishRecording = form.autoPublishRecording
        payload.autoDeleteAfterLive = form.autoDeleteAfterLive
        payload.liveStatus = 'scheduled'
      }

      if (form.type === 'offline') {
        payload.locationName = form.locationName
        payload.locationAddress = form.locationAddress
        if (form.locationLat) payload.locationLat = form.locationLat
        if (form.locationLng) payload.locationLng = form.locationLng
        if (form.maxAttendees) payload.maxAttendees = parseInt(form.maxAttendees)
        payload.liveStartTime = `${form.offlineDate}T${form.offlineTime}:00`
        payload.offlinePaymentType = form.offlinePaymentType
      }

      await post('/courses', payload)
      toast.success(isAr ? 'تم إنشاء الكورس بنجاح!' : 'Course created successfully!')
      router.push(`/${locale}/dashboard/my-courses`)
    } catch (e: any) {
      setError(e?.response?.data?.message || (isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Error occurred, try again'))
    } finally {
      setSaving(false)
    }
  }

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function addSection() {
    setForm(f => ({ ...f, sections: [...f.sections, { title: '' }] }))
  }

  function removeSection(i: number) {
    setForm(f => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }))
  }

  function updateSection(i: number, title: string) {
    setForm(f => {
      const sections = [...f.sections]
      sections[i] = { title }
      return { ...f, sections }
    })
  }

  function canProceed(): boolean {
    if (step === 1) return !!form.type
    if (step === 2) return form.title.trim().length > 0
    if (step === 3) {
      if (form.type === 'recorded') return true
      if (form.type === 'live') return !!form.liveDate && !!form.liveTime
      if (form.type === 'offline') return !!form.locationName && !!form.offlineDate && !!form.offlineTime
    }
    return true
  }

  const selectedType = COURSE_TYPES.find(t => t.key === form.type)
  const totalSteps = form.type === 'recorded' ? 4 : 4

  const inputCls = "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
  const labelCls = "block text-sm font-medium text-foreground mb-1.5"

  return (
    <AuthGate>
      <div className="p-6 max-w-2xl mx-auto" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-madinet text-foreground">
            {isAr ? 'إنشاء كورس جديد' : 'Create New Course'}
          </h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">
            {isAr ? `الخطوة ${step} من 4` : `Step ${step} of 4`}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                step > n ? 'bg-green-500 text-white'
                  : step === n ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-[color:var(--surface-2)] text-[color:var(--muted)]'
              }`}>
                {step > n ? <CheckCircle className="h-4 w-4" /> : n}
              </div>
              {n < 4 && (
                <div className={`h-0.5 flex-1 transition-all ${step > n ? 'bg-primary' : 'bg-[color:var(--border)]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 space-y-5">

          {/* STEP 1: Choose type */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold font-madinet text-foreground">
                {isAr ? 'اختر نوع الكورس' : 'Choose Course Type'}
              </h2>
              <p className="text-sm text-[color:var(--muted)] -mt-3">
                {isAr ? 'كل نوع له مميزاته وإعداداته الخاصة' : 'Each type has its own features and settings'}
              </p>
              <div className="space-y-3">
                {COURSE_TYPES.map(t => {
                  const Icon = t.icon
                  const selected = form.type === t.key
                  return (
                    <div
                      key={t.key}
                      onClick={() => setForm(f => ({ ...f, type: t.key as any, sections: [{ title: '' }] }))}
                      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-primary/50'
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0" style={{ background: `${t.color}15` }}>
                        <Icon size={22} color={t.color} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-foreground">{isAr ? t.ar : t.en}</div>
                        <div className="text-xs text-[color:var(--muted)] mt-0.5">{isAr ? t.descAr : t.descEn}</div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'border-primary bg-primary' : 'border-[color:var(--border)]'
                      }`}>
                        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* STEP 2: Basic info */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3">
                {selectedType && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${selectedType.color}15` }}>
                    <selectedType.icon size={18} color={selectedType.color} />
                  </div>
                )}
                <h2 className="text-lg font-bold font-madinet text-foreground">
                  {isAr ? 'معلومات الكورس الأساسية' : 'Basic Course Info'}
                </h2>
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'عنوان الكورس' : 'Course Title'} *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder={isAr ? 'أدخل عنواناً واضحاً وجذاباً...' : 'Enter a clear, compelling title...'}
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'العنوان بالعربية' : 'Arabic Title'}</label>
                <input value={form.titleAr} onChange={e => set('titleAr', e.target.value)}
                  placeholder={isAr ? 'مثال: برمجة بايثون' : 'e.g. Python Programming'}
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'وصف الكورس' : 'Description'}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder={isAr ? 'اوصف ما سيتعلمه الطالب...' : 'Describe what students will learn...'}
                  rows={4} className={`${inputCls} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{isAr ? 'السعر (0 = مجاني)' : 'Price (0 = Free)'}</label>
                  <div className="relative">
                    <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                      className={`${inputCls} ${isAr ? 'pl-12' : 'pr-12'}`} />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-[color:var(--muted)] ${isAr ? 'left-3' : 'right-3'}`}>
                      {isAr ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{isAr ? 'المستوى' : 'Level'}</label>
                  <div className="flex gap-2">
                    {LEVELS.map(l => (
                      <button key={l.value} onClick={() => set('level', l.value)}
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                          form.level === l.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)]'
                        }`}>
                        {isAr ? l.ar : l.en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {(categories as any[]).length > 0 && (
                <div>
                  <label className={labelCls}>{isAr ? 'الفئة' : 'Category'}</label>
                  <SearchableSelect
                    options={(categories as any[]).filter((c: any) => !c.parentId).flatMap((mainCat: any) =>
                      (mainCat.children || []).map((sub: any) => ({
                        value: sub.id,
                        label: `${mainCat.name} › ${sub.name}`,
                      }))
                    )}
                    value={form.categoryId}
                    onChange={val => set('categoryId', val)}
                    placeholder={isAr ? 'اختر فئة...' : 'Select category...'}
                    searchPlaceholder={isAr ? 'ابحث عن فئة...' : 'Search category...'}
                    isRtl={isAr}
                  />
                </div>
              )}

              {(careerPaths as any[]).length > 0 && (
                <div>
                  <label className={labelCls}>{isAr ? 'المسار المهني' : 'Career Path'}</label>
                  <SearchableSelect
                    options={(careerPaths as any[]).map((p: any) => ({
                      value: p.id,
                      label: isAr ? (p.titleAr || p.descriptionAr?.split('.')[0] || p.slug)
                                   : (p.titleEn || p.descriptionEn?.split('.')[0] || p.slug),
                    }))}
                    value={form.careerPathId}
                    onChange={val => set('careerPathId', val)}
                    placeholder={isAr ? 'اختر مساراً مهنياً (اختياري)' : 'Select career path (optional)'}
                    searchPlaceholder={isAr ? 'ابحث عن مسار...' : 'Search path...'}
                    isRtl={isAr}
                  />
                </div>
              )}

              {/* Thumbnail */}
              <div>
                <label className={labelCls}>{isAr ? 'صورة الغلاف' : 'Thumbnail'}</label>
                <div onClick={() => thumbRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 cursor-pointer hover:border-primary/50 transition-colors min-h-[120px]">
                  {form.thumbnail ? (
                    <>
                      <img src={form.thumbnail} className="h-32 w-full object-cover rounded-xl" alt="thumb" />
                      <button type="button" onClick={e => { e.stopPropagation(); set('thumbnail', ''); setThumbPreview('') }}
                        className="absolute top-3 left-3 rounded-full bg-red-500/80 p-1 text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : thumbUploading ? (
                    <div className="flex items-center gap-2 text-[color:var(--muted)]">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm">{isAr ? 'جارٍ الرفع...' : 'Uploading...'}</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-[color:var(--muted)] opacity-50" />
                      <p className="text-sm text-[color:var(--muted)]">{isAr ? 'اضغط لرفع صورة الغلاف' : 'Click to upload thumbnail'}</p>
                    </>
                  )}
                </div>
                <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f) }} />
              </div>
            </>
          )}

          {/* STEP 3: Type-specific settings */}
          {step === 3 && form.type === 'recorded' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: '#5120c815' }}>
                  <Video size={18} color="#5120c8" />
                </div>
                <h2 className="text-lg font-bold font-madinet text-foreground">
                  {isAr ? 'أقسام الكورس' : 'Course Sections'}
                </h2>
              </div>
              <p className="text-sm text-[color:var(--muted)] -mt-3">
                {isAr ? 'أضف الأقسام (يمكنك إضافة المحاضرات لاحقاً)' : 'Add sections (you can add lessons later)'}
              </p>
              <div className="space-y-3">
                {form.sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <input value={section.title} onChange={e => updateSection(i, e.target.value)}
                      placeholder={`${isAr ? 'اسم القسم' : 'Section name'} ${i + 1}`}
                      className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors" />
                    {form.sections.length > 1 && (
                      <button onClick={() => removeSection(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addSection} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Plus className="h-4 w-4" /> {isAr ? 'إضافة قسم آخر' : 'Add another section'}
              </button>
            </>
          )}

          {step === 3 && form.type === 'live' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(220,38,38,0.1)' }}>
                  <Radio size={18} color="#dc2626" />
                </div>
                <h2 className="text-lg font-bold font-madinet text-foreground">
                  {isAr ? 'إعدادات البث المباشر' : 'Live Stream Settings'}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{isAr ? 'تاريخ البث' : 'Live Date'} *</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]}
                    value={form.liveDate} onChange={e => set('liveDate', e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{isAr ? 'وقت البث' : 'Live Time'} *</label>
                  <input type="time" value={form.liveTime} onChange={e => set('liveTime', e.target.value)}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'المدة المتوقعة (دقيقة)' : 'Expected Duration (min)'}</label>
                <div className="flex gap-2">
                  {[30, 60, 90, 120].map(d => (
                    <button key={d} onClick={() => set('liveDuration', d)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                        form.liveDuration === d
                          ? 'border-red-500 bg-red-500/10 text-red-500'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)]'
                      }`}>
                      {d} {isAr ? 'دقيقة' : 'min'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'saveRecording', ar: 'حفظ التسجيل بعد الانتهاء', en: 'Save recording after live ends', color: '#5120c8' },
                  { key: 'autoPublishRecording', ar: 'نشر التسجيل تلقائياً', en: 'Auto-publish recording', color: '#16a34a' },
                  { key: 'autoDeleteAfterLive', ar: 'حذف الكورس بعد انتهاء البث', en: 'Delete course after live ends', color: '#dc2626' },
                ].map(t => (
                  <div key={t.key} onClick={() => set(t.key, !(form as any)[t.key])}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      (form as any)[t.key]
                        ? 'border-[color] bg-[color]/5'
                        : 'border-[color:var(--border)] bg-[color:var(--surface-2)]'
                    }`.replace('[color]', t.color)}>
                    <span className="text-sm font-medium text-foreground">{isAr ? t.ar : t.en}</span>
                    {(form as any)[t.key]
                      ? <ToggleRight size={24} color={t.color} />
                      : <ToggleLeft size={24} color="var(--muted)" />}
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 flex gap-3">
                <Radio size={16} color="#dc2626" className="shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 leading-relaxed">
                  {isAr
                    ? 'ستتمكن من بدء البث من داشبورد المحاضر. سيتم إرسال إشعارات للطلاب عند بدء البث.'
                    : 'You can start the live from your instructor dashboard. Students will be notified when you go live.'}
                </p>
              </div>
            </>
          )}

          {step === 3 && form.type === 'offline' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(22,163,74,0.1)' }}>
                  <MapPin size={18} color="#16a34a" />
                </div>
                <h2 className="text-lg font-bold font-madinet text-foreground">
                  {isAr ? 'تفاصيل المقر الفعلي' : 'Physical Location Details'}
                </h2>
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'اسم المكان' : 'Venue Name'} *</label>
                <input value={form.locationName} onChange={e => set('locationName', e.target.value)}
                  placeholder={isAr ? 'مثال: مركز التدريب الرياض' : 'e.g. Riyadh Training Center'}
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'العنوان التفصيلي' : 'Full Address'}</label>
                <input value={form.locationAddress} onChange={e => set('locationAddress', e.target.value)}
                  placeholder={isAr ? 'الشارع، الحي، المدينة...' : 'Street, district, city...'}
                  className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{isAr ? 'التاريخ' : 'Date'} *</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]}
                    value={form.offlineDate} onChange={e => set('offlineDate', e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{isAr ? 'الوقت' : 'Time'} *</label>
                  <input type="time" value={form.offlineTime} onChange={e => set('offlineTime', e.target.value)}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'الحد الأقصى للحضور (اختياري)' : 'Max Attendees (optional)'}</label>
                <input type="number" min="1" value={form.maxAttendees} onChange={e => set('maxAttendees', e.target.value)}
                  placeholder={isAr ? 'غير محدود إذا تركت فارغاً' : 'Unlimited if left empty'}
                  className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'طريقة الدفع' : 'Payment Type'}</label>
                <div className="flex gap-2">
                  {[
                    { v: 'online', ar: 'دفع مسبق أونلاين', en: 'Online Payment' },
                    { v: 'on_site', ar: 'دفع في المقر', en: 'Pay on Site' },
                  ].map(p => (
                    <button key={p.v} onClick={() => set('offlinePaymentType', p.v)}
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                        form.offlinePaymentType === p.v
                          ? 'border-green-500 bg-green-500/10 text-green-500'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)]'
                      }`}>
                      {isAr ? p.ar : p.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Google Maps */}
              <div>
                <label className={labelCls}>
                  {isAr ? 'الموقع على الخريطة (اختياري)' : 'Location on Map (optional)'}
                </label>
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'xxxxxxxxxxxx' ? (
                  <>
                    <div ref={mapRef} className="w-full h-48 rounded-xl border border-[color:var(--border)] overflow-hidden" />
                    {form.locationLat && form.locationLng && (
                      <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {isAr ? `تم تحديد الموقع: ${form.locationLat.toFixed(4)}, ${form.locationLng.toFixed(4)}` : `Location set: ${form.locationLat.toFixed(4)}, ${form.locationLng.toFixed(4)}`}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3 text-xs text-yellow-500">
                    {isAr ? 'أضف NEXT_PUBLIC_GOOGLE_MAPS_API_KEY لتفعيل الخريطة' : 'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map'}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <>
              <h2 className="text-lg font-bold font-madinet text-foreground">
                {isAr ? 'مراجعة وإنشاء الكورس' : 'Review & Create'}
              </h2>

              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 space-y-3 text-sm">
                {selectedType && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${selectedType.color}15` }}>
                      <selectedType.icon size={14} color={selectedType.color} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: selectedType.color }}>
                      {isAr ? selectedType.ar : selectedType.en}
                    </span>
                  </div>
                )}
                <Row label={isAr ? 'العنوان' : 'Title'} value={form.title} />
                <Row label={isAr ? 'العنوان بالعربية' : 'Arabic Title'} value={form.titleAr || '—'} />
                <Row label={isAr ? 'الوصف' : 'Description'} value={form.description ? form.description.slice(0, 80) + '...' : '—'} />
                <Row label={isAr ? 'السعر' : 'Price'} value={`${form.price} ${isAr ? 'ر.س' : 'SAR'}`} />
                <Row label={isAr ? 'المستوى' : 'Level'} value={LEVELS.find(l => l.value === form.level)?.[isAr ? 'ar' : 'en'] ?? form.level} />
                <Row label={isAr ? 'الصورة' : 'Thumbnail'} value={form.thumbnail ? (isAr ? 'تم الرفع ✓' : 'Uploaded ✓') : (isAr ? 'لا توجد' : 'None')} />
                {form.type === 'live' && (
                  <>
                    <Row label={isAr ? 'تاريخ البث' : 'Live Date'} value={`${form.liveDate} ${form.liveTime}`} />
                    <Row label={isAr ? 'المدة' : 'Duration'} value={`${form.liveDuration} ${isAr ? 'دقيقة' : 'min'}`} />
                    <Row label={isAr ? 'حفظ التسجيل' : 'Save Recording'} value={form.saveRecording ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')} />
                    <Row label={isAr ? 'نشر تلقائي' : 'Auto Publish'} value={form.autoPublishRecording ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')} />
                  </>
                )}
                {form.type === 'offline' && (
                  <>
                    <Row label={isAr ? 'المكان' : 'Venue'} value={form.locationName} />
                    <Row label={isAr ? 'العنوان' : 'Address'} value={form.locationAddress || '—'} />
                    <Row label={isAr ? 'التاريخ' : 'Date'} value={`${form.offlineDate} ${form.offlineTime}`} />
                    <Row label={isAr ? 'الحد الأقصى' : 'Max Attendees'} value={form.maxAttendees || (isAr ? 'غير محدود' : 'Unlimited')} />
                    <Row label={isAr ? 'طريقة الدفع' : 'Payment'} value={form.offlinePaymentType === 'online' ? (isAr ? 'دفع مسبق' : 'Online') : (isAr ? 'في المقر' : 'On Site')} />
                  </>
                )}
                {form.type === 'recorded' && (
                  <Row label={isAr ? 'الأقسام' : 'Sections'}
                    value={form.sections.filter(s => s.title.trim()).map(s => s.title).join('، ') || (isAr ? 'لا توجد' : 'None')} />
                )}
              </div>

              <div>
                <label className={labelCls}>{isAr ? 'حالة النشر' : 'Publish Status'}</label>
                <div className="flex gap-3">
                  {[
                    { value: 'DRAFT', ar: 'حفظ كمسودة', en: 'Save as Draft', descAr: 'لن يُعرض للطلاب', descEn: 'Won\'t be visible to students' },
                    { value: 'PENDING_REVIEW', ar: 'إرسال للمراجعة', en: 'Submit for Review', descAr: 'سيراجعه فريق DeveWay', descEn: 'DeveWay team will review' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => set('status', opt.value)}
                      className={`flex-1 rounded-xl border p-3 text-right transition-all ${
                        form.status === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-foreground hover:border-primary/50'
                      }`}>
                      <div className="text-sm font-bold">{isAr ? opt.ar : opt.en}</div>
                      <div className="text-xs text-[color:var(--muted)] mt-0.5">{isAr ? opt.descAr : opt.descEn}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className="rounded-xl border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-[color:var(--surface-2)] disabled:opacity-30 transition-all flex items-center gap-2">
            <ChevronRight className="h-4 w-4" /> {isAr ? 'السابق' : 'Back'}
          </button>

          {step < 4 ? (
            <button onClick={() => { setError(''); setStep(s => Math.min(4, s + 1)) }} disabled={!canProceed()}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2">
              {isAr ? 'التالي' : 'Next'} <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all">
              {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {saving ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء الكورس' : 'Create Course')}
            </button>
          )}
        </div>
      </div>
    </AuthGate>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[color:var(--muted)] shrink-0">{label}</span>
      <span className="text-foreground font-medium text-left break-all">{value}</span>
    </div>
  )
}
