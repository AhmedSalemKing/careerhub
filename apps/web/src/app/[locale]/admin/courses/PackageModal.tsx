'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../../lib/api'
import { formatCoursePrice } from '../../../../lib/market'

type PathOption = { id: string; title: string; slug?: string }
type CourseRow = {
  id: string
  title: string
  category: string
  priceText: string
}

// Used only when GET /career/paths fails
const FALLBACK_PATHS: PathOption[] = [
  { id: 'frontend-developer', title: 'مطور واجهات' },
  { id: 'data-analysis', title: 'تحليل البيانات' },
  { id: 'digital-marketing', title: 'التسويق الرقمي' },
  { id: 'cybersecurity', title: 'الأمن السيبراني' },
  { id: 'ux-ui-design', title: 'تصميم UX/UI' },
]

export function PackageModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [builtIn, setBuiltIn] = useState<PathOption[]>([])
  const [apiTracks, setApiTracks] = useState<PathOption[]>([])
  const paths = useMemo(() => {
    const taken = new Set(apiTracks.map((t) => t.slug ?? t.id))
    return [...apiTracks, ...builtIn.filter((p) => !taken.has(p.slug ?? p.id))]
  }, [apiTracks, builtIn])
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [pathId, setPathId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/career/paths')
      .then((res) => {
        const d = (res.data as any)
        const arr = d?.data?.careerPaths ?? d?.data ?? d ?? []
        const list: PathOption[] = (Array.isArray(arr) ? arr : [])
          .map((p: any) => ({ id: p.id, slug: p.slug, title: p.titleAr || p.title || p.titleEn || '' }))
          .filter((p: PathOption) => p.id && p.title)
        if (!cancelled) setBuiltIn(list.length ? list : FALLBACK_PATHS)
      })
      .catch((e) => {
        console.error('[PackageModal] GET /career/paths failed:', e?.response?.status, e?.response?.data ?? e?.message)
        if (!cancelled) setBuiltIn(FALLBACK_PATHS)
      })

    // tracks managed in the admin panel; they win over a built-in path with the same slug
    api
      .get('/tracks', { params: { lang: 'ar' } })
      .then((res) => {
        const arr = (res.data as any)?.data
        const list: PathOption[] = (Array.isArray(arr) ? arr : [])
          .map((t: any) => ({ id: t.id, slug: t.slug, title: t.name || '' }))
          .filter((t: PathOption) => t.id && t.title)
        if (!cancelled) setApiTracks(list)
      })
      .catch((e) => console.error('[PackageModal] GET /tracks failed:', e?.response?.status, e?.response?.data ?? e?.message))

    api
      .get('/admin/courses', { params: { page: 1, limit: 100 } })
      .then((res) => {
        const d = (res.data as any)?.data ?? res.data
        const arr: any[] = d?.courses ?? d?.items ?? []
        const rows: CourseRow[] = arr.map((c) => ({
          id: c.id,
          title: c.titleAr || c.title || c.titleEn || '',
          category: c.careerPath?.titleEn || c.category?.nameAr || c.category?.name || '',
          priceText: formatCoursePrice(c),
        }))
        if (!cancelled) setCourses(rows)
      })
      .catch((e) => console.error('[PackageModal] GET /admin/courses failed:', e?.response?.status, e?.response?.data ?? e?.message))

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? courses.filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) : courses
  }, [courses, query])

  const byId = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  async function submit() {
    setError(null)
    if (!pathId) return setError('اختر المسار المهني')
    if (selected.length === 0) return setError('اختر كورسًا واحدًا على الأقل')
    const final = Number(finalPrice)
    if (!finalPrice || !isFinite(final) || final <= 0) return setError('أدخل السعر النهائي')

    setSubmitting(true)
    try {
      await api.post('/packages', {
        pathId,
        courseIds: selected,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        finalPrice: final,
        notes: notes.trim() || undefined,
      })
      onCreated()
      onClose()
    } catch (e: any) {
      console.error('[PackageModal] POST /packages failed:', e?.response?.status, e?.response?.data ?? e?.message)
      const m = e?.response?.data?.message
      setError(
        (Array.isArray(m) ? m.join(' - ') : m) ||
          (e?.response?.status === 404 ? 'خدمة الباكدجات غير متاحة بعد' : 'تعذر إنشاء الباكدج، حاول مرة أخرى'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dw2-pk-overlay" onClick={onClose}>
      <div className="dw2-pk-box" dir="rtl" role="dialog" aria-modal="true" aria-label="إنشاء باكدج مسار" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dw2-pk-close" onClick={onClose} aria-label="إغلاق">×</button>
        <h2 className="dw2-pk-title">إنشاء باكدج مسار</h2>

        <label className="dw2-pk-label">المسار المهني</label>
        <select className="dw2-pk-input" value={pathId} onChange={(e) => setPathId(e.target.value)}>
          <option value="">اختر المسار</option>
          {paths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        <label className="dw2-pk-label">الكورسات المضمّنة في الباكدج</label>
        <input className="dw2-pk-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن كورس..." />
        <div className="dw2-pk-list">
          {filtered.length === 0 && <p className="dw2-pk-empty">لا توجد كورسات</p>}
          {filtered.map((c) => (
            <label key={c.id} className="dw2-pk-row">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
              <span className="dw2-pk-row-title">{c.title}</span>
              {c.category && <span className="dw2-pk-meta">({c.category})</span>}
              <span className="dw2-pk-meta">({c.priceText})</span>
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="dw2-pk-tags">
            {selected.map((id) => (
              <span key={id} className="dw2-pk-tag">
                {byId.get(id)?.title ?? id}
                <button type="button" onClick={() => toggle(id)} aria-label="إزالة">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="dw2-pk-prices">
          <div>
            <label className="dw2-pk-label">السعر قبل الخصم (اختياري)</label>
            <div className="dw2-pk-suffix">
              <input className="dw2-pk-input" type="number" min={0} value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="٣٬٠٠٠" />
              <span>ر.س</span>
            </div>
          </div>
          <div>
            <label className="dw2-pk-label">السعر النهائي</label>
            <div className="dw2-pk-suffix">
              <input className="dw2-pk-input" type="number" min={0} value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} placeholder="٢٬٩٠٠" />
              <span>ر.س</span>
            </div>
          </div>
        </div>

        <label className="dw2-pk-label">ملاحظة (اختياري)</label>
        <textarea className="dw2-pk-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <button type="button" className="dw2-pk-submit" onClick={submit} disabled={submitting}>
          {submitting ? 'جارٍ الإنشاء...' : 'إنشاء الباكدج'}
        </button>
        {error && <p className="dw2-pk-error" role="alert">{error}</p>}
        <button type="button" className="dw2-pk-cancel" onClick={onClose}>إلغاء</button>
      </div>
    </div>
  )
}
