'use client'
import { useState, useEffect } from 'react'
import { api } from '../../../../lib/api'
import { Search, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

type AdminUser = {
  id: string
  email: string
  role: string
  accountType: string
  isActive: boolean
  status: string
  createdAt: string
  profile?: { firstName: string; lastName: string } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  function fetchUsers() {
    setLoading(true)
    api.get('/admin/users', { params: { page, limit: 20, search: search || undefined } })
      .then((res) => {
        const d = res.data.data ?? res.data
        setUsers(d.users ?? d.items ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchUsers, [page, search])

  async function ban(userId: string) {
    setProcessing(userId)
    try {
      await api.post(`/admin/users/${userId}/ban`)
      fetchUsers()
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  async function unban(userId: string) {
    setProcessing(userId)
    try {
      await api.post(`/admin/users/${userId}/unban`)
      fetchUsers()
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  async function remove(userId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setProcessing(userId)
    try {
      await api.delete(`/admin/users/${userId}`)
      fetchUsers()
    } catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  const statusBadge = (u: AdminUser) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      PENDING: 'bg-amber-900/30 text-amber-400 border-amber-800',
      REJECTED: 'bg-red-900/30 text-red-400 border-red-800',
      BANNED: 'bg-gray-800 text-gray-400 border-gray-700',
    }
    return map[u.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Users</h1>
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
            placeholder="Search by name or email..."
            className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setPage(1); setSearch(searchInput) }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-400 text-sm py-16">Loading...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Name / Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-12">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">
                        {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : '—'}
                      </p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{u.role}</td>
                    <td className="px-4 py-3 text-gray-300">{u.accountType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${statusBadge(u)}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {u.status === 'BANNED' ? (
                          <button
                            onClick={() => unban(u.id)}
                            disabled={processing === u.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            <CheckCircle size={12} /> Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => ban(u.id)}
                            disabled={processing === u.id || u.role === 'ADMIN'}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-700 hover:bg-orange-800 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            <Ban size={12} /> Ban
                          </button>
                        )}
                        <button
                          onClick={() => remove(u.id)}
                          disabled={processing === u.id || u.role === 'ADMIN'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
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
              disabled={users.length < 20}
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
