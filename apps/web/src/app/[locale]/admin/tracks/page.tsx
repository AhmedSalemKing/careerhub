'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Download } from 'lucide-react'
import { get, post, put, del } from '../../../../lib/api'
import { notify } from '../../../../lib/notify'
import { VisionBadges, VisionBox } from '../../../components/VisionBadge'
import { CustomSelect } from '../../../components/CustomSelect'
import { parseJsonArray } from '../../../../lib/tracks'

/* ── types ─────────────────────────────────────────────── */
type Vision = 'EG' | 'KSA'
interface JobRow {
  titleAr: string; titleEn: string; descAr: string; descEn: string
  salaryMinEG: string; salaryMaxEG: string; salaryMinKSA: string; salaryMaxKSA: string
}
interface CourseRow { order: string; titleAr: string; titleEn: string; type: string; typeEn: string; weeks: string; provider: string; language: string; courseId: string }
interface PlatformCourse { id: string; title: string }

interface TrackRow {
  id: string
  slug: string
  nameAr: string
  nameEn: string
  descAr: string
  descEn: string
  weeks: number
  level: string
  levelEn: string
  languages: string
  coverImage: string | null
  sessionPrice: number | null
  speciality: string | null
  visionDescKSA: string | null
  visionDescEG: string | null
  vision2030: Vision[]
  skills: string[]
  skillsEn: string[]
  jobs: Record<string, any>[]
  courses: Record<string, any>[]
  freeItemsAr: string[]
  freeItemsEn: string[]
  isActive: boolean
  country: 'EG' | 'KSA' | 'BOTH'
}

interface FormState {
  slug: string
  slugTouched: boolean
  nameAr: string; nameEn: string
  descAr: string; descEn: string
  weeks: string
  level: string; levelEn: string
  languages: string
  coverImage: string
  sessionPrice: string
  speciality: string
  visionDescKSA: string; visionDescEG: string
  vision2030: Vision[]
  skills: string[]; skillsEn: string[]
  jobs: JobRow[]
  courses: CourseRow[]
  freeItemsAr: string[]; freeItemsEn: string[]
  isActive: boolean
  country: 'EG' | 'KSA' | 'BOTH'
}

type Tab = 'basics' | 'content' | 'jobs' | 'vision'

const LEVELS = [
  { ar: 'مبتدئ', en: 'Beginner' },
  { ar: 'متوسط', en: 'Intermediate' },
  { ar: 'متقدم', en: 'Advanced' },
  { ar: 'مبتدئ ← متوسط', en: 'Beginner → Intermediate' },
  { ar: 'متوسط ← متقدم', en: 'Intermediate → Advanced' },
  { ar: 'جميع المستويات', en: 'All levels' },
]

const emptyJob = (): JobRow => ({ titleAr: '', titleEn: '', descAr: '', descEn: '', salaryMinEG: '', salaryMaxEG: '', salaryMinKSA: '', salaryMaxKSA: '' })
const emptyCourse = (n: number): CourseRow => ({ order: String(n), titleAr: '', titleEn: '', type: '', typeEn: '', weeks: '', provider: '', language: '', courseId: '' })
const emptyForm = (): FormState => ({
  slug: '', slugTouched: false, nameAr: '', nameEn: '', descAr: '', descEn: '', weeks: '', level: '', levelEn: '', languages: 'العربية · الإنجليزية',
  coverImage: '', sessionPrice: '', speciality: '', visionDescKSA: '', visionDescEG: '',
  vision2030: [], skills: [], skillsEn: [], jobs: [], courses: [], freeItemsAr: [], freeItemsEn: [], isActive: true, country: 'BOTH',
})

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: string) => (v.trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v))
const visionOf = (v: unknown): Vision[] => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []).filter((x): x is Vision => x === 'EG' || x === 'KSA')

