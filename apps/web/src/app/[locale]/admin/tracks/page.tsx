'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { get, post, put, del } from '../../../../lib/api'
import { notify } from '../../../../lib/notify'
import { VisionBadges } from '../../../components/VisionBadge'

/* ── types ─────────────────────────────────────────────── */
interface JobRow { titleAr: string; titleEn: string; descAr: string; descEn: string; salaryMin: string; salaryMax: string; currency: string; vision: string }
interface CourseRow { order: string; titleAr: string; titleEn: string; type: string; typeEn: string; weeks: string; provider: string; language: string }

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
  vision2030: string[]
  priceEG: number | null
  priceKSA: number | null
  sessionPrice: number | null
  sessionPriceKSA: number | null
  skills: string[]
  skillsEn: string[]
  jobs: Record<string, unknown>[]
  courses: Record<string, unknown>[]
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
  vision2030: string[]
  priceEG: string; priceKSA: string
  sessionPrice: string; sessionPriceKSA: string
  skills: string[]; skillsEn: string[]
  jobs: JobRow[]
  courses: CourseRow[]
  freeItemsAr: string[]; freeItemsEn: string[]
  isActive: boolean
  country: 'EG' | 'KSA' | 'BOTH'
}

const emptyJob = (): JobRow => ({ titleAr: '', titleEn: '', descAr: '', descEn: '', salaryMin: '', salaryMax: '', currency: 'SAR', vision: '' })
const emptyCourse = (n: number): CourseRow => ({ order: String(n), titleAr: '', titleEn: '', type: '', typeEn: '', weeks: '', provider: '', language: '' })
const emptyForm = (): FormState => ({
  slug: '', slugTouched: false, nameAr: '', nameEn: '', descAr: '', descEn: '', weeks: '', level: '', levelEn: '', languages: 'العربية · الإنجليزية',
  vision2030: [], priceEG: '', priceKSA: '', sessionPrice: '', sessionPriceKSA: '', skills: [], skillsEn: [],
  jobs: [], courses: [], freeItemsAr: [], freeItemsEn: [], isActive: true, country: 'BOTH',
})

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: string) => (v.trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v))

function fromRow(t: TrackRow): FormState {
  return {
    slug: t.slug, slugTouched: true, nameAr: t.nameAr, nameEn: t.nameEn, descAr: t.descAr, descEn: t.descEn, weeks: String(t.weeks),
    level: t.level, levelEn: t.levelEn, languages: t.languages, vision2030: t.vision2030 ?? [],
    priceEG: str(t.priceEG), priceKSA: str(t.priceKSA), sessionPrice: str(t.sessionPrice), sessionPriceKSA: str(t.sessionPriceKSA),
    skills: t.skills ?? [], skillsEn: t.skillsEn ?? [],
    jobs: (t.jobs ?? []).map((j: any) => ({ titleAr: str(j.titleAr), titleEn: str(j.titleEn), descAr: str(j.descAr), descEn: str(j.descEn), salaryMin: str(j.salaryMin), salaryMax: str(j.salaryMax), currency: str(j.currency) || 'SAR', vision: str(j.vision) })),
    courses: (t.courses ?? []).map((c: any) => ({ order: str(c.order), titleAr: str(c.titleAr), titleEn: str(c.titleEn), type: str(c.type), typeEn: str(c.typeEn), weeks: str(c.weeks), provider: str(c.provider), language: str(c.language) })),
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
    priceEG: num(f.priceEG), priceKSA: num(f.priceKSA), sessionPrice: num(f.sessionPrice), sessionPriceKSA: num(f.sessionPriceKSA),
    skills: f.skills, skillsEn: f.skillsEn,
    jobs: f.jobs.filter((j) => j.titleAr.trim() || j.titleEn.trim()).map((j) => ({ ...j, salaryMin: num(j.salaryMin), salaryMax: num(j.salaryMax) })),
    courses: f.courses.filter((c) => c.titleAr.trim() || c.titleEn.trim()).map((c) => ({ ...c, order: num(c.order) ?? 0, weeks: num(c.weeks) ?? 0 })),
    freeItemsAr: f.freeItemsAr, freeItemsEn: f.freeItemsEn,
    isActive: f.isActive, country: f.country,
  }
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
        <input
          dir={dir}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          onBlur={add}
        />
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="tk-field"><label>{label}</label>{children}</div>
}

