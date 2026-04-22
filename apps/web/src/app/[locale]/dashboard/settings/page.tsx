'use client'
import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { get, patch, post } from '../../../../lib/api'
import { getMediaUrl } from '../../../../lib/media'
import api from '../../../../lib/api'
import { useAuthStore } from '../../../../stores/authStore'
import {
  Camera, User, Lock, Bell, Globe, Save,
  Eye, EyeOff, Check, AlertCircle, Moon, Sun,
} from 'lucide-react'

export default function SettingsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const queryClient = useQueryClient()
  const authStore = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', bio: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [prefForm, setPrefForm] = useState({ emailNotifications: true, theme: 'dark' })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await get('/auth/me')
      return res.data?.data ?? res.data
    }
  })

  useEffect(() => {
    if (me) {
      setProfileForm({
        firstName: me.profile?.firstName || '',
        lastName: me.profile?.lastName || '',
        bio: me.profile?.bio || '',
        phone: me.profile?.phone || '',
      })
      if (me.profile?.avatar) {
        const av = me.profile.avatar
        setAvatarPreview(getMediaUrl(av) || '')
      }
      if (typeof window !== 'undefined') {
        setPrefForm(f => ({ ...f, theme: localStorage.getItem('deveway-theme') || 'dark' }))
      }
    }
  }, [me])

  const showSuccess = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000) }

  const profileMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl: string | undefined = undefined
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        const uploadRes = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        avatarUrl = uploadRes.data?.data?.url || uploadRes.data?.url
      }
      const body: any = { ...profileForm }
      if (avatarUrl !== undefined) body.avatar = avatarUrl
      return patch('/auth/profile', body)
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      // Sync updated profile to Zustand store so Navbar avatar updates immediately
      const current = authStore.user
      const updatedProfile = res?.data?.data ?? res?.data
      if (current) {
        authStore.setUser({
          ...current,
          profile: {
            ...current.profile,
            firstName: updatedProfile?.firstName ?? profileForm.firstName,
            lastName: updatedProfile?.lastName ?? profileForm.lastName,
            avatar: updatedProfile?.avatar ?? current.profile?.avatar,
          },
        })
      }
      setAvatarFile(null)
      showSuccess()
    }
  })

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      }
      return post('/auth/change-password', { oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    },
    onSuccess: () => {
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      showSuccess()
    }
  })

  const tabs = [
    { key: 'profile', label: isAr ? 'الملف الشخصي' : 'Profile', icon: User },
    { key: 'security', label: isAr ? 'الأمان' : 'Security', icon: Lock },
    { key: 'preferences', label: isAr ? 'التفضيلات' : 'Preferences', icon: Globe },
    { key: 'notifications', label: isAr ? 'الإشعارات' : 'Notifications', icon: Bell },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--foreground)', fontSize: 14,
    fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: 'var(--muted)',
    fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 4,
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'PingARLT, Plus Jakarta Sans, sans-serif', fontWeight: 900, fontSize: 'clamp(20px, 3vw, 28px)', color: 'var(--foreground)', margin: 0 }}>
          {isAr ? 'الإعدادات' : 'Settings'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
          {isAr ? 'إدارة حسابك وتفضيلاتك' : 'Manage your account and preferences'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: active ? '#5120c8' : 'transparent', color: active ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s ease', flex: '1 1 auto' }}>
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(43,191,163,0.1)', border: '1px solid rgba(43,191,163,0.3)', borderRadius: 8, marginBottom: 16 }}>
          <Check size={16} color="#2BBFA3" />
          <span style={{ color: '#2BBFA3', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>{isAr ? 'تم الحفظ بنجاح' : 'Saved successfully'}</span>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'rgba(81,32,200,0.1)', border: '3px solid rgba(81,32,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
              onClick={() => document.getElementById('settings-avatar')?.click()}
              onMouseEnter={e => { const ov = e.currentTarget.querySelector('.av-overlay') as HTMLDivElement; if (ov) ov.style.opacity = '1' }}
              onMouseLeave={e => { const ov = e.currentTarget.querySelector('.av-overlay') as HTMLDivElement; if (ov) ov.style.opacity = '0' }}
            >
              {avatarPreview ? <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <User size={32} color="rgba(81,32,200,0.5)" />}
              <div className="av-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                <Camera size={20} color="#fff" />
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: 15, margin: '0 0 4px', fontFamily: 'DM Sans, sans-serif' }}>{profileForm.firstName} {profileForm.lastName}</p>
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{isAr ? 'اضغط لتغيير الصورة' : 'Click to change photo'}</p>
            </div>
            <input type="file" accept="image/*" id="settings-avatar" style={{ display: 'none' }}
              onChange={e => { const file = e.target.files?.[0]; if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) } }}
            />
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[{ key: 'firstName', label: isAr ? 'الاسم الأول' : 'First Name' }, { key: 'lastName', label: isAr ? 'اسم العائلة' : 'Last Name' }].map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                <input value={(profileForm as any)[field.key]} onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{isAr ? 'رقم الموبايل' : 'Phone Number'}</label>
            <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="+966..." />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{isAr ? 'نبذة عنك' : 'Bio'}</label>
            <textarea value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder={isAr ? 'اكتب نبذة عنك...' : 'Write about yourself...'} />
          </div>
          <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', cursor: 'pointer', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', fontSize: 14, opacity: profileMutation.isPending ? 0.7 : 1 }}>
            <Save size={16} />
            {profileMutation.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
          </button>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'DM Sans, sans-serif' }}>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
          {[
            { key: 'oldPassword', label: isAr ? 'كلمة المرور الحالية' : 'Current Password', show: showOldPass, toggle: () => setShowOldPass(p => !p) },
            { key: 'newPassword', label: isAr ? 'كلمة المرور الجديدة' : 'New Password', show: showNewPass, toggle: () => setShowNewPass(p => !p) },
            { key: 'confirmPassword', label: isAr ? 'تأكيد كلمة المرور' : 'Confirm Password', show: showNewPass, toggle: () => setShowNewPass(p => !p) },
          ].map((field, i) => (
            <div key={field.key} style={{ marginBottom: i < 2 ? 14 : 20, position: 'relative' }}>
              <label style={labelStyle}>{field.label}</label>
              <div style={{ position: 'relative' }}>
                <input type={field.show ? 'text' : 'password'} value={(passwordForm as any)[field.key]} onChange={e => setPasswordForm(f => ({ ...f, [field.key]: e.target.value }))} style={{ ...inputStyle, paddingRight: 40 }} />
                <button type="button" onClick={field.toggle} style={{ position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          {passwordMutation.isError && (
            <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: 14 }}>
              <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: '#EF4444', fontFamily: 'DM Sans, sans-serif' }}>{(passwordMutation.error as any)?.message || (isAr ? 'حدث خطأ' : 'An error occurred')}</span>
            </div>
          )}
          <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !passwordForm.oldPassword || !passwordForm.newPassword} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', cursor: 'pointer', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', fontSize: 14, opacity: (passwordMutation.isPending || !passwordForm.oldPassword) ? 0.5 : 1 }}>
            <Lock size={16} />
            {passwordMutation.isPending ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
          </button>
        </div>
      )}

      {/* PREFERENCES TAB */}
      {activeTab === 'preferences' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'DM Sans, sans-serif' }}>{isAr ? 'التفضيلات' : 'Preferences'}</h3>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{isAr ? 'المظهر' : 'Theme'}</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ value: 'dark', label: isAr ? 'داكن' : 'Dark', icon: Moon }, { value: 'light', label: isAr ? 'فاتح' : 'Light', icon: Sun }].map(opt => {
                const Icon = opt.icon
                const active = prefForm.theme === opt.value
                return (
                  <button key={opt.value} onClick={() => { setPrefForm(f => ({ ...f, theme: opt.value })); if (opt.value === 'dark') { document.documentElement.classList.add('dark'); localStorage.setItem('deveway-theme', 'dark') } else { document.documentElement.classList.remove('dark'); localStorage.setItem('deveway-theme', 'light') } }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: active ? '2px solid #5120c8' : '1px solid var(--border)', background: active ? 'rgba(81,32,200,0.1)' : 'var(--surface-2)', color: active ? '#A78BFA' : 'var(--muted)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active ? 700 : 500 }}>
                    <Icon size={16} />{opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{isAr ? 'اللغة' : 'Language'}</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }].map(opt => {
                const currentLang = typeof window !== 'undefined' ? (window.location.pathname.startsWith('/ar') ? 'ar' : 'en') : locale
                const active = currentLang === opt.value
                return (
                  <button key={opt.value} onClick={() => { const path = window.location.pathname; window.location.href = opt.value === 'ar' ? path.replace('/en/', '/ar/') : path.replace('/ar/', '/en/') }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: active ? '2px solid #5120c8' : '1px solid var(--border)', background: active ? 'rgba(81,32,200,0.1)' : 'var(--surface-2)', color: active ? '#A78BFA' : 'var(--muted)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active ? 700 : 500 }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'DM Sans, sans-serif' }}>{isAr ? 'إعدادات الإشعارات' : 'Notification Settings'}</h3>
          {[{ key: 'emailNotifications', label: isAr ? 'إشعارات البريد الإلكتروني' : 'Email Notifications', desc: isAr ? 'استقبل تحديثات عبر البريد' : 'Receive updates via email' }].map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--foreground)', fontFamily: 'DM Sans, sans-serif' }}>{item.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{item.desc}</p>
              </div>
              <button onClick={() => setPrefForm(f => ({ ...f, [item.key]: !(f as any)[item.key] }))} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: (prefForm as any)[item.key] ? '#5120c8' : 'var(--border)', position: 'relative', transition: 'background 0.2s ease' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: 'left 0.2s ease', left: (prefForm as any)[item.key] ? 23 : 3 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