function fromRow(t: TrackRow): FormState {
  return {
    slug: t.slug, slugTouched: true, nameAr: t.nameAr, nameEn: t.nameEn, descAr: t.descAr, descEn: t.descEn, weeks: String(t.weeks),
    level: t.level, levelEn: t.levelEn, languages: t.languages, coverImage: t.coverImage ?? '', sessionPrice: str(t.sessionPrice),
    speciality: t.speciality ?? '', visionDescKSA: t.visionDescKSA ?? '', visionDescEG: t.visionDescEG ?? '',
    vision2030: visionOf(t.vision2030), skills: t.skills ?? [], skillsEn: t.skillsEn ?? [],
    jobs: parseJsonArray<Record<string, any>>(t.jobs).map((j) => {
      // rows saved by the first version carried one salary range + currency; keep it under the matching market
      const legacyKsa = j.currency === 'SAR'
      return {
        titleAr: str(j.titleAr), titleEn: str(j.titleEn), descAr: str(j.descAr), descEn: str(j.descEn),
        salaryMinEG: str(j.salaryMinEG ?? (!legacyKsa ? j.salaryMin : '')), salaryMaxEG: str(j.salaryMaxEG ?? (!legacyKsa ? j.salaryMax : '')),
        salaryMinKSA: str(j.salaryMinKSA ?? (legacyKsa ? j.salaryMin : '')), salaryMaxKSA: str(j.salaryMaxKSA ?? (legacyKsa ? j.salaryMax : '')),
      }
    }),
    courses: parseJsonArray<Record<string, any>>(t.courses).map((c) => ({ order: str(c.order), titleAr: str(c.titleAr), titleEn: str(c.titleEn), type: str(c.type), typeEn: str(c.typeEn), weeks: str(c.weeks), provider: str(c.provider), language: str(c.language), courseId: str(c.courseId) })),
    freeItemsAr: t.freeItemsAr ?? [], freeItemsEn: t.freeItemsEn ?? [], isActive: t.isActive, country: t.country,
  }
}

function toPayload(f: FormState) {
  return {
    slug: f.slug.trim(),
    nameAr: f.nameAr.trim(), nameEn: f.nameEn.trim(), descAr: f.descAr.trim(), descEn: f.descEn.trim(),
    weeks: Number(f.weeks),
    level: f.level.trim(), levelEn: f.levelEn.trim(), languages: f.languages.trim(),
    coverImage: f.coverImage.trim() || null,
    sessionPrice: num(f.sessionPrice),
    speciality: f.speciality.trim() || null,
    visionDescKSA: f.visionDescKSA.trim() || null,
    visionDescEG: f.visionDescEG.trim() || null,
    vision2030: f.vision2030,
    skills: f.skills, skillsEn: f.skillsEn,
    jobs: f.jobs.filter((j) => j.titleAr.trim() || j.titleEn.trim()).map((j) => ({
      titleAr: j.titleAr.trim(), titleEn: j.titleEn.trim(), descAr: j.descAr.trim(), descEn: j.descEn.trim(),
      salaryMinEG: num(j.salaryMinEG), salaryMaxEG: num(j.salaryMaxEG), salaryMinKSA: num(j.salaryMinKSA), salaryMaxKSA: num(j.salaryMaxKSA),
    })),
    courses: f.courses.filter((c) => c.titleAr.trim() || c.titleEn.trim()).map((c) => ({
      ...c, order: num(c.order) ?? 0, weeks: num(c.weeks) ?? 0, courseId: c.courseId || undefined,
    })),
    freeItemsAr: f.freeItemsAr, freeItemsEn: f.freeItemsEn,
    isActive: f.isActive, country: f.country,
  }
}

const errText = (e: any, fallback: string) => {
  const m = e?.response?.data?.message
  return Array.isArray(m) ? m.join(' · ') : m || fallback
}

/* ── small controls ────────────────────────────────────── */
function Tags({ label, value, onChange, dir }: { label: string; value: string[]; onChange: (v: string[]) => void; dir?: 'rtl' | 'ltr' }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setDraft('')
  }
  return (
    <div className="tk-field">
      <label>{label}</label>
      <div className="tk-tags">
        {value.map((t) => (
          <span key={t} className="tk-tag">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label="remove"><X size={12} /></button>
          </span>
        ))}
        <input dir={dir} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} onBlur={add} />
      </div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div className="tk-field"><label>{label}</label>{children}{hint && <small>{hint}</small>}</div>
}

