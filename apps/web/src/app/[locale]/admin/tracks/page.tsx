'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Download, Briefcase, BookOpen, Package } from 'lucide-react'
import { get, post, put, del } from '../../../../lib/api'
import { notify } from '../../../../lib/notify'
import { VisionBadges } from '../../../components/VisionBadge'

/* ── types ─────────────────────────────────────────────── */
type Vision = 'EG' | 'KSA'
interface JobRow {
  titleAr: string; titleEn: string; descAr: string; descEn: string
  salaryMinEG: string; salaryMaxEG: string; salaryMinKSA: string; salaryMaxKSA: string
  vision: Vision[]
}
interface CourseRow { order: string; titleAr: string; titleEn: string; type: string; typeEn: string; weeks: string; provider: string; language: string }
interface PackageRow { nameAr: string; nameEn: string; descAr: string; descEn: string; priceEG: string; priceKSA: string; sessions: string; isActive: boolean }

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
  vision2030: Vision[]
  skills: string[]
  skillsEn: string[]
  jobs: Record<string, any>[]
  courses: Record<string, any>[]
  packages: Record<string, any>[]
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
  vision2030: Vision[]
  skills: string[]; skillsEn: string[]
  jobs: JobRow[]
  courses: CourseRow[]
  packages: PackageRow[]
  freeItemsAr: string[]; freeItemsEn: string[]
  isActive: boolean
  country: 'EG' | 'KSA' | 'BOTH'
}

type Tab = 'basics' | 'jobs' | 'courses' | 'packages'

const emptyJob = (): JobRow => ({ titleAr: '', titleEn: '', descAr: '', descEn: '', salaryMinEG: '', salaryMaxEG: '', salaryMinKSA: '', salaryMaxKSA: '', vision: [] })
const emptyCourse = (n: number): CourseRow => ({ order: String(n), titleAr: '', titleEn: '', type: '', typeEn: '', weeks: '', provider: '', language: '' })
const emptyPackage = (): PackageRow => ({ nameAr: '', nameEn: '', descAr: '', descEn: '', priceEG: '', priceKSA: '', sessions: '', isActive: true })
const emptyForm = (): FormState => ({
  slug: '', slugTouched: false, nameAr: '', nameEn: '', descAr: '', descEn: '', weeks: '', level: '', levelEn: '', languages: 'العربية · الإنجليزية',
  vision2030: [], skills: [], skillsEn: [], jobs: [], courses: [], packages: [], freeItemsAr: [], freeItemsEn: [], isActive: true, country: 'BOTH',
})

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: string) => (v.trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v))
const visionOf = (v: unknown): Vision[] => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []).filter((x): x is Vision => x === 'EG' || x === 'KSA')

function fromRow(t: TrackRow): FormState {
  return {
    slug: t.slug, slugTouched: true, nameAr: t.nameAr, nameEn: t.nameEn, descAr: t.descAr, descEn: t.descEn, weeks: String(t.weeks),
    level: t.level, levelEn: t.levelEn, languages: t.languages, vision2030: visionOf(t.vision2030),
    skills: t.skills ?? [], skillsEn: t.skillsEn ?? [],
    jobs: (t.jobs ?? []).map((j) => {
      // rows saved by the first version carried one salary range + currency; keep it under the matching market
      const legacyKsa = j.currency === 'SAR'
      return {
        titleAr: str(j.titleAr), titleEn: str(j.titleEn), descAr: str(j.descAr), descEn: str(j.descEn),
        salaryMinEG: str(j.salaryMinEG ?? (!legacyKsa ? j.salaryMin : '')), salaryMaxEG: str(j.salaryMaxEG ?? (!legacyKsa ? j.salaryMax : '')),
        salaryMinKSA: str(j.salaryMinKSA ?? (legacyKsa ? j.salaryMin : '')), salaryMaxKSA: str(j.salaryMaxKSA ?? (legacyKsa ? j.salaryMax : '')),
        vision: visionOf(j.vision),
      }
    }),
    courses: (t.courses ?? []).map((c) => ({ order: str(c.order), titleAr: str(c.titleAr), titleEn: str(c.titleEn), type: str(c.type), typeEn: str(c.typeEn), weeks: str(c.weeks), provider: str(c.provider), language: str(c.language) })),
    packages: (t.packages ?? []).map((p) => ({ nameAr: str(p.nameAr), nameEn: str(p.nameEn), descAr: str(p.descAr), descEn: str(p.descEn), priceEG: str(p.priceEG), priceKSA: str(p.priceKSA), sessions: str(p.sessions), isActive: p.isActive !== false })),
    freeItemsAr: t.freeItemsAr ?? [], freeItemsEn: t.freeItemsEn ?? [], isActive: t.isActive, country: t.country,
  }
}

