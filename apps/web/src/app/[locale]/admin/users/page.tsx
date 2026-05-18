'use client'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { api, post, patch } from '../../../../lib/api'
import { notify } from '../../../../lib/notify'
import { Search, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight, UserPlus, Eye, X, Shield } from 'lucide-react'
import { getMediaUrl } from '../../../../lib/media'
import VerifiedBadge from '../../../../components/VerifiedBadge'
import ConfirmModal from '@/components/ConfirmModal'

type AdminUser = {
  id: string
  email: string
  role: string
  accountType: string
  isActive: boolean
  status: string
  isVerified?: boolean
  createdAt: string
  profile?: { firstName: string; lastName: string; avatar?: string } | null
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

const USER_TABS = [
  { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
  { id: 'STUDENT', labelAr: 'الطلاب', labelEn: 'Students' },
  { id: 'INSTRUCTOR', labelAr: 'المحاضرون', labelEn: 'Instructors' },
  { id: 'CONSULTANT', labelAr: 'المستشارون', labelEn: 'Consultants' },
  { id: 'ADMIN', labelAr: 'الإداريون', labelEn: 'Admins' },
] as const

type UserTab = typeof USER_TABS[number]['id']

export default function AdminUsersPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const queryClient = useQueryClient()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<UserTab>('ALL')
  const [counts, setCounts] = useState({ all: 0, students: 0, instructors: 0, consultants: 0, admins: 0 })

  useEffect(() => {
    api.get('/admin/users/counts')
      .then((res) => { const d = res.data.data ?? res.data; setCounts(d) })
      .catch(() => {})
  }, [])

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: () => void; destructive?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  // Role change confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    userId: string
    userName: string
    currentRole: string
    newRole: string
  } | null>(null)

  const roleLabels: Record<string, string> = {
    STUDENT: isAr ? 'مستخدم' : 'User',
    INSTRUCTOR: isAr ? 'محاضر' : 'Instructor',
    CONSULTANT: isAr ? 'مستشار' : 'Consultant',
    ADMIN: isAr ? 'أدمن' : 'Admin',
  }

  const handleRoleChangeRequest = (userId: string, userName: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return
    setConfirmDialog({ open: true, userId, userName, currentRole, newRole })
  }

  const handleRoleChangeConfirm = async () => {
    if (!confirmDialog) return
    try {
      await patch(`/admin/users/${confirmDialog.userId}/role`, { accountType: confirmDialog.newRole })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      notify.success(`${isAr ? 'تم تغيير دور' : 'Changed role of'} ${confirmDialog.userName} ${isAr ? 'إلى' : 'to'} ${roleLabels[confirmDialog.newRole]}`)
    } catch (e: any) {
      notify.error(e.response?.data?.message || (isAr ? 'فشل تغيير الدور' : 'Failed to change role'))
    } finally {
      setConfirmDialog(null)
    }
  }

  // Create user modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', firstName: '', lastName: '', accountType: 'STUDENT' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  function fetchUsers() {
    setLoading(true)
    api.get('/admin/users', {
      params: {
        page,
        limit: 20,
        search: search || undefined,
        role: activeTab === 'ALL' ? undefined : activeTab,
      },
    })
      .then((res) => {
        const d = res.data.data ?? res.data
        setUsers(d.users ?? d.items ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchUsers, [page, search, activeTab])

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
    setConfirmModal({
      isOpen: true,
      title: isAr ? 'حذف المستخدم' : 'Delete User',
      message: isAr ? 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.' : 'Delete this user? This action cannot be undone.',
      destructive: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        setProcessing(userId)
        try { await api.delete(`/admin/users/${userId}`); fetchUsers() }
        catch (e) { console.error(e) }
        finally { setProcessing(null) }
      },
    })
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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {USER_TABS.map((tab) => {
          const count = tab.id === 'ALL' ? counts.all
            : tab.id === 'STUDENT' ? counts.students
            : tab.id === 'INSTRUCTOR' ? counts.instructors
            : tab.id === 'CONSULTANT' ? counts.consultants
            : counts.admins
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1) }}
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
              {isAr ? tab.labelAr : tab.labelEn}
              <span style={{
                background: isActive ? 'rgba(81,32,200,0.3)' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              }}>{count}</span>
            </button>
          )
        })}
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
                      <div className="flex items-center gap-2.5">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          {u.profile?.avatar ? (
                            <img src={getMediaUrl(u.profile.avatar) ?? ''} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" style={{ border: '2px solid rgba(81,32,200,0.3)' }} />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 text-[11px] font-bold text-white" style={{ background: '#5120c8' }}>
                              {(u.profile?.firstName?.[0] || u.email[0] || '?').toUpperCase()}
                            </div>
                          )}
                          {u.isVerified && <VerifiedBadge size="xs" onAvatar showTooltip={false} />}
                        </div>
                        <div>
                          <p className="text-white font-medium flex items-center gap-1.5">
                            {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : '—'}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{u.role}</td>
<td className="px-4 py-3">
                      <select
                        value={u.accountType}
                        onChange={(e) => handleRoleChangeRequest(
                          u.id,
                          `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email,
                          u.accountType,
                          e.target.value
                        )}
                        style={{ padding: '4px 8px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#e0e0e0', fontSize: 12, cursor: 'pointer' }}
                      >
                        <option value="STUDENT">{roleLabels.STUDENT}</option>
                        <option value="INSTRUCTOR">{roleLabels.INSTRUCTOR}</option>
                        <option value="CONSULTANT">{roleLabels.CONSULTANT}</option>
                        <option value="ADMIN">{roleLabels.ADMIN}</option>
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
                <option value="STUDENT">{isAr ? 'مستخدم' : 'User'}</option>
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

      {/* Role Change Confirmation Dialog */}
      {confirmDialog?.open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
        onClick={() => setConfirmDialog(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161929',
              borderRadius: 20, padding: 32, maxWidth: 440, width: '100%',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              direction: 'rtl',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Shield size={24} color="#f59e0b" />
            </div>
            
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
              تأكيد تغيير الدور
            </h3>
            
            <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              هل تريد تغيير دور <strong style={{ color: '#fff' }}>{confirmDialog.userName}</strong> من{' '}
              <span style={{ color: '#5120c8', fontWeight: 600 }}>{roleLabels[confirmDialog.currentRole]}</span>{' '}
              إلى{' '}
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{roleLabels[confirmDialog.newRole]}</span>
            </p>
            
            {confirmDialog.newRole === 'ADMIN' && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              }}>
                <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>
                  تحذير: ستمنح هذا المستخدم صلاحيات الأدمن الكاملة
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleRoleChangeConfirm}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: confirmDialog.newRole === 'ADMIN' ? '#ef4444' : '#5120c8',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700,
                }}
              >
                تأكيد التغيير
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: 'transparent', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', fontSize: 15, fontWeight: 600,
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={isAr ? 'تأكيد الحذف' : 'Delete'}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        confirmDestructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
