'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // ✅ NEW: Added for navigation
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { api, get } from '../../../../lib/api'
import { CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, PlusCircle, ExternalLink } from 'lucide-react'

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

export default function AdminCoursesPage() {
  const locale = useLocale()
  const router = useRouter() // ✅ NEW: Router for navigation
  const isAr = locale === 'ar'
  
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  // ✅ REMOVED: All modal state (no more broken modal!)

  function fetchCourses() {
    setLoading(true)
    api.get('/admin/courses', { params: { page, limit: 20, search: search || undefined } })
      .then((res) => {
        const d = res.data.data ?? res.data
        setCourses(d.courses ?? d.items ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchCourses, [page, search])

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

  // ✅ NEW: Navigate to professional create page
  function goToCreateCourse() {
    router.push(`/${locale}/admin/create-course`)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PUBLISHED: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      DRAFT: 'bg-amber-900/30 text-amber-400 border-amber-800',
      PENDING_REVIEW: 'bg-blue-900/30 text-blue-400 border-blue-800',
      ARCHIVED: 'bg-gray-800 text-gray-400 border-gray-700',
    }
    return map[status] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PUBLISHED: isAr ? 'منشور' : 'Published',
      DRAFT: isAr ? 'مسودة' : 'Draft',
      PENDING_REVIEW: isAr ? 'قيد المراجعة' : 'Pending Review',
      ARCHIVED: isAr ? 'أرشيف' : 'Archived',
    }
    return map[status] || status
  }

  return (
    <div className="space-y-5">
      {/* ─── Header with Navigation Button ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{isAr ? 'إدارة الكورسات' : 'Course Management'}</h1>
          <span className="text-sm text-gray-400">{total} {isAr ? 'كورس' : 'courses'}</span>
        </div>
        
        {/* ✅ UPDATED: Button now navigates to create page */}
        <button
          onClick={goToCreateCourse}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 group"
        >
          <PlusCircle size={18} className="group-hover:scale-110 transition-transform" />
          {isAr ? 'إضافة كورس جديد' : 'Add New Course'}
          <ExternalLink size={14} className="opacity-60" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: total, color: 'text-white' },
          { label: isAr ? 'منشور' : 'Published', value: courses.filter(c => c.status === 'PUBLISHED').length, color: 'text-green-400' },
          { label: isAr ? 'مسودة' : 'Draft', value: courses.filter(c => c.status === 'DRAFT').length, color: 'text-amber-400' },
          { label: isAr ? 'قيد المراجعة' : 'Pending', value: courses.filter(c => c.status === 'PENDING_REVIEW').length, color: 'text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setSearch(searchInput) } }}
            placeholder={isAr ? 'بحث في الكورسات...' : 'Search courses...'}
            className="w-full pl-8 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => { setPage(1); setSearch(searchInput) }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {isAr ? 'بحث' : 'Search'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-3"></div>
          <p className="text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      ) : (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">{isAr ? 'الكورس' : 'Course'}</th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">{isAr ? 'السعر' : 'Price'}</th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">{isAr ? 'المشتركون' : 'Students'}</th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                        <Search size={24} className="text-gray-600" />
                      </div>
                      <p className="text-gray-500 font-medium">{isAr ? 'لا توجد كورسات' : 'No courses found'}</p>
                      <button
                        onClick={goToCreateCourse}
                        className="mt-2 text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1"
                      >
                        <PlusCircle size={14} />
                        {isAr ? 'أضف كورس جديد' : 'Add your first course'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
                          {(c.title || c.titleEn || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-purple-300 transition-colors">
                            {c.title || c.titleEn || c.titleAr || '—'}
                          </p>
                          {c.titleAr && (
                            <p className="text-xs text-gray-500 mt-0.5">{c.titleAr}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-sm">{c.careerPath?.titleEn ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statusBadge(c.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          c.status === 'PUBLISHED' ? 'bg-green-400' :
                          c.status === 'DRAFT' ? 'bg-amber-400' :
                          c.status === 'PENDING_REVIEW' ? 'bg-blue-400' : 'bg-gray-400'
                        }`} />
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-green-400">
                        {c.price ? `${c.price}` : (isAr ? 'مجاني' : 'Free')}
                      </span>
                      {c.currency && <span className="text-gray-500 text-xs ml-1">{c.currency}</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-300">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-gray-800 text-xs">
                        {c._count?.enrollments ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* View/Edit */}
                        <button 
                          onClick={() => router.push(`/${locale}/admin/courses/${c.id}`)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title={isAr ? 'عرض' : 'View'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        
                        {c.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => approve(c.id)}
                            disabled={processing === c.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 disabled:opacity-50 text-green-400 text-[11px] font-semibold rounded-lg transition-colors border border-green-600/30"
                          >
                            <CheckCircle size={12} /> {isAr ? 'نشر' : 'Publish'}
                          </button>
                        )}
                        {c.status === 'PUBLISHED' && (
                          <button
                            onClick={() => reject(c.id)}
                            disabled={processing === c.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 text-red-400 text-[11px] font-semibold rounded-lg transition-colors border border-red-600/30"
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

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-gray-500">
            {isAr ? `صفحة ${page} من ${Math.ceil(total / 20)}` : `Page ${page} of ${Math.ceil(total / 20)}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={14} /> {isAr ? 'السابق' : 'Prev'}
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={courses.length < 20}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 disabled:opacity-40 transition-all"
            >
              {isAr ? 'التالي' : 'Next'} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ✅ INFO Banner - tells admin about the new flow */}
      <div className="rounded-xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700/30 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
          <PlusCircle size={16} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-purple-300">
            {isAr ? 'إنشاء كورس احترافي' : 'Professional Course Creation'}
          </p>
          <p className="text-xs text-purple-400/70 mt-1">
            {isAr 
              ? 'اضغط على "إضافة كورس جديد" لفتح صفحة إنشاء احترافية مع دعم رفع الصور والفيديوهات والتحكم الكامل في التفاصيل.'
              : 'Click "Add New Course" to open a professional creation page with image/video upload and full control over details.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}