'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { api } from '../../../../lib/api'
import {
  CheckCircle, XCircle, Search, ChevronLeft, ChevronRight,
  PlusCircle, ExternalLink, BookOpen, Eye,
} from 'lucide-react'

type AdminCourse = {
  id: string
  titleEn?: string
  titleAr?: string
  title?: string
  status: string
  price?: number
  currency?: string
  createdAt: string
  careerPath?: { titleEn: string } | null
  _count?: { enrollments: number }
}

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW' | 'ARCHIVED'

export default function AdminCoursesPage() {
  const locale = useLocale()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isAr = locale === 'ar'

  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [counts, setCounts] = useState({ all: 0, published: 0, draft: 0, pending: 0 })

  useEffect(() => {
    api.get('/admin/courses/counts')
      .then((res) => { const d = res.data.data ?? res.data; setCounts(d) })
      .catch(() => {})
  }, [])

  function fetchCourses() {
    setLoading(true)
    api.get('/admin/courses', {
      params: {
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      },
    })
      .then((res) => {
        const d = res.data.data ?? res.data
        setCourses(d.courses ?? d.items ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchCourses, [page, search, statusFilter])

  async function approve(id: string) {
    setProcessing(id)
    try { await api.patch(`/admin/courses/${id}/approve`); fetchCourses() }
    catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  async function reject(id: string) {
    const reason = prompt(isAr ? 'سبب الرفض:' : 'Rejection reason:') ?? ''
    setProcessing(id)
    try { await api.patch(`/admin/courses/${id}/reject`, { reason }); fetchCourses() }
    catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  function goToCreateCourse() {
    router.push(`/${locale}/admin/create-course`)
  }

  const filtered = courses

  const statusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      PUBLISHED: isDark
        ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      DRAFT: isDark
        ? 'bg-gray-800 text-gray-400 border-gray-700'
        : 'bg-gray-100 text-gray-600 border-gray-200',
      PENDING_REVIEW: isDark
        ? 'bg-amber-900/30 text-amber-400 border-amber-700'
        : 'bg-amber-50 text-amber-700 border-amber-200',
      ARCHIVED: isDark
        ? 'bg-gray-800 text-gray-500 border-gray-700'
        : 'bg-gray-100 text-gray-500 border-gray-200',
    }
    return map[status] ?? (isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200')
  }

  const statusDotClass = (status: string) => {
    const map: Record<string, string> = {
      PUBLISHED: 'bg-emerald-500',
      DRAFT: 'bg-gray-400',
      PENDING_REVIEW: 'bg-amber-500',
      ARCHIVED: 'bg-gray-400',
    }
    return map[status] ?? 'bg-gray-400'
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PUBLISHED: isAr ? 'منشور' : 'Published',
      DRAFT: isAr ? 'مسودة' : 'Draft',
      PENDING_REVIEW: isAr ? 'قيد المراجعة' : 'Pending',
      ARCHIVED: isAr ? 'أرشيف' : 'Archived',
    }
    return map[status] || status
  }

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'ALL', label: isAr ? 'الكل' : 'All', count: counts.all },
    { key: 'PUBLISHED', label: isAr ? 'منشور' : 'Published', count: counts.published },
    { key: 'PENDING_REVIEW', label: isAr ? 'قيد المراجعة' : 'Pending', count: counts.pending },
    { key: 'DRAFT', label: isAr ? 'مسودة' : 'Draft', count: counts.draft },
  ]

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--foreground)' }}
          >
            {isAr ? 'إدارة الكورسات' : 'Course Management'}
          </h1>
          <span
            className="text-sm"
            style={{ color: 'var(--muted)' }}
          >
            {total} {isAr ? 'كورس' : 'courses'}
          </span>
        </div>
        <button
          onClick={goToCreateCourse}
          className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all group"
          style={{
            background: '#5120c8',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(81,32,200,0.25)',
          }}
        >
          <PlusCircle size={18} className="group-hover:scale-110 transition-transform" />
          {isAr ? 'إضافة كورس جديد' : 'Add New Course'}
          <ExternalLink size={14} style={{ opacity: 0.6 }} />
        </button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: counts.all, color: '#5120c8' },
          { label: isAr ? 'منشور' : 'Published', value: counts.published, color: '#10b981' },
          { label: isAr ? 'قيد المراجعة' : 'Pending', value: counts.pending, color: '#f59e0b' },
          { label: isAr ? 'مسودة' : 'Draft', value: counts.draft, color: '#6b7280' },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl p-4 border transition-all hover:-translate-y-0.5"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Search + Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setSearch(searchInput) } }}
            placeholder={isAr ? 'بحث في الكورسات...' : 'Search courses...'}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
        <button
          onClick={() => { setPage(1); setSearch(searchInput) }}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors"
          style={{ background: '#5120c8', color: '#fff' }}
        >
          {isAr ? 'بحث' : 'Search'}
        </button>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: isActive ? 'rgba(81,32,200,0.15)' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#5120C8' : 'rgba(255,255,255,0.6)',
                border: isActive ? '1px solid rgba(81,32,200,0.3)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              <span style={{
                background: isActive ? 'rgba(81,32,200,0.3)' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              }}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* ─── Table ─── */}
      {loading ? (
        <div className="text-center py-20">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-t-transparent mb-3"
            style={{ borderColor: '#5120c8', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الكورس' : 'Course'}
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'التصنيف' : 'Category'}
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الحالة' : 'Status'}
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'السعر' : 'Price'}
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'المشتركون' : 'Students'}
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'إجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        <BookOpen size={24} style={{ color: 'var(--muted)' }} />
                      </div>
                      <p className="font-medium" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'لا توجد كورسات' : 'No courses found'}
                      </p>
                      <button
                        onClick={goToCreateCourse}
                        className="mt-2 text-sm font-medium flex items-center gap-1"
                        style={{ color: '#5120c8' }}
                      >
                        <PlusCircle size={14} />
                        {isAr ? 'أضف كورس جديد' : 'Add your first course'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="group transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                          style={{
                            background: isDark ? 'rgba(81,32,200,0.15)' : 'rgba(81,32,200,0.08)',
                            color: '#5120c8',
                          }}
                        >
                          {(c.title || c.titleEn || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p
                            className="font-medium group-hover:text-[#5120c8] transition-colors"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {c.title || c.titleEn || c.titleAr || '—'}
                          </p>
                          {c.titleAr && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{c.titleAr}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--muted)' }}>
                      {c.careerPath?.titleEn ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statusBadgeClass(c.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusDotClass(c.status)}`} />
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium" style={{ color: '#10b981' }}>
                        {c.price ? `${c.price}` : (isAr ? 'مجاني' : 'Free')}
                      </span>
                      {c.currency && (
                        <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>{c.currency}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-xs font-medium"
                        style={{
                          background: 'var(--surface-2)',
                          color: 'var(--foreground)',
                        }}
                      >
                        {c._count?.enrollments ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/${locale}/admin/courses/${c.id}`)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            background: 'var(--surface-2)',
                            color: 'var(--muted)',
                          }}
                          title={isAr ? 'عرض' : 'View'}
                        >
                          <Eye size={16} />
                        </button>

                        {c.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => approve(c.id)}
                            disabled={processing === c.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                            style={{
                              background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
                              color: isDark ? '#34d399' : '#059669',
                              border: isDark ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.2)',
                            }}
                          >
                            <CheckCircle size={12} /> {isAr ? 'نشر' : 'Publish'}
                          </button>
                        )}
                        {c.status === 'PUBLISHED' && (
                          <button
                            onClick={() => reject(c.id)}
                            disabled={processing === c.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                            style={{
                              background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
                              color: isDark ? '#f87171' : '#dc2626',
                              border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.2)',
                            }}
                          >
                            <XCircle size={12} /> {isAr ? 'إيقاف' : 'Unpublish'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Pagination ─── */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm pt-2">
          <span style={{ color: 'var(--muted)' }}>
            {isAr ? `صفحة ${page} من ${Math.ceil(total / 20)}` : `Page ${page} of ${Math.ceil(total / 20)}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <ChevronLeft size={14} /> {isAr ? 'السابق' : 'Prev'}
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={courses.length < 20}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              {isAr ? 'التالي' : 'Next'} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
