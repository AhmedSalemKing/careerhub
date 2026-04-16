'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, get, post } from '../../../../lib/api'
import { CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, PlusCircle, X, Upload, Video, Image as ImageIcon, User } from 'lucide-react'

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

export default function AdminCoursesPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Create course modal
  const [showCreate, setShowCreate] = useState(false)
  const [courseForm, setCourseForm] = useState({ 
    title: '', 
    titleAr: '', 
    description: '', 
    price: 0, 
    level: 'BEGINNER', 
    status: 'PUBLISHED', 
    instructorId: '',
    isInstructor: false,  // ✅ NEW: Admin is the instructor
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  
  // ✅ NEW: File uploads state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoTitles, setVideoTitles] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors-dropdown'],
    queryFn: async () => {
      const res = await get('/admin/users?accountType=INSTRUCTOR&limit=100')
      const d = (res as any).data?.data ?? (res as any).data
      const arr = d?.users ?? d?.items ?? (Array.isArray(d) ? d : [])
      return arr
    },
  })

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

  // ✅ UPDATED: Handle course creation with file uploads
  async function handleCreateCourse() {
    setCreating(true)
    setCreateError('')
    try {
      // Check if we have files to upload
      if (thumbnailFile || videoFiles.length > 0) {
        // Use FormData for file upload
        const formData = new FormData()
        formData.append('titleEn', courseForm.title)
        formData.append('titleAr', courseForm.titleAr)
        formData.append('descriptionEn', courseForm.description)
        formData.append('price', String(courseForm.price))
        formData.append('level', courseForm.level)
        formData.append('status', courseForm.status)
        formData.append('isInstructor', String(courseForm.isInstructor))
        
        if (!courseForm.isInstructor && courseForm.instructorId) {
          formData.append('instructorId', courseForm.instructorId)
        }
        
        // Append thumbnail
        if (thumbnailFile) {
          formData.append('files', thumbnailFile)
        }
        
        // Append videos
        videoFiles.forEach(file => {
          formData.append('files', file)
        })
        
        // Append video titles
        formData.append('videoTitles', JSON.stringify(videoTitles))

        await post('/admin/courses/create-with-files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        // No files, use simple API
        await post('/admin/courses/create', courseForm)
      }
      
      setShowCreate(false)
      setCourseForm({ 
        title: '', 
        titleAr: '', 
        description: '', 
        price: 0, 
        level: 'BEGINNER', 
        status: 'PUBLISHED', 
        instructorId: '',
        isInstructor: false,
      })
      setThumbnailFile(null)
      setVideoFiles([])
      setVideoTitles([])
      fetchCourses()
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || 'Error creating course')
    } finally { setCreating(false) }
  }

  // ✅ NEW: Handle thumbnail selection
  function handleThumbnailSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setThumbnailFile(file)
      } else {
        alert(isAr ? 'يرجى اختيار صورة صحيحة' : 'Please select a valid image file')
      }
    }
  }

  // ✅ NEW: Handle video selection
  function handleVideosSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const validVideos = files.filter(f => f.type.startsWith('video/'))
    
    if (validVideos.length !== files.length) {
      alert(isAr ? 'بعض الملفات ليست فيديوهات صحيحة' : 'Some files are not valid videos')
    }
    
    setVideoFiles(prev => [...prev, ...validVideos])
    setVideoTitles(prev => [...prev, ...validVideos.map(() => '')])
  }

  // ✅ NEW: Remove video from list
  function removeVideo(index: number) {
    setVideoFiles(prev => prev.filter((_, i) => i !== index))
    setVideoTitles(prev => prev.filter((_, i) => i !== index))
  }

  // ✅ NEW: Update video title
  function updateVideoTitle(index: number, title: string) {
    setVideoTitles(prev => prev.map((t, i) => i === index ? title : t))
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{isAr ? 'الكورسات' : 'Courses'}</h1>
          <span className="text-sm text-gray-400">{total} {isAr ? 'كورس' : 'total'}</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14 }}
        >
          <PlusCircle size={16} />
          {isAr ? 'إضافة كورس' : 'Add Course'}
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
            placeholder={isAr ? 'بحث...' : 'Search courses...'}
            className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => { setPage(1); setSearch(searchInput) }}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {isAr ? 'بحث' : 'Search'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-16">Loading...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">{isAr ? 'الكورس' : 'Course'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'السعر' : 'Price'}</th>
                <th className="px-4 py-3 font-medium">{isAr ? 'المشتركون' : 'Enrollments'}</th>
                <th className="px-4 py-3 font-medium text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-12">
                    {isAr ? 'لا توجد كورسات' : 'No courses found'}
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{c.title || c.titleEn || c.titleAr || '—'}</p>
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
                      {c.price ? `${c.price} ${c.currency ?? 'SAR'}` : (isAr ? 'مجاني' : 'Free')}
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
                            <CheckCircle size={12} /> {isAr ? 'نشر' : 'Publish'}
                          </button>
                        )}
                        {c.status === 'PUBLISHED' && (
                          <button
                            onClick={() => reject(c.id)}
                            disabled={processing === c.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            <XCircle size={12} /> {isAr ? 'إلغاء النشر' : 'Unpublish'}
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
          <span className="text-gray-400">{isAr ? `صفحة ${page} من ${Math.ceil(total / 20)}` : `Page ${page} of ${Math.ceil(total / 20)}`}</span>
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
              disabled={courses.length < 20}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {isAr ? 'التالي' : 'Next'} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ✅ ENHANCED Create Course Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', margin: '0 0 20px' }}>
              {isAr ? 'إضافة كورس جديد' : 'Add New Course'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Basic Info */}
              <input
                placeholder={isAr ? 'عنوان الكورس (إنجليزي)*' : 'Course Title (English)*'}
                value={courseForm.title}
                onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                style={MODAL_INPUT}
              />
              <input
                placeholder={isAr ? 'عنوان الكورس (عربي)' : 'Course Title (Arabic)'}
                value={courseForm.titleAr}
                onChange={e => setCourseForm(f => ({ ...f, titleAr: e.target.value }))}
                style={MODAL_INPUT}
              />
              <textarea
                placeholder={isAr ? 'الوصف' : 'Description'}
                value={courseForm.description}
                onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ ...MODAL_INPUT, resize: 'vertical' }}
              />

              {/* ✅ NEW: Instructor Selection - "I am the instructor" option */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: '12px', 
                background: 'rgba(81,32,200,0.1)', 
                border: '1px solid rgba(81,32,200,0.3)', 
                borderRadius: 10 
              }}>
                <input
                  type="checkbox"
                  id="isInstructor"
                  checked={courseForm.isInstructor}
                  onChange={e => setCourseForm(f => ({ ...f, isInstructor: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#5120c8' }}
                />
                <label htmlFor="isInstructor" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  color: '#A78BFA', 
                  fontSize: 13, 
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  <User size={16} />
                  {isAr ? 'أنا المحاضر (الأدمن هو صاحب الكورس)' : 'I am the Instructor (Admin owns this course)'}
                </label>
              </div>

              {/* Show instructor dropdown ONLY if "I am instructor" is NOT checked */}
              {!courseForm.isInstructor && (
                <select
                  value={courseForm.instructorId}
                  onChange={e => setCourseForm(f => ({ ...f, instructorId: e.target.value }))}
                  style={MODAL_INPUT}
                >
                  <option value="">{isAr ? '-- اختر المحاضر --' : '-- Select Instructor --'}</option>
                  {(instructors as any[]).map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email}
                    </option>
                  ))}
                </select>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  type="number"
                  placeholder={isAr ? 'السعر' : 'Price'}
                  value={courseForm.price}
                  onChange={e => setCourseForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={MODAL_INPUT}
                />
                <select
                  value={courseForm.level}
                  onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}
                  style={MODAL_INPUT}
                >
                  <option value="BEGINNER">{isAr ? 'مبتدئ' : 'Beginner'}</option>
                  <option value="INTERMEDIATE">{isAr ? 'متوسط' : 'Intermediate'}</option>
                  <option value="ADVANCED">{isAr ? 'متقدم' : 'Advanced'}</option>
                </select>
              </div>

              {/* ✅ NEW: Thumbnail Upload */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: '#A78BFA', 
                  marginBottom: 8, 
                  fontFamily: 'DM Sans, sans-serif' 
                }}>
                  <ImageIcon size={14} style={{ display: 'inline', marginRight: 6 }} />
                  {isAr ? 'صورة الكورس المصغرة (Thumbnail)' : 'Course Thumbnail Image'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: thumbnailFile 
                      ? 'rgba(34,197,94,0.1)' 
                      : 'rgba(255,255,255,0.03)',
                    border: `2px dashed ${thumbnailFile ? '#22C55E' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 10,
                    color: thumbnailFile ? '#22C55E' : 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <Upload size={24} />
                  {thumbnailFile 
                    ? (
                      <>
                        <span style={{ fontWeight: 600 }}>{thumbnailFile.name}</span>
                        <span style={{ fontSize: 11, opacity: 0.7 }}>
                          {(thumbnailFile.size / 1024).toFixed(1)} KB
                        </span>
                      </>
                    )
                    : isAr ? 'اضغط لاختيار صورة' : 'Click to select image'
                  }
                </button>
              </div>

              {/* ✅ NEW: Videos Upload */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: '#A78BFA', 
                  marginBottom: 8, 
                  fontFamily: 'DM Sans, sans-serif' 
                }}>
                  <Video size={14} style={{ display: 'inline', marginRight: 6 }} />
                  {isAr ? 'فيديوهات الكورس (Course Videos)' : 'Course Videos'} ({videoFiles.length})
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideosSelect}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => videoInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: videoFiles.length > 0 
                      ? 'rgba(139,92,246,0.1)' 
                      : 'rgba(255,255,255,0.03)',
                    border: `2px dashed ${videoFiles.length > 0 ? '#8B5CF6' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 10,
                    color: videoFiles.length > 0 ? '#8B5CF6' : 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <Upload size={20} />
                  {isAr ? 'اضغط لإضافة فيديوهات' : 'Click to add videos'}
                </button>

                {/* Video List */}
                {videoFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {videoFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'rgba(139,92,246,0.08)',
                        borderRadius: 8,
                        border: '1px solid rgba(139,92,246,0.2)',
                      }}>
                        <Video size={18} color="#8B5CF6" />
                        <span style={{ 
                          flex: 1, 
                          fontSize: 12, 
                          color: '#fff', 
                          fontFamily: 'DM Sans, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {file.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <input
                          type="text"
                          placeholder={isAr ? 'عنوان الدرس' : 'Lesson title'}
                          value={videoTitles[index] || ''}
                          onChange={e => updateVideoTitle(index, e.target.value)}
                          style={{
                            width: 140,
                            padding: '4px 8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: 11,
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => removeVideo(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {createError && (
                <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{createError}</p>
              )}
              <button
                onClick={handleCreateCourse}
                disabled={creating || !courseForm.title}
                style={{ 
                  background: '#5120c8', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 10, 
                  padding: 14, 
                  fontFamily: 'DM Sans, sans-serif', 
                  fontWeight: 700, 
                  fontSize: 14, 
                  cursor: 'pointer', 
                  opacity: creating ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {creating ? (
                  <>
                    <div style={{ 
                      width: 16, 
                      height: 16, 
                      border: '2px solid #fff', 
                      borderTopColor: 'transparent', 
                      borderRadius: '50%', 
                      animation: 'spin 0.8s linear infinite' 
                    }} />
                    {isAr ? 'جاري الإنشاء...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {isAr ? 'إنشاء الكورس مع الملفات' : 'Create Course with Files'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}