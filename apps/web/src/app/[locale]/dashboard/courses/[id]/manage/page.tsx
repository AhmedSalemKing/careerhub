'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  BookOpen, Users, Settings, Video, Plus, X, Upload, CheckCircle,
  FileText, Image, File, Download, Eye, Trash2, Edit3
} from 'lucide-react'
import { get, post, patch, del } from '../../../../../../lib/api'
import { AuthGate } from '../../../../../components/AuthGate'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type Tab = 'content' | 'lectures' | 'students' | 'settings'
type MediaType = 'video' | 'file' | 'image' | null

// ─── Upload Functions ──────────────────────────────────────────────────────

async function uploadMedia(
  file: File, 
  onProgress: (p: number) => void, 
  type: 'video' | 'file' | 'image'
): Promise<{ url: string; name: string; type: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
    const xhr = new XMLHttpRequest()
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    
    xhr.onload = () => {
      console.log(`${type} upload response:`, xhr.status, xhr.responseText)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ 
            url: data.data?.url || data.url, 
            name: file.name,
            type: type
          })
        } catch {
          reject(new Error(`فشل رفع ${type}: استجابة غير صالحة`))
        }
      } else {
        let errorMsg = `فشل رفع ${type}`
        try {
          const errData = JSON.parse(xhr.responseText)
          errorMsg = errData?.message || errData?.error || errorMsg
        } catch {}
        reject(new Error(errorMsg))
      }
    }
    
    xhr.onerror = () => reject(new Error('فشل الاتصال بالسيرفر'))
    xhr.open('POST', `${API_URL}/upload/${type}`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

// ─── Types ─────────────────────────────────────────────────────────────────

type LessonForm = {
  title: string
  description: string
  sectionId: string
  isFree: boolean
  videoUrl: string
  fileUrl: string
  fileName: string
  imageUrl: string
  contentType: 'video' | 'file' | 'image' | 'mixed'
}

// ─── Add Lecture Modal ────────────────────────────────────────────────────────

function AddLectureModal({
  courseId,
  sections,
  onClose,
  onSaved,
}: {
  courseId: string
  sections: { id: string; title: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<LessonForm>({
    title: '',
    description: '',
    sectionId: sections[0]?.id ?? '',
    isFree: false,
    videoUrl: '',
    fileUrl: '',
    fileName: '',
    imageUrl: '',
    contentType: 'video',
  })
  
  const [lessonType, setLessonType] = useState<'VIDEO' | 'LIVE'>('VIDEO')
  const [liveDate, setLiveDate] = useState('')
  const [liveDuration, setLiveDuration] = useState(60)
  const [saveRecording, setSaveRecording] = useState(true)
  const [autoPublish, setAutoPublish] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadType, setUploadType] = useState<MediaType>(null)
  
  // Refs for file inputs
  const videoRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof LessonForm>(k: K, v: LessonForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  // ─── Auto-detect content type ──────────────────────────────────────────
  
  useEffect(() => {
    const hasVideo = !!form.videoUrl
    const hasFile = !!form.fileUrl
    const hasImage = !!form.imageUrl
    
    if (hasVideo && (hasFile || hasImage)) {
      set('contentType', 'mixed')
    } else if (hasVideo) {
      set('contentType', 'video')
    } else if (hasFile) {
      set('contentType', 'file')
    } else if (hasImage) {
      set('contentType', 'image')
    }
  }, [form.videoUrl, form.fileUrl, form.imageUrl])

  // ─── Video Handler ─────────────────────────────────────────────────────
  
  async function handleVideoSelect(file: File) {
    setUploading(true)
    setProgress(0)
    setError('')
    try {
      const result = await uploadMedia(file, setProgress, 'video')
      set('videoUrl', result.url)
    } catch (err) {
      console.error('Video upload error:', err)
      setError(err instanceof Error ? err.message : 'فشل رفع الفيديو')
    } finally {
      setUploading(false)
      setUploadType(null)
    }
  }

  // ─── File Handler (PDF, DOC, etc.) ─────────────────────────────────────
  
  async function handleFileSelect(file: File) {
    setUploading(true)
    setProgress(0)
    setError('')
    try {
      const result = await uploadMedia(file, setProgress, 'file')
      set('fileUrl', result.url)
      set('fileName', result.name)
    } catch (err) {
      console.error('File upload error:', err)
      setError(err instanceof Error ? err.message : 'فشل رفع الملف')
    } finally {
      setUploading(false)
      setUploadType(null)
    }
  }

  // ─── Image Handler ──────────────────────────────────────────────────────
  
  async function handleImageSelect(file: File) {
    setUploading(true)
    setProgress(0)
    setError('')
    try {
      const result = await uploadMedia(file, setProgress, 'image')
      set('imageUrl', result.url)
    } catch (err) {
      console.error('Image upload error:', err)
      setError(err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploading(false)
      setUploadType(null)
    }
  }

  // ─── Remove Media Handlers ─────────────────────────────────────────────
  
  const removeVideo = () => set('videoUrl', '')
  const removeFile = () => { set('fileUrl', ''); set('fileName', '') }
  const removeImage = () => set('imageUrl', '')

  // ─── Save Handler ───────────────────────────────────────────────────────
  
  async function handleSave() {
    if (!form.title.trim()) { setError('اسم المحاضرة مطلوب'); return }
    if (!form.sectionId) { setError('اختر القسم'); return }
    
    if (lessonType === 'VIDEO') {
      if (!form.videoUrl && !form.fileUrl && !form.imageUrl) {
        setError('يجب رفع فيديو أو ملف أو صورة واحدة على الأقل')
        return
      }
    } else {
      if (!liveDate) {
        setError('اختر تاريخ ووقت البث المباشر')
        return
      }
    }
    
    setSaving(true)
    setError('')
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        isFree: form.isFree,
        contentType: form.contentType,
        lessonType,
      }
      
      if (lessonType === 'VIDEO') {
        if (form.videoUrl) payload.videoUrl = form.videoUrl
        if (form.fileUrl) {
          payload.fileUrl = form.fileUrl
          payload.fileName = form.fileName
        }
        if (form.imageUrl) payload.imageUrl = form.imageUrl
      } else {
        payload.liveDate = liveDate
        payload.liveDuration = liveDuration
        payload.saveRecording = saveRecording
        payload.autoPublish = autoPublish
      }
      
      console.log('Saving lesson with payload:', payload)
      
      await post(`/courses/sections/${form.sectionId}/lessons`, payload)
      onSaved()
      onClose()
    } catch (e: any) {
      console.error('Save error:', e)
      setError(e?.response?.data?.message || e?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-2xl rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-madinet text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5" />
            إضافة محاضرة جديدة
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[color:var(--surface-2)] transition-colors">
            <X className="h-4 w-4 text-[color:var(--muted)]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Lesson Type Selector */}
          <div style={{
            display: 'flex', gap: '8px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px', padding: '4px',
          }}>
            {[
              { value: 'VIDEO' as const, labelAr: 'محاضرة مسجلة' },
              { value: 'LIVE' as const, labelAr: 'بث مباشر' },
            ].map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setLessonType(type.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: lessonType === type.value
                    ? 'rgba(81,32,200,0.2)'
                    : 'transparent',
                  color: lessonType === type.value ? '#a78bfa' : '#666680',
                  fontWeight: lessonType === type.value ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s',
                  outline: lessonType === type.value
                    ? '1px solid rgba(81,32,200,0.4)' : 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {type.value === 'VIDEO' ? (
                    <>
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </>
                  )}
                </svg>
                {type.labelAr}
              </button>
            ))}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">اسم المحاضرة *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="مثال: مقدمة في البرمجة"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">وصف (اختياري)</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="وصف مختصر للمحتوى..."
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Section Select */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">القسم *</label>
            <select
              value={form.sectionId}
              onChange={(e) => set('sectionId', e.target.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {lessonType === 'VIDEO' && (
            <>
              {/* ═══════ MEDIA UPLOAD SECTION ═══════ */}
              <div className="space-y-4 pt-2 border-t border-[color:var(--border)]">
                <label className="block text-sm font-bold text-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  الوسائط التعليمية
                  <span className="text-xs font-normal text-[color:var(--muted)]">(يمكن رفع أكثر من نوع)</span>
                </label>
                
                {/* Video Upload */}
                <div className="relative">
                  <label className="block text-xs font-medium text-[color:var(--muted)] mb-1.5 flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    فيديو (اختياري)
                  </label>
                  
                  {form.videoUrl ? (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-400">تم رفع الفيديو</p>
                          <p className="text-xs text-[color:var(--muted)]">جاهز للعرض</p>
                        </div>
                      </div>
                      <button
                        onClick={removeVideo}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploading && videoRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all ${
                        uploading && uploadType === 'video'
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      {uploading && uploadType === 'video' ? (
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2 text-[color:var(--muted)] justify-center">
                            <Upload className="h-4 w-4 animate-bounce" />
                            <span className="text-sm">جارٍ رفع الفيديو... {progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[color:var(--border)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <Video className="h-8 w-8 text-[color:var(--muted)] opacity-40" />
                          <p className="text-xs text-[color:var(--muted)] text-center">MP4, WebM — حد أقصى 500MB</p>
                          <span className="text-xs text-primary font-medium">اضغط لرفع الفيديو</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) { setUploadType('video'); handleVideoSelect(f) }
                    }}
                  />
                </div>

                {/* File Upload (PDF, DOC, etc.) */}
                <div className="relative">
                  <label className="block text-xs font-medium text-[color:var(--muted)] mb-1.5 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    ملف PDF أو مستند (اختياري)
                  </label>
                  
                  {form.fileUrl ? (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-400 truncate max-w-[200px]">{form.fileName}</p>
                          <p className="text-xs text-[color:var(--muted)]">ملف مرفوع ✓</p>
                        </div>
                      </div>
                      <button
                        onClick={removeFile}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all ${
                        uploading && uploadType === 'file'
                          ? 'border-blue-500/50 bg-blue-500/5'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-blue-500/50 hover:bg-blue-500/5'
                      }`}
                    >
                      {uploading && uploadType === 'file' ? (
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2 text-[color:var(--muted)] justify-center">
                            <Upload className="h-4 w-4 animate-bounce" />
                            <span className="text-sm">جارٍ رفع الملف... {progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[color:var(--border)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <FileText className="h-8 w-8 text-[color:var(--muted)] opacity-40" />
                          <p className="text-xs text-[color:var(--muted)] text-center">PDF, Word, PowerPoint, Excel — حد أقصى 100MB</p>
                          <span className="text-xs text-blue-500 font-medium">اضغط لرفع الملف</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) { setUploadType('file'); handleFileSelect(f) }
                    }}
                  />
                </div>

                {/* Image Upload */}
                <div className="relative">
                  <label className="block text-xs font-medium text-[color:var(--muted)] mb-1.5 flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" />
                    صورة (اختياري)
                  </label>
                  
                  {form.imageUrl ? (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-lg overflow-hidden border border-[color:var(--border)]">
                          <img 
                            src={form.imageUrl} 
                            alt="Preview" 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-400">تم رفع الصورة</p>
                          <p className="text-xs text-[color:var(--muted)]">جاهزة للعرض</p>
                        </div>
                      </div>
                      <button
                        onClick={removeImage}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploading && imageRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all ${
                        uploading && uploadType === 'image'
                          ? 'border-purple-500/50 bg-purple-500/5'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-purple-500/50 hover:bg-purple-500/5'
                      }`}
                    >
                      {uploading && uploadType === 'image' ? (
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2 text-[color:var(--muted)] justify-center">
                            <Upload className="h-4 w-4 animate-bounce" />
                            <span className="text-sm">جارٍ رفع الصورة... {progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[color:var(--border)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <Image className="h-8 w-8 text-[color:var(--muted)] opacity-40" />
                          <p className="text-xs text-[color:var(--muted)] text-center">JPG, PNG, WebP, GIF — حد أقصى 10MB</p>
                          <span className="text-xs text-purple-500 font-medium">اضغط لرفع الصورة</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) { setUploadType('image'); handleImageSelect(f) }
                    }}
                  />
                </div>
              </div>

              {/* Content Type Indicator */}
              {(form.videoUrl || form.fileUrl || form.imageUrl) && (
                <div className="rounded-xl bg-[color:var(--surface-2)] p-3 flex items-center gap-2">
                  <span className="text-xs text-[color:var(--muted)]">نوع المحتوى:</span>
                  <div className="flex gap-2">
                    {form.videoUrl && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1">
                        <Video className="h-3 w-3" /> فيديو
                      </span>
                    )}
                    {form.fileUrl && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> ملف
                      </span>
                    )}
                    {form.imageUrl && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 flex items-center gap-1">
                        <Image className="h-3 w-3" /> صورة
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {lessonType === 'LIVE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Live Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px',
                  fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  تاريخ البث المباشر *
                </label>
                <input
                  type="datetime-local"
                  value={liveDate}
                  onChange={e => setLiveDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: 'var(--foreground)', fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px',
                  fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  المدة المتوقعة
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[30, 60, 90, 120].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setLiveDuration(d)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '20px',
                        border: liveDuration === d
                          ? '1.5px solid #5120c8'
                          : '1px solid rgba(255,255,255,0.12)',
                        background: liveDuration === d
                          ? 'rgba(81,32,200,0.15)' : 'transparent',
                        color: liveDuration === d ? '#a78bfa' : '#888',
                        cursor: 'pointer', fontSize: '0.85rem',
                        fontFamily: 'inherit',
                      }}
                    >
                      {d} دقيقة
                    </button>
                  ))}
                </div>
              </div>

              {/* Save recording + auto publish toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'saveRecording', labelAr: 'حفظ التسجيل بعد الانتهاء',
                    value: saveRecording, set: setSaveRecording },
                  { key: 'autoPublish', labelAr: 'نشر التسجيل تلقائيا',
                    value: autoPublish, set: setAutoPublish },
                ].map(toggle => (
                  <label key={toggle.key}
                    style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                      {toggle.labelAr}
                    </span>
                    <div
                      onClick={() => toggle.set(!toggle.value)}
                      style={{
                        width: '44px', height: '24px',
                        borderRadius: '12px',
                        background: toggle.value ? '#5120c8' : 'rgba(255,255,255,0.1)',
                        position: 'relative', cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '3px',
                        left: toggle.value ? '22px' : '3px',
                        width: '18px', height: '18px',
                        borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s',
                      }}/>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{
                background: 'rgba(81,32,200,0.08)',
                border: '1px solid rgba(81,32,200,0.2)',
                borderRadius: '8px', padding: '12px',
              }}>
                <p style={{ color: '#9999b8', fontSize: '0.82rem',
                  margin: 0, lineHeight: 1.6 }}>
                  سيظهر موعد البث في محتوى الكورس. يمكنك بدء البث من لوحة التحكم
                  في الوقت المحدد. سيتم إرسال إشعار للطلاب عند بدء البث.
                </p>
              </div>
            </div>
          )}

          {/* Free Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-[color:var(--surface-2)] px-4 py-3">
            <div>
              <div className="text-sm font-medium text-foreground">محاضرة مجانية؟</div>
              <div className="text-xs text-[color:var(--muted)]">تُعرض للطلاب غير المشتركين</div>
            </div>
            <button
              type="button"
              onClick={() => set('isFree', !form.isFree)}
              className={`relative h-6 w-11 rounded-full transition-all ${form.isFree ? 'bg-primary' : 'bg-[color:var(--border)]'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.isFree ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`}
              />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400 flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-[color:var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[color:var(--border)] py-2.5 text-sm font-medium text-foreground hover:bg-[color:var(--surface-2)] transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                حفظ المحاضرة
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Start Live Button ────────────────────────────────────────────────────────

function StartLiveButton({ lessonId, isLive, onStarted }: { lessonId: string; isLive: boolean; onStarted: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      await post(`/live/lesson-start/${lessonId}`, {})
      onStarted()
    } catch (e) {
      console.error('Start live error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={loading || isLive}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '5px 14px', borderRadius: '20px',
        border: isLive ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(81,32,200,0.4)',
        background: isLive ? 'rgba(239,68,68,0.12)' : 'rgba(81,32,200,0.12)',
        color: isLive ? '#f87171' : '#a78bfa',
        fontSize: '0.78rem', fontWeight: 600, cursor: isLive ? 'default' : 'pointer',
        fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap', shrink: 0,
      }}
    >
      {loading ? (
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
      ) : (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
      )}
      {isLive ? 'جارٍ البث' : 'بدء البث'}
    </button>
  )
}

// ─── Main Manage Page ─────────────────────────────────────────────────────────

export default function ManageCoursePage() {
  const params = useParams()
  const locale = useLocale()
  const courseId = params.id as string
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('content')
  const [showAddLecture, setShowAddLecture] = useState(false)
  const [addSectionTitle, setAddSectionTitle] = useState('')
  const [addingSec, setAddingSec] = useState(false)

  const { data: course, isLoading } = useQuery({
    queryKey: ['instructor-course-details', courseId],
    queryFn: async () => {
      const res = await get(`/courses/instructor/${courseId}/details`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!courseId,
  })

  async function handleAddSection() {
    if (!addSectionTitle.trim()) return
    setAddingSec(true)
    try {
      await post(`/courses/instructor/${courseId}/sections`, { title: addSectionTitle })
      setAddSectionTitle('')
      queryClient.invalidateQueries({ queryKey: ['instructor-course-details', courseId] })
    } finally {
      setAddingSec(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'content', label: 'المحتوى', icon: BookOpen },
    { key: 'lectures', label: 'المحاضرات', icon: Video },
    { key: 'students', label: 'الطلاب', icon: Users },
    { key: 'settings', label: 'الإعدادات', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" dir="rtl">
        <div className="h-8 w-48 animate-pulse rounded bg-[color:var(--surface-2)]" />
        <div className="h-48 animate-pulse rounded-2xl bg-[color:var(--surface)]" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <p className="text-[color:var(--muted)]">الكورس غير موجود أو ليس لديك صلاحية إدارته.</p>
      </div>
    )
  }

  const sections: { id: string; title: string; lessons: any[] }[] = course.sections ?? []

  return (
    <AuthGate>
      <div className="p-6" dir="rtl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-madinet text-foreground">{course.titleEn}</h1>
              {course.titleAr && <p className="text-sm text-[color:var(--muted)] mt-0.5">{course.titleAr}</p>}
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                course.status === 'PUBLISHED'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-sm text-[color:var(--muted)]">
            <span>{course._count?.enrollments ?? 0} مستخدم</span>
            <span>·</span>
            <span>{sections.length} قسم</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-md'
                  : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Content ── */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-madinet text-foreground">أقسام الكورس</h2>
            {sections.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-[color:var(--muted)]">
                لا توجد أقسام بعد. أضف قسماً أولاً.
              </div>
            )}
            {sections.map((sec, i) => (
              <div key={sec.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-foreground">{sec.title}</h3>
                  <span className="text-xs text-[color:var(--muted)] mr-auto">
                    {sec.lessons?.length ?? 0} محاضرة
                  </span>
                </div>
                {sec.lessons?.length > 0 && (
                  <div className="space-y-1.5 mr-10">
                    {sec.lessons.map((lesson: any) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 rounded-xl bg-[color:var(--surface-2)] px-3 py-2 text-sm"
                      >
                        {/* ✅ Show appropriate icon based on content type */}
                        {lesson.isLive ? (
                          <div className="h-3.5 w-3.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        ) : lesson.videoUrl ? (
                          <Video className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        ) : lesson.fileUrl ? (
                          <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        ) : lesson.imageUrl ? (
                          <Image className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <File className="h-3.5 w-3.5 text-[color:var(--muted)] shrink-0" />
                        )}
                        <span className="flex-1 text-foreground truncate">{lesson.title}</span>
                        
                        {/* Content type badges */}
                        <div className="flex gap-1">
                          {lesson.isLive && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 8px', borderRadius: '20px',
                              background: 'rgba(239,68,68,0.12)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              color: '#f87171', fontSize: '0.7rem', fontWeight: 600,
                            }}>
                              <span style={{
                                width: '5px', height: '5px', borderRadius: '50%',
                                background: lesson.liveStatus === 'LIVE' ? '#ef4444' : '#f87171',
                              }}/>
                              {lesson.liveStatus === 'LIVE' ? 'جار البث' :
                               lesson.liveStartTime ? new Date(lesson.liveStartTime).toLocaleString('ar-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'بث مباشر'}
                            </span>
                          )}
                          {lesson.videoUrl && (
                            <span className="text-xs rounded-full bg-red-500/10 text-red-400 px-1.5 py-0.5">فيديو</span>
                          )}
                          {lesson.fileUrl && (
                            <span className="text-xs rounded-full bg-blue-500/10 text-blue-400 px-1.5 py-0.5">ملف</span>
                          )}
                          {lesson.imageUrl && (
                            <span className="text-xs rounded-full bg-purple-500/10 text-purple-400 px-1.5 py-0.5">صورة</span>
                          )}
                        </div>
                        
                        {lesson.isFree && (
                          <span className="text-xs rounded-full bg-green-500/15 text-green-400 px-2 py-0.5">مجانية</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add section */}
            <div className="flex gap-3">
              <input
                value={addSectionTitle}
                onChange={(e) => setAddSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                placeholder="اسم القسم الجديد"
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSection}
                disabled={addingSec || !addSectionTitle.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {addingSec ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                إضافة قسم
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Lectures ── */}
        {activeTab === 'lectures' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-madinet text-foreground">المحاضرات</h2>
              {sections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddLecture(true)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  إضافة محاضرة
                </button>
              )}
            </div>

            {sections.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-[color:var(--muted)]">
                أضف أقسام للكورس أولاً من تبويب "المحتوى"، ثم أضف المحاضرات.
              </div>
            )}

            {sections.map((sec) => (
              <div key={sec.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-[color:var(--surface-2)] border-b border-[color:var(--border)]">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">{sec.title}</h3>
                  <span className="text-xs text-[color:var(--muted)] mr-auto">{sec.lessons?.length ?? 0} محاضرة</span>
                </div>
                {sec.lessons?.length > 0 ? (
                  <div className="divide-y divide-[color:var(--border)]">
                    {sec.lessons.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[color:var(--surface-2)] transition-colors">
                        {/* ✅ Enhanced icon display */}
                        <div className="flex gap-1">
                          {lesson.isLive && (
                            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                            </div>
                          )}
                          {lesson.videoUrl && (
                            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <Video className="h-4 w-4 text-red-400" />
                            </div>
                          )}
                          {lesson.fileUrl && (
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-blue-400" />
                            </div>
                          )}
                          {lesson.imageUrl && (
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center overflow-hidden">
                              <img src={lesson.imageUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                          )}
                          {!lesson.isLive && !lesson.videoUrl && !lesson.fileUrl && !lesson.imageUrl && (
                            <div className="h-8 w-8 rounded-lg bg-[color:var(--surface-2)] flex items-center justify-center">
                              <File className="h-4 w-4 text-[color:var(--muted)]" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{lesson.title}</div>
                          <div className="flex gap-2 mt-1">
                            {lesson.isLive && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 10px', borderRadius: '20px',
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171', fontSize: '0.7rem', fontWeight: 600,
                              }}>
                                <span style={{
                                  width: '5px', height: '5px', borderRadius: '50%',
                                  background: lesson.liveStatus === 'LIVE' ? '#ef4444' : '#f87171',
                                }}/>
                                {lesson.liveStatus === 'LIVE' ? 'جار البث الآن' :
                                 lesson.liveStartTime ? new Date(lesson.liveStartTime).toLocaleString('ar-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'بث مباشر'}
                              </span>
                            )}
                            {lesson.videoUrl && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> فيديو
                              </span>
                            )}
                            {lesson.fileUrl && (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> {lesson.fileName || 'ملف'}
                              </span>
                            )}
                            {lesson.imageUrl && (
                              <span className="text-xs text-purple-400 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> صورة
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {lesson.isFree && (
                          <span className="text-xs rounded-full bg-green-500/15 text-green-400 px-2 py-0.5 shrink-0">مجانية</span>
                        )}
                        {lesson.isLive && lesson.liveStatus !== 'ENDED' && (
                          <StartLiveButton lessonId={lesson.id} isLive={lesson.liveStatus === 'LIVE'} onStarted={() => queryClient.invalidateQueries({ queryKey: ['instructor-course-details', courseId] })} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-sm text-[color:var(--muted)]">لا توجد محاضرات في هذا القسم بعد.</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Students ── */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-madinet text-foreground">
              الطلاب ({course._count?.enrollments ?? 0})
            </h2>
            {(course.enrollments ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-10 text-center">
                <Users className="h-10 w-10 mx-auto opacity-20 mb-3" />
                <p className="text-sm text-[color:var(--muted)]">لا يوجد طلاب مسجلون بعد</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
                <div className="divide-y divide-[color:var(--border)]">
                  {course.enrollments.map((en: any) => {
                    const firstName = en.user?.profile?.firstName ?? ''
                    const lastName = en.user?.profile?.lastName ?? ''
                    const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '؟'
                    return (
                      <div key={en.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                          {en.user?.profile?.avatar ? (
                            <img src={en.user.profile.avatar} className="h-full w-full rounded-full object-cover" alt="" />
                          ) : initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{firstName} {lastName}</div>
                          <div className="text-xs text-[color:var(--muted)]">{en.user?.email}</div>
                        </div>
                        <div className="mr-auto text-xs text-[color:var(--muted)]">
                          تقدم: {Math.round(en.progress ?? 0)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Settings ── */}
        {activeTab === 'settings' && (
          <CourseSettingsTab course={course} courseId={courseId} onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ['instructor-course-details', courseId] })
          } />
        )}
      </div>

      {/* Add lecture modal */}
      {showAddLecture && sections.length > 0 && (
        <AddLectureModal
          courseId={courseId}
          sections={sections.map((s) => ({ id: s.id, title: s.title }))}
          onClose={() => setShowAddLecture(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['instructor-course-details', courseId] })}
        />
      )}
    </AuthGate>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function CourseSettingsTab({
  course,
  courseId,
  onRefresh,
}: {
  course: any
  courseId: string
  onRefresh: () => void
}) {
  const [form, setForm] = useState({
    title: course.titleEn ?? '',
    titleAr: course.titleAr ?? '',
    description: course.descriptionEn ?? '',
    price: String(course.price ?? '0'),
    level: course.level ?? 'BEGINNER',
    status: course.status ?? 'DRAFT',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try {
      await patch(`/courses/${courseId}`, {
        title: form.title,
        titleAr: form.titleAr,
        description: form.description,
        price: parseFloat(form.price) || 0,
        level: form.level,
        status: form.status,
      })
      setSaved(true)
      onRefresh()
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const LEVELS = [
    { value: 'BEGINNER', label: 'مبتدئ' },
    { value: 'INTERMEDIATE', label: 'متوسط' },
    { value: 'ADVANCED', label: 'متقدم' },
  ]

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-lg font-bold font-madinet text-foreground">إعدادات الكورس</h2>

      {[
        { label: 'العنوان', key: 'title' as const },
        { label: 'العنوان بالعربية', key: 'titleAr' as const },
      ].map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
          <input
            value={form[field.key]}
            onChange={(e) => setF(field.key, e.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">الوصف</label>
        <textarea
          value={form.description}
          onChange={(e) => setF('description', e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">السعر</label>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setF('price', e.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">المستوى</label>
          <select
            value={form.level}
            onChange={(e) => setF('level', e.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
          >
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">الحالة</label>
        <div className="flex gap-3">
          {[
            { value: 'DRAFT', label: 'مسودة' },
            { value: 'PUBLISHED', label: 'منشور' },
            { value: 'ARCHIVED', label: 'مؤرشف' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setF('status', opt.value)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                form.status === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:border-primary/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
      </button>
    </div>
  )
}