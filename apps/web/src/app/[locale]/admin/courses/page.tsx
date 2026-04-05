'use client'
import { useState, useEffect } from 'react'
import { api } from '../../../../lib/api'
import { CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'

type AdminCourse = {
  id: string
  titleEn?: string
  titleAr?: string
  status: string
  price?: number
  currency?: string
  createdAt: string
  careerPath?: { titleEn: string } | null
  _count?: { enrollments: number }
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

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
    try {
      await api.patch(`/admin/courses/${id}/approve`)
      fetchCourses()
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  async function reject(id: string) {
    const reason = prompt('Rejection reason:') ?? ''
    setProcessing(id)
    try {
      await api.patch(`/admin/courses/${id}/reject`, { reason })
      fetchCourses()
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PUBLISHED: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      DRAFT: 'bg-amber-900/30 text-amber-400 border-amber-800',
      ARCHIVED: 'bg-gray-800 text-gray-400 border-gray-700',
    }
    return map[status] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Courses</h1>
        <span className="text-sm text-gray-400">{total} total</span>
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
            placeholder="Search courses..."
            className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setPage(1); setSearch(searchInput) }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-16">Loading...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Enrollments</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-12">No courses found</td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{c.titleEn || c.titleAr || '—'}</p>
                      {c.titleAr && c.titleEn && (
                        <p className="text-xs text-gray-400">{c.titleAr}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{c.careerPath?.titleEn ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${statusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {c.price ? `${c.price} ${c.currency ?? 'USD'}` : 'Free'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{c._count?.enrollments ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {c.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => approve(c.id)}
                            disabled={processing === c.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            <CheckCircle size={12} /> Publish
                          </button>
                        )}
                        {c.status === 'PUBLISHED' && (
                          <button
                            onClick={() => reject(c.id)}
                            disabled={processing === c.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            <XCircle size={12} /> Unpublish
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

      {total > 20 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={courses.length < 20}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