/* ── page ──────────────────────────────────────────────── */
export default function AdminTracksPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const qc = useQueryClient()
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: async () => {
      const res = await get('/admin/tracks')
      const d = (res?.data as any)?.data
      return (Array.isArray(d) ? d : []) as TrackRow[]
    },
  })

  const save = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: FormState }) => {
      const payload = toPayload(form)
      return id ? put(`/admin/tracks/${id}`, payload) : post('/admin/tracks', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tracks'] })
      qc.invalidateQueries({ queryKey: ['tracks'] })
      notify.success(isAr ? 'تم حفظ المسار' : 'Track saved')
      setEditing(null)
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message
      setFormError(Array.isArray(m) ? m.join(' · ') : m || (isAr ? 'تعذّر حفظ المسار' : 'Could not save the track'))
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => del(`/admin/tracks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tracks'] })
      qc.invalidateQueries({ queryKey: ['tracks'] })
      setDeletingId(null)
      notify.info(isAr ? 'تم حذف المسار' : 'Track deleted')
    },
    onError: () => notify.error(isAr ? 'تعذّر حذف المسار' : 'Could not delete the track'),
  })

  const countryLabel = (c: string) => (c === 'EG' ? (isAr ? 'مصر' : 'Egypt') : c === 'KSA' ? (isAr ? 'السعودية' : 'Saudi Arabia') : isAr ? 'الاثنان' : 'Both')

  const open = (t?: TrackRow) => {
    setFormError('')
    setEditing({ id: t?.id ?? null, form: t ? fromRow(t) : emptyForm() })
  }

  const f = editing?.form
  const set = (patch: Partial<FormState>) => setEditing((p) => (p ? { ...p, form: { ...p.form, ...patch } } : p))
  const valid = !!f && f.slug && f.nameAr.trim() && f.nameEn.trim() && f.descAr.trim() && f.descEn.trim() && Number(f.weeks) > 0 && f.level.trim() && f.levelEn.trim() && f.languages.trim()

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="tk-page">
      <div className="tk-head">
        <div>
          <h1>{isAr ? 'المسارات' : 'Tracks'}</h1>
          <p>{isAr ? 'إدارة مسارات التعلّم التي تظهر في الصفحة الرئيسية وصفحة المسارات المهنية' : 'Manage the learning tracks shown on the home page and the careers page'}</p>
        </div>
        <button type="button" className="tk-btn primary" onClick={() => open()}><Plus size={16} />{isAr ? 'إضافة مسار' : 'Add track'}</button>
      </div>

      {isLoading ? (
        <p className="tk-muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
      ) : tracks.length === 0 ? (
        <div className="tk-empty">{isAr ? 'لا توجد مسارات بعد.' : 'No tracks yet.'}</div>
      ) : (
        <div className="tk-table-wrap">
          <table className="tk-table">
            <thead>
              <tr>
                <th>{isAr ? 'الاسم (عربي)' : 'Name (AR)'}</th>
                <th>{isAr ? 'الاسم (English)' : 'Name (EN)'}</th>
                <th>Slug</th>
                <th>{isAr ? 'الدولة' : 'Market'}</th>
                <th>{isAr ? 'السعر' : 'Price'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => (
                <tr key={t.id}>
                  <td>{t.nameAr}</td>
                  <td>{t.nameEn}</td>
                  <td className="tk-mono">{t.slug}</td>
                  <td>{countryLabel(t.country)}</td>
                  <td>
                    {t.priceEG != null && <div>{t.priceEG.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</div>}
                    {t.priceKSA != null && <div>{t.priceKSA.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}</div>}
                    {t.priceEG == null && t.priceKSA == null && <span className="tk-muted">—</span>}
                  </td>
                  <td><span className={'tk-status' + (t.isActive ? ' on' : '')}>{t.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'متوقف' : 'Inactive'}</span></td>
                  <td className="tk-actions">
                    {deletingId === t.id ? (
                      <>
                        <button type="button" className="tk-btn danger" disabled={remove.isPending} onClick={() => remove.mutate(t.id)}>{isAr ? 'تأكيد الحذف' : 'Confirm'}</button>
                        <button type="button" className="tk-btn" onClick={() => setDeletingId(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="tk-icon" onClick={() => open(t)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil size={15} /></button>
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
              <h2>{editing.id ? (isAr ? 'تعديل مسار' : 'Edit track') : isAr ? 'إضافة مسار' : 'Add track'}</h2>
              <button type="button" className="tk-icon" onClick={() => setEditing(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X size={18} /></button>
            </div>

            <div className="tk-grid2">
              <Field label="اسم المسار (عربي)"><input dir="rtl" value={f.nameAr} onChange={(e) => set({ nameAr: e.target.value })} required /></Field>
              <Field label="Track name (English)">
                <input dir="ltr" value={f.nameEn} required onChange={(e) => set({ nameEn: e.target.value, ...(f.slugTouched ? {} : { slug: slugify(e.target.value) }) })} />
              </Field>
              <Field label="الوصف (عربي)"><textarea dir="rtl" rows={3} value={f.descAr} onChange={(e) => set({ descAr: e.target.value })} required /></Field>
              <Field label="Description (English)"><textarea dir="ltr" rows={3} value={f.descEn} onChange={(e) => set({ descEn: e.target.value })} required /></Field>
              <Field label="Slug"><input dir="ltr" value={f.slug} onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })} required /></Field>
              <Field label={isAr ? 'عدد الأسابيع' : 'Weeks'}><input type="number" min={1} value={f.weeks} onChange={(e) => set({ weeks: e.target.value })} required /></Field>
              <Field label="المستوى (عربي)"><input dir="rtl" value={f.level} onChange={(e) => set({ level: e.target.value })} placeholder="مبتدئ ← متوسط" required /></Field>
              <Field label="Level (English)"><input dir="ltr" value={f.levelEn} onChange={(e) => set({ levelEn: e.target.value })} placeholder="Beginner → Intermediate" required /></Field>
              <Field label={isAr ? 'اللغات' : 'Languages'}><input value={f.languages} onChange={(e) => set({ languages: e.target.value })} required /></Field>
              <Field label={isAr ? 'الدولة' : 'Market'}>
                <select value={f.country} onChange={(e) => set({ country: e.target.value as FormState['country'] })}>
                  <option value="BOTH">{isAr ? 'مصر والسعودية' : 'Egypt & Saudi Arabia'}</option>
                  <option value="EG">{isAr ? 'مصر' : 'Egypt'}</option>
                  <option value="KSA">{isAr ? 'السعودية' : 'Saudi Arabia'}</option>
                </select>
              </Field>
            </div>

            <div className="tk-block">
              <label className="tk-block-title">{isAr ? 'رؤية 2030' : 'Vision 2030'}</label>
              <div className="tk-checks">
                {(['EG', 'KSA'] as const).map((v) => (
                  <label key={v} className="tk-check">
                    <input
                      type="checkbox"
                      checked={f.vision2030.includes(v)}
                      onChange={(e) => set({ vision2030: e.target.checked ? [...f.vision2030, v] : f.vision2030.filter((x) => x !== v) })}
                    />
                    {v === 'EG' ? 'مصر / Egypt' : 'السعودية / Saudi Arabia'}
                  </label>
                ))}
              </div>
              <VisionBadges vision={f.vision2030} locale={locale} />
            </div>

            <div className="tk-grid2">
              <Field label={isAr ? 'سعر المسار — مصر (ج.م)' : 'Track price — Egypt (EGP)'}><input type="number" min={0} value={f.priceEG} onChange={(e) => set({ priceEG: e.target.value })} /></Field>
              <Field label={isAr ? 'سعر المسار — السعودية (ر.س)' : 'Track price — Saudi (SAR)'}><input type="number" min={0} value={f.priceKSA} onChange={(e) => set({ priceKSA: e.target.value })} /></Field>
              <Field label={isAr ? 'سعر الجلسة — مصر (ج.م)' : 'Session price — Egypt (EGP)'}><input type="number" min={0} value={f.sessionPrice} onChange={(e) => set({ sessionPrice: e.target.value })} /></Field>
              <Field label={isAr ? 'سعر الجلسة — السعودية (ر.س)' : 'Session price — Saudi (SAR)'}><input type="number" min={0} value={f.sessionPriceKSA} onChange={(e) => set({ sessionPriceKSA: e.target.value })} /></Field>
            </div>

            <div className="tk-grid2">
              <Tags label="المهارات (عربي)" value={f.skills} onChange={(v) => set({ skills: v })} dir="rtl" />
              <Tags label="Skills (English)" value={f.skillsEn} onChange={(v) => set({ skillsEn: v })} dir="ltr" />
              <Tags label="الخدمات المجانية (عربي)" value={f.freeItemsAr} onChange={(v) => set({ freeItemsAr: v })} dir="rtl" />
              <Tags label="Free items (English)" value={f.freeItemsEn} onChange={(v) => set({ freeItemsEn: v })} dir="ltr" />
            </div>

            <div className="tk-block">
              <div className="tk-block-head">
                <label className="tk-block-title">{isAr ? 'الوظائف' : 'Jobs'}</label>
                <button type="button" className="tk-btn" onClick={() => set({ jobs: [...f.jobs, emptyJob()] })}><Plus size={14} />{isAr ? 'إضافة' : 'Add'}</button>
              </div>
              {f.jobs.map((j, i) => {
                const upd = (patch: Partial<JobRow>) => set({ jobs: f.jobs.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
                return (
                  <div key={i} className="tk-row">
                    <input dir="rtl" placeholder="العنوان" value={j.titleAr} onChange={(e) => upd({ titleAr: e.target.value })} />
                    <input dir="ltr" placeholder="Title" value={j.titleEn} onChange={(e) => upd({ titleEn: e.target.value })} />
                    <input dir="rtl" placeholder="الوصف" value={j.descAr} onChange={(e) => upd({ descAr: e.target.value })} />
                    <input dir="ltr" placeholder="Description" value={j.descEn} onChange={(e) => upd({ descEn: e.target.value })} />
                    <input type="number" placeholder="Min" value={j.salaryMin} onChange={(e) => upd({ salaryMin: e.target.value })} />
                    <input type="number" placeholder="Max" value={j.salaryMax} onChange={(e) => upd({ salaryMax: e.target.value })} />
                    <select value={j.currency} onChange={(e) => upd({ currency: e.target.value })}>
                      <option value="SAR">SAR</option>
                      <option value="EGP">EGP</option>
                    </select>
                    <select value={j.vision} onChange={(e) => upd({ vision: e.target.value })}>
                      <option value="">{isAr ? 'بدون رؤية' : 'No vision'}</option>
                      <option value="KSA">KSA</option>
                      <option value="EG">EG</option>
                    </select>
                    <button type="button" className="tk-icon" onClick={() => set({ jobs: f.jobs.filter((_, k) => k !== i) })} aria-label="remove"><Trash2 size={15} /></button>
                  </div>
                )
              })}
            </div>

            <div className="tk-block">
              <div className="tk-block-head">
                <label className="tk-block-title">{isAr ? 'الدورات' : 'Courses'}</label>
                <button type="button" className="tk-btn" onClick={() => set({ courses: [...f.courses, emptyCourse(f.courses.length + 1)] })}><Plus size={14} />{isAr ? 'إضافة' : 'Add'}</button>
              </div>
              {f.courses.map((c, i) => {
                const upd = (patch: Partial<CourseRow>) => set({ courses: f.courses.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
                return (
                  <div key={i} className="tk-row">
                    <input type="number" placeholder="#" value={c.order} onChange={(e) => upd({ order: e.target.value })} />
                    <input dir="rtl" placeholder="العنوان" value={c.titleAr} onChange={(e) => upd({ titleAr: e.target.value })} />
                    <input dir="ltr" placeholder="Title" value={c.titleEn} onChange={(e) => upd({ titleEn: e.target.value })} />
                    <input dir="rtl" placeholder="النوع" value={c.type} onChange={(e) => upd({ type: e.target.value })} />
                    <input dir="ltr" placeholder="Type" value={c.typeEn} onChange={(e) => upd({ typeEn: e.target.value })} />
                    <input type="number" placeholder={isAr ? 'أسابيع' : 'Weeks'} value={c.weeks} onChange={(e) => upd({ weeks: e.target.value })} />
                    <input placeholder={isAr ? 'جهة التدريب' : 'Provider'} value={c.provider} onChange={(e) => upd({ provider: e.target.value })} />
                    <input placeholder={isAr ? 'اللغة' : 'Language'} value={c.language} onChange={(e) => upd({ language: e.target.value })} />
                    <button type="button" className="tk-icon" onClick={() => set({ courses: f.courses.filter((_, k) => k !== i) })} aria-label="remove"><Trash2 size={15} /></button>
                  </div>
                )
              })}
            </div>

            <label className="tk-check">
              <input type="checkbox" checked={f.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
              {isAr ? 'المسار نشط (يظهر للزوار)' : 'Active (visible to visitors)'}
            </label>

            {formError && <p className="tk-error" role="alert">{formError}</p>}

            <div className="tk-modal-foot">
              <button type="button" className="tk-btn" onClick={() => setEditing(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="tk-btn primary" disabled={!valid || save.isPending}>{save.isPending ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .tk-page { color: var(--ink); font-family: var(--font-ui); }
        .tk-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
        .tk-head h1 { margin: 0; font-size: 24px; font-weight: 900; color: var(--ink); }
        .tk-head p, .tk-muted { margin: 4px 0 0; font-size: 14px; color: var(--ink-3); }
        .tk-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
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
        .tk-mono { font-family: ui-monospace, monospace; font-size: 12px; color: var(--ink-3); }
        .tk-status { padding: 3px 10px; border-radius: 999px; background: var(--wash); color: var(--ink-3); font-size: 12px; font-weight: 700; }
        .tk-status.on { color: var(--brand); }
        .tk-actions { white-space: nowrap; text-align: end; }
        .tk-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 24px 12px; background: color-mix(in srgb, var(--night, var(--ink)) 55%, transparent); }
        .tk-modal { width: 100%; max-width: 920px; display: flex; flex-direction: column; gap: 16px; padding: 24px; border: 1px solid var(--line); border-radius: 20px; background: var(--bg); }
        .tk-modal-head, .tk-modal-foot, .tk-block-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .tk-modal-foot { justify-content: flex-end; }
        .tk-modal-head h2 { margin: 0; font-size: 20px; font-weight: 800; }
        .tk-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .tk-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .tk-field label, .tk-block-title { font-size: 13px; font-weight: 700; color: var(--ink-2); }
        .tk-modal input:not([type='checkbox']), .tk-modal select, .tk-modal textarea { width: 100%; padding: 9px 12px; border: 1.5px solid var(--line-2, var(--line)); border-radius: 10px; background: var(--bg) !important; color: var(--ink); font: inherit; font-size: 14px; outline: none; }
        .tk-modal input:focus, .tk-modal select:focus, .tk-modal textarea:focus { border-color: var(--brand); }
        .tk-block { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
        .tk-checks { display: flex; flex-wrap: wrap; gap: 16px; }
        .tk-check { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
        .tk-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) 80px 80px 90px 100px 32px; gap: 8px; align-items: center; }
        .tk-block:last-of-type .tk-row, .tk-row:has(input[placeholder='#']) { grid-template-columns: 56px repeat(4, minmax(0, 1fr)) 80px minmax(0, 1fr) minmax(0, 1fr) 32px; }
        .tk-tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; border: 1.5px solid var(--line-2, var(--line)); border-radius: 10px; background: var(--bg); }
        .tk-tags input { flex: 1; min-width: 90px; border: 0 !important; padding: 4px 6px !important; }
        .tk-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; background: var(--wash); color: var(--ink); font-size: 13px; }
        .tk-tag button { display: grid; place-items: center; border: 0; background: none; color: var(--ink-3); cursor: pointer; padding: 0; }
        .tk-error { margin: 0; padding: 10px 12px; border: 1px solid var(--error, var(--line)); border-radius: 10px; color: var(--error, var(--ink)); font-size: 14px; }
        @media (max-width: 760px) {
          .tk-grid2 { grid-template-columns: 1fr; }
          .tk-row, .tk-block:last-of-type .tk-row, .tk-row:has(input[placeholder='#']) { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
