'use client'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { api, post, patch } from '../../../../lib/api'
import { Search, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight, UserPlus, Eye, X } from 'lucide-react'

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

const MODAL_INPUT = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

export default function AdminUsersPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  // Create user modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', firstName: '', lastName: '', accountType: 'STUDENT' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

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
    try { await api.post(`/admin/users/${userId}/ban`); fetchUsers() }
    catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  async function unban(userId: string) {
    setProcessing(userId)
    try { await api.post(`/admin/users/${userId}/unban`); fetchUsers() }
    catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  async function remove(userId: string) {
    if (!confirm(isAr ? 'حذف هذا المستخدم؟ لا يمكن التراجع.' : 'Delete this user? Cannot be undone.')) return
    setProcessing(userId)
    try { await api.delete(`/admin/users/${userId}`); fetchUsers() }
    catch (e) { console.error(e) }
    finally { setProcessing(null) }
  }

  async function handleCreateUser() {
    setCreating(true)
    setCreateError('')
    try {
      await post('/admin/users/create', createForm)
      setShowCreate(false)
      setCreateForm({ email: '', password: '', firstName: '', lastName: '', accountType: 'STUDENT' })
      fetchUsers()
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || 'Error creating user')
    } finally { setCreating(false) }
  }

  async function handleRoleChange(userId: string, accountType: string) {
    try {
      await patch(`/admin/users/${userId}/role`, { accountType })
      fetchUsers()
    } catch (e) { console.error(e) }
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{isAr ? 'المستخدمون' : 'Users'}</h1>
          <span className="text-sm text-gray-400">{total} {isAr ? 'مستخدم' : 'total'}</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14 }}
        >
          <UserPlus size={16} />
          {isAr ? 'إضافة مستخدم' : 'Add User'}
        </button>
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
            placeholder={isAr ? 'بحث...' : 'Search by name or email...'}
            className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => { setPage(1); setSearch(searchInput) }}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {isAr ? 'بحث' : 'Search'}
        </button>
        {search && (
          <button
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            {isAr ? 'مسح' : 'Clear'}
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
                <th className="px-4 py-3 font-medium">{isAr ? 'الاسم / البريد' : 'Name / Email'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'الدور' : 'Role'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'النوع' : 'Type'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'تاريخ الانضمام' : 'Joined'}</th>
                <th className="px-4 py-3 font-medium text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-12">
                    {isAr ? 'لا يوجد مستخدمون' : 'No users found'}
                  </td>
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
                    <td className="px-4 py-3">
                      <select
                        defaultValue={u.accountType}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ padding: '4px 8px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#e0e0e0', fontSize: 12, cursor: 'pointer' }}
                      >
                        <option value="STUDENT">{isAr ? 'طالب' : 'Student'}</option>
                        <option value="INSTRUCTOR">{isAr ? 'محاضر' : 'Instructor'}</option>
                        <option value="CONSULTANT">{isAr ? 'مستشار' : 'Consultant'}</option>
                        <option value="ADMIN">{isAr ? 'مدير' : 'Admin'}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${statusBadge(u)}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <a
                          href={`/${locale}/admin/users/${u.id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(81,32,200,0.15)', color: '#A78BFA', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}
                        >
                          <Eye size={11} />
                          {isAr ? 'عرض' : 'View'}
                        </a>
                        {u.status === 'BANNED' ? (
                          <button
                            onClick={() => unban(u.id)}
                            disabled={processing === u.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            <CheckCircle size={12} /> {isAr ? 'رفع الحظر' : 'Unban'}
                          </button>
                        ) : (
                          <button
                            onClick={() => ban(u.id)}
                            disabled={processing === u.id || u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || u.accountType === 'SUPER_ADMIN'}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-700 hover:bg-orange-800 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            <Ban size={12} /> {isAr ? 'حظر' : 'Ban'}
                          </button>
                        )}
                        <button
                          onClick={() => remove(u.id)}
                          disabled={processing === u.id || u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || u.accountType === 'SUPER_ADMIN'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                        >
                          <Trash2 size={12} /> {isAr ? 'حذف' : 'Delete'}
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
            {isAr ? `صفحة ${page} من ${Math.ceil(total / 20)}` : `Page ${page} of ${Math.ceil(total / 20)}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} /> {isAr ? 'السابق' : 'Prev'}
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < 20}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {isAr ? 'التالي' : 'Next'} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, position: 'relative' }}>
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', margin: '0 0 20px' }}>
              {isAr ? 'إضافة مستخدم جديد' : 'Add New User'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  placeholder={isAr ? 'الاسم الأول' : 'First Name'}
                  value={createForm.firstName}
                  onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
                  style={MODAL_INPUT}
                />
                <input
                  placeholder={isAr ? 'اسم العائلة' : 'Last Name'}
                  value={createForm.lastName}
                  onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
                  style={MODAL_INPUT}
                />
              </div>
              <input
                type="email"
                placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                style={MODAL_INPUT}
              />
              <input
                type="password"
                placeholder={isAr ? 'كلمة المرور' : 'Password'}
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                style={MODAL_INPUT}
              />
              <select
                value={createForm.accountType}
                onChange={e => setCreateForm(f => ({ ...f, accountType: e.target.value }))}
                style={MODAL_INPUT}
              >
                <option value="STUDENT">{isAr ? 'طالب' : 'Student'}</option>
                <option value="INSTRUCTOR">{isAr ? 'محاضر' : 'Instructor'}</option>
                <option value="CONSULTANT">{isAr ? 'مستشار' : 'Consultant'}</option>
                <option value="ADMIN">{isAr ? 'مدير' : 'Admin'}</option>
              </select>
              {createError && (
                <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{createError}</p>
              )}
              <button
                onClick={handleCreateUser}
                disabled={creating || !createForm.email || !createForm.password || !createForm.firstName}
                style={{ background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: creating ? 0.7 : 1 }}
              >
                {creating ? '...' : (isAr ? 'إنشاء المستخدم' : 'Create User')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