/* ── page ──────────────────────────────────────────────── */
export default function AdminTracksPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const qc = useQueryClient()
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null)
  const [tab, setTab] = useState<Tab>('basics')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)

  const { data: tracks = [], isLoading, error: listError, refetch } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: async () => {
      const res = await get('/admin/tracks')
      const d = (res?.data as any)?.data
      return (Array.isArray(d) ? d : []) as TrackRow[]
    },
    retry: 0,
  })

  // platform courses for the optional "pick a course" dropdown
  const { data: platformCourses = [] } = useQuery({
    queryKey: ['admin-tracks-platform-courses'],
    enabled: !!editing,
    staleTime: 5 * 60_000,
    retry: 0,
    queryFn: async () => {
      const res = await get('/courses', { params: { limit: 100 } })
      const d: any = res?.data
      const arr = d?.data?.courses ?? d?.data?.data ?? d?.data ?? d?.courses ?? d
      return (Array.isArray(arr) ? arr : [])
        .map((c: any) => ({ id: c.id, title: c.title || c.titleAr || c.titleEn || '' }))
        .filter((c: PlatformCourse) => c.id && c.title) as PlatformCourse[]
    },
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-tracks'] })
    qc.invalidateQueries({ queryKey: ['tracks'] })
    qc.invalidateQueries({ queryKey: ['career-track'] })
  }

  const save = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: FormState }) => {
      const payload = toPayload(form)
      return id ? put(`/admin/tracks/${id}`, payload) : post('/admin/tracks', payload)
    },
    onSuccess: () => { refresh(); notify.success(isAr ? 'تم حفظ المسار' : 'Track saved'); setEditing(null) },
    onError: (e: any) => setFormError(errText(e, isAr ? 'تعذّر حفظ المسار' : 'Could not save the track')),
  })

  const remove = useMutation({
    mutationFn: (id: string) => del(`/admin/tracks/${id}`),
    onSuccess: () => { refresh(); setDeletingId(null); notify.info(isAr ? 'تم حذف المسار' : 'Track deleted') },
    onError: (e: any) => notify.error(errText(e, isAr ? 'تعذّر حذف المسار' : 'Could not delete the track')),
  })

  const toggleActive = useMutation({
    mutationFn: (t: TrackRow) => put(`/admin/tracks/${t.id}`, { isActive: !t.isActive }),
    onSuccess: refresh,
    onError: (e: any) => notify.error(errText(e, isAr ? 'تعذّر التحديث' : 'Could not update')),
  })

  const importPaths = useMutation({
    mutationFn: () => post('/admin/tracks/import-career-paths'),
    onSuccess: (res: any) => {
      refresh()
      const d = res?.data?.data
      notify.success(isAr ? `تم استيراد ${d?.created ?? 0} مسار كمسودات (غير نشطة)` : `Imported ${d?.created ?? 0} paths as inactive drafts`)
    },
    onError: (e: any) => notify.error(errText(e, isAr ? 'تعذّر الاستيراد' : 'Import failed')),
  })

  const countryLabel = (c: string) => (c === 'EG' ? (isAr ? 'مصر' : 'Egypt') : c === 'KSA' ? (isAr ? 'السعودية' : 'Saudi Arabia') : isAr ? 'مصر والسعودية' : 'Egypt & Saudi')

  const open = (t?: TrackRow) => {
    setFormError('')
    setTab('basics')
    setImageMode('url')
    setEditing({ id: t?.id ?? null, form: t ? fromRow(t) : emptyForm() })
  }

  const f = editing?.form
  const set = (patch: Partial<FormState>) => setEditing((p) => (p ? { ...p, form: { ...p.form, ...patch } } : p))

  const uploadImage = async (file: File) => {
    setUploading(true)
    setFormError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await post('/upload/image', fd)
      const url = (res?.data as any)?.data?.url
      if (!url) throw new Error('no url')
      set({ coverImage: url })
    } catch (e: any) {
      setFormError(errText(e, isAr ? 'تعذّر رفع الصورة' : 'Image upload failed'))
    } finally {
      setUploading(false)
    }
  }

  const missing = !f ? [] : [
    !f.nameAr.trim() && 'nameAr', !f.nameEn.trim() && 'nameEn', !f.descAr.trim() && 'descAr', !f.descEn.trim() && 'descEn', !f.slug && 'slug',
    !(Number(f.weeks) > 0) && 'weeks', !f.level.trim() && 'level', !f.levelEn.trim() && 'levelEn', !f.languages.trim() && 'languages',
  ].filter(Boolean)
  const valid = !!f && missing.length === 0

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'basics', label: isAr ? 'الأساسيات' : 'Basics' },
    { key: 'content', label: isAr ? 'المحتوى' : 'Content', count: f?.courses.length },
    { key: 'jobs', label: isAr ? 'الوظائف' : 'Jobs', count: f?.jobs.length },
    { key: 'vision', label: isAr ? 'الرؤية' : 'Vision', count: f?.vision2030.length },
  ]

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="tk-page">
      <div className="tk-head">
        <div>
          <h1>{isAr ? 'المسارات' : 'Tracks'}</h1>
          <p>{isAr ? 'إدارة مسارات التعلّم والوظائف والرواتب المتوقعة والدورات ورؤية 2030' : 'Manage learning tracks, jobs and expected salaries, courses and Vision 2030'}</p>
        </div>
        <div className="tk-head-actions">
          <button type="button" className="tk-btn" disabled={importPaths.isPending} onClick={() => importPaths.mutate()} title={isAr ? 'ينشئ مسودات غير نشطة من المسارات المهنية الموجودة' : 'Creates inactive drafts from the existing career paths'}>
            <Download size={15} />{importPaths.isPending ? (isAr ? 'جارٍ الاستيراد…' : 'Importing…') : isAr ? 'استيراد من المسارات المهنية' : 'Import from career paths'}
          </button>
          <button type="button" className="tk-btn primary" onClick={() => open()}><Plus size={16} />{isAr ? 'إضافة مسار جديد' : 'Add track'}</button>
        </div>
      </div>

      {listError ? (
        <div className="tk-error" role="alert">
          <b>{isAr ? 'تعذّر تحميل المسارات' : 'Could not load tracks'}</b>
          <span>{errText(listError, '')}</span>
          <button type="button" className="tk-btn" onClick={() => refetch()}>{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      ) : isLoading ? (
        <p className="tk-muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
      ) : tracks.length === 0 ? (
        <div className="tk-empty">{isAr ? 'لا توجد مسارات بعد. أضف مساراً أو استورد من المسارات المهنية.' : 'No tracks yet. Add one or import from career paths.'}</div>
      ) : (
        <div className="tk-table-wrap">
          <table className="tk-table">
            <thead>
              <tr>
                <th>{isAr ? 'الاسم (عربي)' : 'Name (AR)'}</th>
                <th>{isAr ? 'الاسم (English)' : 'Name (EN)'}</th>
                <th>{isAr ? 'الدولة' : 'Market'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <b>{t.nameAr}</b>
                    <code className="tk-slug">/{t.slug}</code>
                    <span className="tk-counts">{isAr ? `${parseJsonArray(t.jobs).length} وظائف · ${parseJsonArray(t.courses).length} دورات` : `${parseJsonArray(t.jobs).length} jobs · ${parseJsonArray(t.courses).length} courses`}</span>
                  </td>
                  <td dir="ltr">{t.nameEn}</td>
                  <td>
                    <div>{countryLabel(t.country)}</div>
                    <VisionBadges vision={visionOf(t.vision2030)} locale={locale} compact all />
                  </td>
                  <td>
                    <button type="button" className={'tk-switch' + (t.isActive ? ' on' : '')} role="switch" aria-checked={t.isActive} disabled={toggleActive.isPending} onClick={() => toggleActive.mutate(t)} aria-label={isAr ? 'نشط' : 'Active'}>
                      <span />
                    </button>
                    <span className={'tk-status' + (t.isActive ? ' on' : '')}>{t.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'مخفي' : 'Hidden'}</span>
                  </td>
                  <td className="tk-actions">
                    {deletingId === t.id ? (
                      <>
                        <button type="button" className="tk-btn danger" disabled={remove.isPending} onClick={() => remove.mutate(t.id)}>{isAr ? 'تأكيد الحذف' : 'Confirm'}</button>
                        <button type="button" className="tk-btn" onClick={() => setDeletingId(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="tk-btn" onClick={() => open(t)}><Pencil size={14} />{isAr ? 'تعديل' : 'Edit'}</button>
                        <button type="button" className="tk-icon" onClick={() => setDeletingId(t.id)} aria-label={isAr ? 'حذف' : 'Delete'}><Trash2 size={15} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && f && (
        <div className="tk-overlay" onClick={() => setEditing(null)}>
          <form
            className="tk-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); setFormError(''); if (valid) save.mutate(editing) }}
          >
            <div className="tk-modal-head">
              <h2>{(isAr ? f.nameAr : f.nameEn) || (editing.id ? (isAr ? 'تعديل مسار' : 'Edit track') : isAr ? 'مسار جديد' : 'New track')}</h2>
              <button type="button" className="tk-icon" onClick={() => setEditing(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X size={18} /></button>
            </div>

            <div className="tk-tabs" role="tablist">
              {tabs.map((tb) => (
                <button key={tb.key} type="button" role="tab" aria-selected={tab === tb.key} className={'tk-tab' + (tab === tb.key ? ' on' : '')} onClick={() => setTab(tb.key)}>
                  {tb.label}{tb.count ? <em>{tb.count}</em> : null}
                </button>
              ))}
            </div>

            <div className="tk-body">
              {tab === 'basics' && (
                <>
                  <div className="tk-grid2">
                    <Field label="اسم المسار (عربي)"><input dir="rtl" value={f.nameAr} onChange={(e) => set({ nameAr: e.target.value })} /></Field>
                    <Field label="Track name (English)">
                      <input dir="ltr" value={f.nameEn} onChange={(e) => set({ nameEn: e.target.value, ...(f.slugTouched ? {} : { slug: slugify(e.target.value) }) })} />
                    </Field>
                    <Field label="الوصف (عربي)"><textarea dir="rtl" rows={3} value={f.descAr} onChange={(e) => set({ descAr: e.target.value })} /></Field>
                    <Field label="Description (English)"><textarea dir="ltr" rows={3} value={f.descEn} onChange={(e) => set({ descEn: e.target.value })} /></Field>
                    <div className="tk-span2">
                      <Field label={isAr ? 'المستوى (اختيار سريع)' : 'Level (quick pick)'}>
                        <CustomSelect
                          value={LEVELS.find((l) => l.ar === f.level && l.en === f.levelEn)?.ar ?? ''}
                          onChange={(v) => { const l = LEVELS.find((x) => x.ar === v); if (l) set({ level: l.ar, levelEn: l.en }) }}
                          placeholder={isAr ? 'اختر المستوى…' : 'Choose a level…'}
                          options={LEVELS.map((l) => ({ value: l.ar, label: isAr ? l.ar : l.en }))}
                        />
                      </Field>
                    </div>
                    <Field label="المستوى (عربي)"><input dir="rtl" value={f.level} onChange={(e) => set({ level: e.target.value })} placeholder="مبتدئ ← متوسط" /></Field>
                    <Field label="Level (English)"><input dir="ltr" value={f.levelEn} onChange={(e) => set({ levelEn: e.target.value })} placeholder="Beginner → Intermediate" /></Field>
                    <Field label={isAr ? 'عدد الأسابيع' : 'Weeks'}><input type="number" min={1} value={f.weeks} onChange={(e) => set({ weeks: e.target.value })} /></Field>
                    <Field label={isAr ? 'اللغات' : 'Languages'}><input value={f.languages} onChange={(e) => set({ languages: e.target.value })} /></Field>
                    <Field label={isAr ? 'الدولة' : 'Market'}>
                      <CustomSelect
                        value={f.country}
                        onChange={(v) => set({ country: v as FormState['country'] })}
                        options={[
                          { value: 'BOTH', label: isAr ? 'الاثنان' : 'Both' },
                          { value: 'EG', label: isAr ? 'مصر' : 'Egypt' },
                          { value: 'KSA', label: isAr ? 'السعودية' : 'Saudi Arabia' },
                        ]}
                      />
                    </Field>
                    <Field label="Slug"><input dir="ltr" value={f.slug} onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })} /></Field>
                    <Field label={isAr ? 'التخصص (لربط المرشدين)' : 'Speciality (links mentors)'} hint={isAr ? 'يُطابق تخصص المرشد في ملفه' : "Matched against the mentor's speciality"}>
                      <input value={f.speciality} onChange={(e) => set({ speciality: e.target.value })} />
                    </Field>
                    <Field label={isAr ? 'سعر الجلسة (اختياري) ر.س' : 'Session price (optional) SAR'} hint={isAr ? 'إن تُرك فارغاً يُحسب من أقل مرشد' : 'Left empty, it is taken from the cheapest mentor'}>
                      <input type="number" min={0} value={f.sessionPrice} onChange={(e) => set({ sessionPrice: e.target.value })} />
                    </Field>
                  </div>

                  <div className="tk-box">
                    <label className="tk-block-title">{isAr ? 'صورة المسار (اختياري)' : 'Track image (optional)'}</label>
                    <div className="tk-checks">
                      <label className="tk-check"><input type="radio" name="imgmode" checked={imageMode === 'url'} onChange={() => setImageMode('url')} />{isAr ? 'رابط URL' : 'URL'}</label>
                      <label className="tk-check"><input type="radio" name="imgmode" checked={imageMode === 'upload'} onChange={() => setImageMode('upload')} />{isAr ? 'رفع من الجهاز' : 'Upload'}</label>
                    </div>
                    <div className="tk-img-row">
                      <div className="tk-img-input">
                        {imageMode === 'url' ? (
                          <input dir="ltr" type="url" placeholder="https://…" value={f.coverImage} onChange={(e) => set({ coverImage: e.target.value })} />
                        ) : (
                          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file); e.target.value = '' }} />
                        )}
                        {uploading && <small>{isAr ? 'جارٍ رفع الصورة…' : 'Uploading…'}</small>}
                      </div>
                      {f.coverImage.trim() && (
                        <div className="tk-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.coverImage.trim()} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                          <button type="button" className="tk-thumb-x" onClick={() => set({ coverImage: '' })} aria-label={isAr ? 'إزالة' : 'Remove'}><X size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="tk-check">
                    <input type="checkbox" checked={f.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
                    {isAr ? 'نشط (يظهر للزوار)' : 'Active (visible to visitors)'}
                  </label>
                </>
              )}

              {tab === 'content' && (
                <>
                  <div className="tk-grid2">
                    <Tags label="المهارات (عربي)" value={f.skills} onChange={(v) => set({ skills: v })} dir="rtl" />
                    <Tags label="Skills (English)" value={f.skillsEn} onChange={(v) => set({ skillsEn: v })} dir="ltr" />
                    <Tags label="الخدمات المجانية (عربي)" value={f.freeItemsAr} onChange={(v) => set({ freeItemsAr: v })} dir="rtl" />
                    <Tags label="Free items (English)" value={f.freeItemsEn} onChange={(v) => set({ freeItemsEn: v })} dir="ltr" />
                  </div>
                  <label className="tk-block-title">{isAr ? 'الدورات' : 'Courses'}</label>
                  {f.courses.length === 0 && <p className="tk-muted">{isAr ? 'لا توجد دورات بعد.' : 'No courses yet.'}</p>}
                  {f.courses.map((c, i) => {
                    const upd = (patch: Partial<CourseRow>) => set({ courses: f.courses.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
                    return (
                      <div key={i} className="tk-item">
                        <div className="tk-item-head">
                          <b>{isAr ? `دورة ${i + 1}` : `Course ${i + 1}`}</b>
                          <button type="button" className="tk-icon" onClick={() => set({ courses: f.courses.filter((_, k) => k !== i) })} aria-label="remove"><Trash2 size={15} /></button>
                        </div>
                        <Field label={isAr ? 'اختر كورس من المنصة (اختياري)' : 'Pick a platform course (optional)'}>
                          <CustomSelect
                            value={c.courseId}
                            onChange={(v) => {
                              const picked = platformCourses.find((p) => p.id === v)
                              upd({ courseId: v, ...(picked && !c.titleAr ? { titleAr: picked.title } : {}), ...(picked && !c.titleEn ? { titleEn: picked.title } : {}) })
                            }}
                            options={[{ value: '', label: isAr ? '— إدخال يدوي —' : '— Manual entry —' }, ...platformCourses.map((p) => ({ value: p.id, label: p.title }))]}
                          />
                        </Field>
                        <div className="tk-grid2">
                          <Field label="العنوان (عربي)"><input dir="rtl" value={c.titleAr} onChange={(e) => upd({ titleAr: e.target.value })} /></Field>
                          <Field label="Title (English)"><input dir="ltr" value={c.titleEn} onChange={(e) => upd({ titleEn: e.target.value })} /></Field>
                          <Field label="النوع (عربي)"><input dir="rtl" value={c.type} onChange={(e) => upd({ type: e.target.value })} placeholder="ذاتي / مباشر" /></Field>
                          <Field label="Type (English)"><input dir="ltr" value={c.typeEn} onChange={(e) => upd({ typeEn: e.target.value })} placeholder="Self-paced / Live" /></Field>
                        </div>
                        <div className="tk-grid4">
                          <Field label={isAr ? 'الترتيب' : 'Order'}><input type="number" min={0} value={c.order} onChange={(e) => upd({ order: e.target.value })} /></Field>
                          <Field label={isAr ? 'الأسابيع' : 'Weeks'}><input type="number" min={0} value={c.weeks} onChange={(e) => upd({ weeks: e.target.value })} /></Field>
                          <Field label={isAr ? 'جهة التدريب' : 'Provider'}><input value={c.provider} onChange={(e) => upd({ provider: e.target.value })} /></Field>
                          <Field label={isAr ? 'اللغة' : 'Language'}><input value={c.language} onChange={(e) => upd({ language: e.target.value })} /></Field>
                        </div>
                      </div>
                    )
                  })}
                  <button type="button" className="tk-btn" onClick={() => set({ courses: [...f.courses, emptyCourse(f.courses.length + 1)] })}><Plus size={14} />{isAr ? 'إضافة دورة جديدة' : 'Add course'}</button>
                </>
              )}

              {tab === 'jobs' && (
                <>
                  {f.jobs.length === 0 && <p className="tk-muted">{isAr ? 'لا توجد وظائف بعد.' : 'No jobs yet.'}</p>}
                  {f.jobs.map((j, i) => {
                    const upd = (patch: Partial<JobRow>) => set({ jobs: f.jobs.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
                    return (
                      <div key={i} className="tk-item">
                        <div className="tk-item-head">
                          <b>{isAr ? `وظيفة ${i + 1}` : `Job ${i + 1}`}</b>
                          <button type="button" className="tk-icon" onClick={() => set({ jobs: f.jobs.filter((_, k) => k !== i) })} aria-label="remove"><Trash2 size={15} /></button>
                        </div>
                        <div className="tk-grid2">
                          <Field label="عنوان الوظيفة (عربي)"><input dir="rtl" value={j.titleAr} onChange={(e) => upd({ titleAr: e.target.value })} /></Field>
                          <Field label="Job title (English)"><input dir="ltr" value={j.titleEn} onChange={(e) => upd({ titleEn: e.target.value })} /></Field>
                          <Field label="الوصف (عربي)"><input dir="rtl" value={j.descAr} onChange={(e) => upd({ descAr: e.target.value })} /></Field>
                          <Field label="Description (English)"><input dir="ltr" value={j.descEn} onChange={(e) => upd({ descEn: e.target.value })} /></Field>
                        </div>
                        <div className="tk-sal">
                          <span>{isAr ? 'الراتب المتوقع — مصر (ج.م / شهر)' : 'Expected salary — Egypt (EGP / month)'}</span>
                          <input type="number" min={0} placeholder={isAr ? 'من' : 'From'} value={j.salaryMinEG} onChange={(e) => upd({ salaryMinEG: e.target.value })} />
                          <input type="number" min={0} placeholder={isAr ? 'إلى' : 'To'} value={j.salaryMaxEG} onChange={(e) => upd({ salaryMaxEG: e.target.value })} />
                        </div>
                        <div className="tk-sal">
                          <span>{isAr ? 'الراتب المتوقع — السعودية (ر.س / شهر)' : 'Expected salary — Saudi Arabia (SAR / month)'}</span>
                          <input type="number" min={0} placeholder={isAr ? 'من' : 'From'} value={j.salaryMinKSA} onChange={(e) => upd({ salaryMinKSA: e.target.value })} />
                          <input type="number" min={0} placeholder={isAr ? 'إلى' : 'To'} value={j.salaryMaxKSA} onChange={(e) => upd({ salaryMaxKSA: e.target.value })} />
                        </div>
                      </div>
                    )
                  })}
                  <button type="button" className="tk-btn" onClick={() => set({ jobs: [...f.jobs, emptyJob()] })}><Plus size={14} />{isAr ? 'إضافة وظيفة' : 'Add job'}</button>
                </>
              )}

              {tab === 'vision' && (
                <>
                  <div className="tk-checks">
                    {(['KSA', 'EG'] as const).map((v) => (
                      <label key={v} className="tk-check">
                        <input type="checkbox" checked={f.vision2030.includes(v)} onChange={(e) => set({ vision2030: e.target.checked ? [...f.vision2030, v] : f.vision2030.filter((x) => x !== v) })} />
                        {v === 'KSA' ? (isAr ? 'رؤية السعودية 2030' : 'Saudi Vision 2030') : isAr ? 'رؤية مصر 2030' : 'Egypt Vision 2030'}
                      </label>
                    ))}
                  </div>
                  <div className="tk-grid2">
                    <Field label="وصف رؤية السعودية (عربي)"><textarea dir="rtl" rows={2} value={f.visionDescKSA} onChange={(e) => set({ visionDescKSA: e.target.value })} placeholder="التحول الرقمي ممكّن أساسي لرؤية 2030." /></Field>
                    <Field label="وصف رؤية مصر (عربي)"><textarea dir="rtl" rows={2} value={f.visionDescEG} onChange={(e) => set({ visionDescEG: e.target.value })} /></Field>
                  </div>
                  <div className="tk-preview">
                    <span className="tk-block-title">{isAr ? 'معاينة' : 'Preview'}</span>
                    {f.vision2030.length === 0 ? (
                      <p className="tk-muted">{isAr ? 'اختر رؤية لعرض المعاينة.' : 'Pick a vision to see the preview.'}</p>
                    ) : (
                      <VisionBox
                        all
                        vision={f.vision2030}
                        descKSA={f.visionDescKSA}
                        descEG={f.visionDescEG}
                        jobTitles={f.jobs.map((j) => (isAr ? j.titleAr || j.titleEn : j.titleEn || j.titleAr)).filter(Boolean)}
                        locale={locale}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {formError && <p className="tk-error" role="alert">{formError}</p>}
            {!valid && <p className="tk-muted tk-hint">{isAr ? 'أكمل الحقول المطلوبة في تبويب «الأساسيات» (الأسماء، الوصف، المستوى، الأسابيع، اللغات).' : 'Complete the required fields in the Basics tab (names, description, level, weeks, languages).'}</p>}

            <div className="tk-modal-foot">
              <button type="button" className="tk-btn" onClick={() => setEditing(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="tk-btn primary" disabled={!valid || save.isPending || uploading}>{save.isPending ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .tk-page { color: var(--ink); font-family: var(--font-ui); }
        .tk-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .tk-head h1 { margin: 0; font-size: 24px; font-weight: 900; color: var(--ink); }
        .tk-head p, .tk-muted { margin: 4px 0 0; font-size: 13px; color: var(--ink-3); }
        .tk-head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .tk-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .tk-btn.primary { background: var(--brand); border-color: var(--brand); color: var(--on-brand); }
        .tk-btn.danger { border-color: var(--error, var(--brand)); color: var(--error, var(--brand)); }
        .tk-btn:disabled { opacity: .5; cursor: not-allowed; }
        .tk-icon { display: inline-grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 8px; background: none; color: var(--ink-2); cursor: pointer; }
        .tk-icon:hover { background: var(--wash); }
        .tk-empty { padding: 40px; text-align: center; border: 1px dashed var(--line); border-radius: 16px; color: var(--ink-3); }
        .tk-table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); }
        .tk-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .tk-table th { padding: 12px 14px; text-align: start; font-size: 12px; color: var(--ink-3); border-bottom: 1px solid var(--line); }
        .tk-table td { padding: 12px 14px; border-bottom: 1px solid var(--line); vertical-align: middle; }
        .tk-table tr:last-child td { border-bottom: 0; }
        .tk-slug { display: block; margin-top: 2px; font-size: 11px; color: var(--ink-3); direction: ltr; text-align: start; }
        .tk-counts { display: block; margin-top: 2px; font-size: 11px; color: var(--ink-3); }
        .tk-status { margin-inline-start: 8px; font-size: 12px; font-weight: 700; color: var(--ink-3); }
        .tk-status.on { color: var(--brand); }
        .tk-actions { white-space: nowrap; text-align: end; }
        .tk-actions > * { margin-inline-start: 6px; }
        .tk-switch { position: relative; vertical-align: middle; width: 38px; height: 22px; border: 0; border-radius: 999px; background: var(--line-2, var(--line)); cursor: pointer; transition: background .15s; }
        .tk-switch span { position: absolute; top: 3px; inset-inline-start: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--bg); transition: inset-inline-start .15s; }
        .tk-switch.on { background: var(--brand); }
        .tk-switch.on span { inset-inline-start: 19px; }
        .tk-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: color-mix(in srgb, var(--night, var(--ink)) 55%, transparent); backdrop-filter: blur(3px); }
        .tk-modal { width: min(700px, 96vw); max-height: 72vh; display: flex; flex-direction: column; gap: 12px; padding: 24px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); box-shadow: 0 20px 60px color-mix(in srgb, var(--ink) 30%, transparent); font-size: 13px; }
        .tk-modal-head, .tk-modal-foot, .tk-item-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .tk-modal-foot { justify-content: flex-end; }
        .tk-modal-head h2 { margin: 0; font-size: 22px; font-weight: 800; color: var(--ink); }
        .tk-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--line); }
        .tk-tab { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; background: none; color: var(--ink-3); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .tk-tab.on { color: var(--brand); border-bottom-color: var(--brand); }
        .tk-tab em { font-style: normal; font-size: 11px; padding: 0 6px; border-radius: 999px; background: var(--wash); color: var(--ink-2); }
        .tk-body { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 2px 4px 6px 2px; }
        .tk-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
        .tk-span2 { grid-column: 1 / -1; }
        .tk-grid4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px 12px; align-items: end; }
        .tk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .tk-field label, .tk-sal span, .tk-block-title { font-size: 12px; font-weight: 700; color: var(--ink-2); }
        .tk-field small { font-size: 11px; color: var(--ink-3); }
        .tk-modal input:not([type='checkbox']):not([type='radio']), .tk-modal select, .tk-modal textarea { width: 100%; padding: 8px 10px; border: 1.5px solid var(--line-2, var(--line)); border-radius: 10px; background: var(--bg) !important; color: var(--ink); font: inherit; font-size: 13px; outline: none; }
        .tk-modal input:focus, .tk-modal select:focus, .tk-modal textarea:focus { border-color: var(--brand); }
        .tk-box, .tk-item, .tk-preview { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); }
        .tk-sal { display: grid; grid-template-columns: 1fr 110px 110px; gap: 8px; align-items: center; }
        .tk-checks { display: flex; flex-wrap: wrap; gap: 16px; }
        .tk-check { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
        .tk-img-row { display: flex; align-items: flex-start; gap: 12px; }
        .tk-img-input { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .tk-thumb { position: relative; flex: none; width: 80px; height: 80px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: var(--wash); }
        .tk-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tk-thumb-x { position: absolute; top: 4px; inset-inline-end: 4px; display: grid; place-items: center; width: 18px; height: 18px; border: 0; border-radius: 50%; background: var(--bg); color: var(--ink); cursor: pointer; }
        .tk-tags { display: flex; flex-wrap: wrap; gap: 5px; padding: 5px; border: 1.5px solid var(--line-2, var(--line)); border-radius: 10px; background: var(--bg); }
        .tk-tags input { flex: 1; min-width: 80px; border: 0 !important; padding: 3px 5px !important; }
        .tk-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: var(--wash); color: var(--ink); font-size: 12px; }
        .tk-tag button { display: grid; place-items: center; border: 0; background: none; color: var(--ink-3); cursor: pointer; padding: 0; }
        .tk-error { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 10px 12px; border: 1px solid var(--error, var(--line)); border-radius: 10px; color: var(--error, var(--ink)); font-size: 13px; }
        .tk-error .tk-btn { align-self: flex-start; }
        .tk-hint { margin: 0; }
        @media (max-width: 640px) {
          .tk-grid2, .tk-grid4 { grid-template-columns: 1fr 1fr; }
          .tk-sal { grid-template-columns: 1fr 1fr; }
          .tk-sal span { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  )
}