function toPayload(f: FormState) {
  return {
    slug: f.slug.trim(),
    nameAr: f.nameAr.trim(), nameEn: f.nameEn.trim(), descAr: f.descAr.trim(), descEn: f.descEn.trim(),
    weeks: Number(f.weeks),
    level: f.level.trim(), levelEn: f.levelEn.trim(), languages: f.languages.trim(),
    vision2030: f.vision2030,
    skills: f.skills, skillsEn: f.skillsEn,
    jobs: f.jobs.filter((j) => j.titleAr.trim() || j.titleEn.trim()).map((j) => ({
      titleAr: j.titleAr.trim(), titleEn: j.titleEn.trim(), descAr: j.descAr.trim(), descEn: j.descEn.trim(),
      salaryMinEG: num(j.salaryMinEG), salaryMaxEG: num(j.salaryMaxEG), salaryMinKSA: num(j.salaryMinKSA), salaryMaxKSA: num(j.salaryMaxKSA),
      vision: j.vision,
    })),
    courses: f.courses.filter((c) => c.titleAr.trim() || c.titleEn.trim()).map((c) => ({ ...c, order: num(c.order) ?? 0, weeks: num(c.weeks) ?? 0 })),
    packages: f.packages.filter((p) => p.nameAr.trim() || p.nameEn.trim()).map((p) => ({
      nameAr: p.nameAr.trim(), nameEn: p.nameEn.trim(), descAr: p.descAr.trim(), descEn: p.descEn.trim(),
      priceEG: num(p.priceEG), priceKSA: num(p.priceKSA), sessions: num(p.sessions) ?? 0, isActive: p.isActive,
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

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={'tk-field' + (wide ? ' wide' : '')}><label>{label}</label>{children}</div>
}

function VisionChecks({ value, onChange, label }: { value: Vision[]; onChange: (v: Vision[]) => void; label: string }) {
  return (
    <div className="tk-field wide">
      <label>{label}</label>
      <div className="tk-checks">
        {(['EG', 'KSA'] as const).map((v) => (
          <label key={v} className="tk-check">
            <input type="checkbox" checked={value.includes(v)} onChange={(e) => onChange(e.target.checked ? [...value, v] : value.filter((x) => x !== v))} />
            {v === 'EG' ? 'مصر / Egypt' : 'السعودية / Saudi Arabia'}
          </label>
        ))}
      </div>
    </div>
  )
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

  const { data: tracks = [], isLoading, error: listError, refetch } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: async () => {
      const res = await get('/admin/tracks')
      const d = (res?.data as any)?.data
      return (Array.isArray(d) ? d : []) as TrackRow[]
    },
    retry: 0,
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
    setEditing({ id: t?.id ?? null, form: t ? fromRow(t) : emptyForm() })
  }

  const f = editing?.form
  const set = (patch: Partial<FormState>) => setEditing((p) => (p ? { ...p, form: { ...p.form, ...patch } } : p))
  const missing = !f ? [] : [
    !f.nameAr.trim() && 'nameAr', !f.nameEn.trim() && 'nameEn', !f.descAr.trim() && 'descAr', !f.descEn.trim() && 'descEn', !f.slug && 'slug',
    !(Number(f.weeks) > 0) && 'weeks', !f.level.trim() && 'level', !f.levelEn.trim() && 'levelEn', !f.languages.trim() && 'languages',
  ].filter(Boolean)
  const valid = !!f && missing.length === 0

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'basics', label: isAr ? 'أساسيات' : 'Basics', icon: null },
    { key: 'jobs', label: isAr ? 'الوظائف' : 'Jobs', icon: <Briefcase size={14} />, count: f?.jobs.length },
    { key: 'courses', label: isAr ? 'الدورات' : 'Courses', icon: <BookOpen size={14} />, count: f?.courses.length },
    { key: 'packages', label: isAr ? 'الباقات' : 'Packages', icon: <Package size={14} />, count: f?.packages.length },
  ]

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="tk-page">
      <div className="tk-head">
        <div>
          <h1>{isAr ? 'المسارات' : 'Tracks'}</h1>
          <p>{isAr ? 'إدارة مسارات التعلّم، والوظائف والرواتب المتوقعة، والدورات والباقات' : 'Manage learning tracks, jobs and expected salaries, courses and packages'}</p>
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
        <div className="tk-cards">
          {tracks.map((t) => (
            <div key={t.id} className={'tk-card' + (t.isActive ? '' : ' off')}>
              <div className="tk-card-top">
                <div className="tk-card-names">
                  <h3>{t.nameAr}</h3>
                  <span dir="ltr">{t.nameEn}</span>
                </div>
                <button type="button" className={'tk-switch' + (t.isActive ? ' on' : '')} role="switch" aria-checked={t.isActive} disabled={toggleActive.isPending} onClick={() => toggleActive.mutate(t)} aria-label={isAr ? 'نشط' : 'Active'}>
                  <span />
                </button>
              </div>
              <div className="tk-card-meta">
                <span>{countryLabel(t.country)}</span>
                <span>{isAr ? `${t.weeks} أسبوعًا` : `${t.weeks} weeks`}</span>
                <span>{isAr ? `${(t.jobs ?? []).length} وظائف` : `${(t.jobs ?? []).length} jobs`}</span>
                <span>{isAr ? `${(t.courses ?? []).length} دورات` : `${(t.courses ?? []).length} courses`}</span>
                <span>{isAr ? `${(t.packages ?? []).length} باقات` : `${(t.packages ?? []).length} packages`}</span>
              </div>
              <VisionBadges vision={visionOf(t.vision2030)} locale={locale} compact />
              <code className="tk-slug">/{t.slug}</code>
              <div className="tk-card-foot">
                <span className={'tk-status' + (t.isActive ? ' on' : '')}>{t.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}</span>
                <div className="tk-actions">
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
                </div>
              </div>
            </div>
          ))}
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
              <h2>{editing.id ? (isAr ? 'تعديل مسار' : 'Edit track') : isAr ? 'إضافة مسار جديد' : 'Add track'}</h2>
              <button type="button" className="tk-icon" onClick={() => setEditing(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X size={18} /></button>
            </div>

            <div className="tk-tabs" role="tablist">
              {tabs.map((tb) => (
                <button key={tb.key} type="button" role="tab" aria-selected={tab === tb.key} className={'tk-tab' + (tab === tb.key ? ' on' : '')} onClick={() => setTab(tb.key)}>
                  {tb.icon}{tb.label}{tb.count ? <em>{tb.count}</em> : null}
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
                    <Field label="Slug"><input dir="ltr" value={f.slug} onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })} /></Field>
                    <Field label={isAr ? 'عدد الأسابيع' : 'Weeks'}><input type="number" min={1} value={f.weeks} onChange={(e) => set({ weeks: e.target.value })} /></Field>
                    <Field label="المستوى (عربي)"><input dir="rtl" value={f.level} onChange={(e) => set({ level: e.target.value })} placeholder="مبتدئ ← متوسط" /></Field>
                    <Field label="Level (English)"><input dir="ltr" value={f.levelEn} onChange={(e) => set({ levelEn: e.target.value })} placeholder="Beginner → Intermediate" /></Field>
                    <Field label={isAr ? 'اللغات' : 'Languages'}><input value={f.languages} onChange={(e) => set({ languages: e.target.value })} /></Field>
                    <Field label={isAr ? 'الدولة' : 'Market'}>
                      <select value={f.country} onChange={(e) => set({ country: e.target.value as FormState['country'] })}>
                        <option value="BOTH">{isAr ? 'مصر والسعودية' : 'Egypt & Saudi Arabia'}</option>
                        <option value="EG">{isAr ? 'مصر' : 'Egypt'}</option>
                        <option value="KSA">{isAr ? 'السعودية' : 'Saudi Arabia'}</option>
                      </select>
                    </Field>
                  </div>
                  <div className="tk-box">
                    <VisionChecks label={isAr ? 'رؤية 2030' : 'Vision 2030'} value={f.vision2030} onChange={(v) => set({ vision2030: v })} />
                    <VisionBadges vision={f.vision2030} locale={locale} />
                  </div>
                  <div className="tk-grid2">
                    <Tags label="المهارات (عربي)" value={f.skills} onChange={(v) => set({ skills: v })} dir="rtl" />
                    <Tags label="Skills (English)" value={f.skillsEn} onChange={(v) => set({ skillsEn: v })} dir="ltr" />
                    <Tags label="الخدمات المجانية (عربي)" value={f.freeItemsAr} onChange={(v) => set({ freeItemsAr: v })} dir="rtl" />
                    <Tags label="Free items (English)" value={f.freeItemsEn} onChange={(v) => set({ freeItemsEn: v })} dir="ltr" />
                  </div>
                  <label className="tk-check">
                    <input type="checkbox" checked={f.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
                    {isAr ? 'المسار نشط (يظهر للزوار)' : 'Active (visible to visitors)'}
                  </label>
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
                          <span>{isAr ? 'الراتب المتوقع — مصر (ج.م / شهرياً)' : 'Expected salary — Egypt (EGP / month)'}</span>
                          <input type="number" min={0} placeholder={isAr ? 'من' : 'From'} value={j.salaryMinEG} onChange={(e) => upd({ salaryMinEG: e.target.value })} />
                          <input type="number" min={0} placeholder={isAr ? 'إلى' : 'To'} value={j.salaryMaxEG} onChange={(e) => upd({ salaryMaxEG: e.target.value })} />
                        </div>
                        <div className="tk-sal">
                          <span>{isAr ? 'الراتب المتوقع — السعودية (ر.س / شهرياً)' : 'Expected salary — Saudi Arabia (SAR / month)'}</span>
                          <input type="number" min={0} placeholder={isAr ? 'من' : 'From'} value={j.salaryMinKSA} onChange={(e) => upd({ salaryMinKSA: e.target.value })} />
                          <input type="number" min={0} placeholder={isAr ? 'إلى' : 'To'} value={j.salaryMaxKSA} onChange={(e) => upd({ salaryMaxKSA: e.target.value })} />
                        </div>
                        <VisionChecks label={isAr ? 'رؤية 2030' : 'Vision 2030'} value={j.vision} onChange={(v) => upd({ vision: v })} />
                      </div>
                    )
                  })}
                  <button type="button" className="tk-btn" onClick={() => set({ jobs: [...f.jobs, emptyJob()] })}><Plus size={14} />{isAr ? 'إضافة وظيفة' : 'Add job'}</button>
                </>
              )}

              {tab === 'courses' && (
                <>
                  {f.courses.length === 0 && <p className="tk-muted">{isAr ? 'لا توجد دورات بعد.' : 'No courses yet.'}</p>}
                  {f.courses.map((c, i) => {
                    const upd = (patch: Partial<CourseRow>) => set({ courses: f.courses.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
                    return (
                      <div key={i} className="tk-item">
                        <div className="tk-item-head">
                          <b>{isAr ? `دورة ${i + 1}` : `Course ${i + 1}`}</b>
                          <button type="button" className="tk-icon" onClick={() => set({ courses: f.courses.filter((_, k) => k !== i) })} aria-label="remove"><Trash2 size={15} /></button>
                        </div>
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
                  <button type="button" className="tk-btn" onClick={() => set({ courses: [...f.courses, emptyCourse(f.courses.length + 1)] })}><Plus size={14} />{isAr ? 'إضافة دورة' : 'Add course'}</button>
                </>
              )}

              {tab === 'packages' && (
                <>
                  <p className="tk-muted">{isAr ? 'الباقات هي ما يظهر للزائر على صفحة المسار، بسعر لكل دولة.' : 'Packages are what visitors see on the track page, with a price per market.'}</p>
                  {f.packages.map((p, i) => {
                    const upd = (patch: Partial<PackageRow>) => set({ packages: f.packages.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
                    return (
                      <div key={i} className="tk-item">
                        <div className="tk-item-head">
                          <b>{isAr ? `باقة ${i + 1}` : `Package ${i + 1}`}</b>
                          <button type="button" className="tk-icon" onClick={() => set({ packages: f.packages.filter((_, k) => k !== i) })} aria-label="remove"><Trash2 size={15} /></button>
                        </div>
                        <div className="tk-grid2">
                          <Field label="اسم الباقة (عربي)"><input dir="rtl" value={p.nameAr} onChange={(e) => upd({ nameAr: e.target.value })} /></Field>
                          <Field label="Package name (English)"><input dir="ltr" value={p.nameEn} onChange={(e) => upd({ nameEn: e.target.value })} /></Field>
                          <Field label="الوصف (عربي)"><input dir="rtl" value={p.descAr} onChange={(e) => upd({ descAr: e.target.value })} /></Field>
                          <Field label="Description (English)"><input dir="ltr" value={p.descEn} onChange={(e) => upd({ descEn: e.target.value })} /></Field>
                        </div>
                        <div className="tk-grid4">
                          <Field label={isAr ? 'السعر — مصر (ج.م)' : 'Price — Egypt (EGP)'}><input type="number" min={0} value={p.priceEG} onChange={(e) => upd({ priceEG: e.target.value })} /></Field>
                          <Field label={isAr ? 'السعر — السعودية (ر.س)' : 'Price — Saudi (SAR)'}><input type="number" min={0} value={p.priceKSA} onChange={(e) => upd({ priceKSA: e.target.value })} /></Field>
                          <Field label={isAr ? 'جلسات الإرشاد' : 'Mentoring sessions'}><input type="number" min={0} value={p.sessions} onChange={(e) => upd({ sessions: e.target.value })} /></Field>
                          <label className="tk-check tk-check-end">
                            <input type="checkbox" checked={p.isActive} onChange={(e) => upd({ isActive: e.target.checked })} />
                            {isAr ? 'نشطة' : 'Active'}
                          </label>
                        </div>
                      </div>
                    )
                  })}
                  <button type="button" className="tk-btn" onClick={() => set({ packages: [...f.packages, emptyPackage()] })}><Plus size={14} />{isAr ? 'إضافة باقة' : 'Add package'}</button>
                </>
              )}
            </div>

            {formError && <p className="tk-error" role="alert">{formError}</p>}
            {!valid && <p className="tk-muted tk-hint">{isAr ? 'أكمل الحقول المطلوبة في تبويب «أساسيات» (الأسماء، الوصف، Slug، الأسابيع، المستوى، اللغات).' : 'Complete the required fields in the Basics tab (names, description, slug, weeks, level, languages).'}</p>}

            <div className="tk-modal-foot">
              <button type="button" className="tk-btn" onClick={() => setEditing(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="tk-btn primary" disabled={!valid || save.isPending}>{save.isPending ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : isAr ? 'حفظ' : 'Save'}</button>
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
        .tk-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .tk-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); }
        .tk-card.off { opacity: .75; }
        .tk-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .tk-card-names h3 { margin: 0; font-size: 16px; font-weight: 800; color: var(--ink); }
        .tk-card-names span { font-size: 12px; color: var(--ink-3); }
        .tk-card-meta { display: flex; flex-wrap: wrap; gap: 6px; }
        .tk-card-meta span { padding: 2px 8px; border-radius: 999px; background: var(--wash); color: var(--ink-2); font-size: 12px; }
        .tk-slug { font-size: 12px; color: var(--ink-3); direction: ltr; text-align: start; }
        .tk-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--line); }
        .tk-actions { display: flex; align-items: center; gap: 6px; }
        .tk-status { font-size: 12px; font-weight: 700; color: var(--ink-3); }
        .tk-status.on { color: var(--brand); }
        .tk-switch { position: relative; flex: none; width: 38px; height: 22px; border: 0; border-radius: 999px; background: var(--line-2, var(--line)); cursor: pointer; transition: background .15s; }
        .tk-switch span { position: absolute; top: 3px; inset-inline-start: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--bg); transition: inset-inline-start .15s; }
        .tk-switch.on { background: var(--brand); }
        .tk-switch.on span { inset-inline-start: 19px; }
        .tk-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: color-mix(in srgb, var(--night, var(--ink)) 55%, transparent); }
        .tk-modal { width: 100%; max-width: 720px; max-height: 80vh; display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; border: 1px solid var(--line); border-radius: 18px; background: var(--bg); font-size: 13px; }
        .tk-modal-head, .tk-modal-foot, .tk-item-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .tk-modal-foot { justify-content: flex-end; }
        .tk-modal-head h2 { margin: 0; font-size: 17px; font-weight: 800; }
        .tk-tabs { display: flex; gap: 4px; flex-wrap: wrap; padding: 3px; border-radius: 12px; background: var(--surface); }
        .tk-tab { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 0; border-radius: 9px; background: none; color: var(--ink-2); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .tk-tab.on { background: var(--bg); color: var(--brand); box-shadow: 0 0 0 1px var(--line); }
        .tk-tab em { font-style: normal; font-size: 11px; padding: 0 6px; border-radius: 999px; background: var(--wash); color: var(--ink-2); }
        .tk-body { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 2px 2px 6px; }
        .tk-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 10px; }
        .tk-grid4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px 10px; align-items: end; }
        .tk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .tk-field label, .tk-sal span { font-size: 12px; font-weight: 700; color: var(--ink-2); }
        .tk-modal input:not([type='checkbox']), .tk-modal select, .tk-modal textarea { width: 100%; padding: 7px 10px; border: 1.5px solid var(--line-2, var(--line)); border-radius: 9px; background: var(--bg) !important; color: var(--ink); font: inherit; font-size: 13px; outline: none; }
        .tk-modal input:focus, .tk-modal select:focus, .tk-modal textarea:focus { border-color: var(--brand); }
        .tk-box, .tk-item { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
        .tk-sal { display: grid; grid-template-columns: 1fr 100px 100px; gap: 8px; align-items: center; }
        .tk-checks { display: flex; flex-wrap: wrap; gap: 14px; }
        .tk-check { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
        .tk-check-end { align-self: end; padding-bottom: 8px; }
        .tk-tags { display: flex; flex-wrap: wrap; gap: 5px; padding: 4px; border: 1.5px solid var(--line-2, var(--line)); border-radius: 9px; background: var(--bg); }
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
