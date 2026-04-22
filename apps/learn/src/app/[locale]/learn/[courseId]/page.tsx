'use client'

import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { get, post } from '../../../../lib/api'
import {
  Lock, Play, BookOpen, ArrowRight, ArrowLeft, Sparkles,
  CheckCircle2, ChevronDown, CheckCheck, Video, FileText,
  Clock, Award, ChevronLeft, Settings,
  Download, Share2, MessageSquare, ThumbsUp,
  TrendingUp,
  Loader2, Gift, ShoppingCart, PlayCircle, Image, File, ExternalLink,
  ZoomIn, Eye, FileDown, Volume2, VolumeX,
  Pause, SkipForward, SkipBack
} from 'lucide-react'
import VideoProtection from '../../../../components/VideoProtection'

function LearnPageInner() {
  const params = useParams()
  const courseId = params.courseId as string
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const lessonParam = searchParams.get('lesson')

  // Native video ref
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastTapRef = useRef<{ time: number; x: number } | null>(null)

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set())
  const [authChecked, setAuthChecked] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [markingComplete, setMarkingComplete] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Media states
  const [viewerMode, setViewerMode] = useState<'video' | 'file' | 'image' | 'all'>('all')
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [seekFeedback, setSeekFeedback] = useState<{ side: 'forward' | 'backward'; visible: boolean }>({ side: 'forward', visible: false })
  const speeds = [0.75, 1, 1.25, 1.5, 2]

  // Theme detection
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (saved) setTheme(saved)
    else if (systemDark) setTheme('dark')
    const interval = setInterval(() => {
      const t = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (t) setTheme(t)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Auth guard
  useEffect(() => {
    const token =
      localStorage.getItem('deveway_token') ||
      document.cookie.match(/deveway_token=([^;]+)/)?.[1]
    if (!token) {
      const MAIN = process.env.NEXT_PUBLIC_MAIN_URL || ''
      window.location.href = `${MAIN}/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    if (!localStorage.getItem('deveway_token')) {
      localStorage.setItem('deveway_token', token)
    }
    if (!localStorage.getItem('deveway_user')) {
      const m = document.cookie.match(/deveway_user=([^;]+)/)
      if (m) {
        try { localStorage.setItem('deveway_user', decodeURIComponent(m[1])) } catch {}
      }
    }
    setAuthChecked(true)
  }, [locale])

  const { data: course, isLoading } = useQuery({
    queryKey: ['learn-course', courseId],
    enabled: !!courseId && authChecked,
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      return (res?.data as any)?.data?.course ?? (res?.data as any)?.data ?? (res?.data as any)
    },
  })

  const { data: enrollment, refetch: refetchEnrollment } = useQuery({
    queryKey: ['learn-enrollment', courseId],
    enabled: !!courseId && authChecked,
    queryFn: async () => {
      try {
        const res = await get(`/courses/${courseId}/enrollment`)
        return (res?.data as any)?.data?.enrollment ?? (res?.data as any)?.data ?? null
      } catch { return null }
    },
  })

  const isEnrolled = !!enrollment

  // Extract completed lesson IDs from enrollment response
  const getCompletedLessonIds = (): string[] => {
    try {
      if (!enrollment) return []
      // Primary: new completedLessonIds array from updated getEnrollment
      if (Array.isArray(enrollment.completedLessonIds)) {
        return enrollment.completedLessonIds.filter(Boolean)
      }
      // Fallback: array of objects with lessonId
      if (Array.isArray(enrollment.completedLessons)) {
        return enrollment.completedLessons.map((cl: any) => cl.lessonId || cl.id || cl).filter(Boolean)
      }
      // Fallback: lessons array with status
      if (Array.isArray(enrollment.lessons)) {
        return enrollment.lessons.filter((l: any) => l.completed || l.status === 'COMPLETED').map((l: any) => l.id || l.lessonId).filter(Boolean)
      }
      return []
    } catch { return [] }
  }

  const completedLessonIdsList = getCompletedLessonIds()
  // Merge server-confirmed + locally-tracked completions for instant UI feedback
  const completedLessons = useMemo(
    () => new Set([...completedLessonIdsList, ...Array.from(localCompleted)]),
    [completedLessonIdsList, localCompleted]
  )

  // Safe sections extraction
  const sections: any[] = useMemo(
    () => Array.isArray(course?.sections) ? course.sections
        : Array.isArray(course?.modules) ? course.modules
        : [],
    [course]
  )

  // Flat ordered list across all sections — used for locking + navigation
  const allLessonsFlat = useMemo(
    () => sections.flatMap((s: any) =>
      (Array.isArray(s.lessons) ? s.lessons : []).map((l: any) => ({ ...l, sectionTitle: s.title || s.titleAr }))
    ),
    [sections]
  )

  const activeLesson = useMemo(
    () => allLessonsFlat.find((l: any) => l.id === activeLessonId),
    [allLessonsFlat, activeLessonId]
  )
  const activeLessonIndex = allLessonsFlat.findIndex((l: any) => l.id === activeLessonId)
  const prevLesson = activeLessonIndex > 0 ? allLessonsFlat[activeLessonIndex - 1] : null
  const nextLesson = activeLessonIndex < allLessonsFlat.length - 1 ? allLessonsFlat[activeLessonIndex + 1] : null

  // Sequential lock: lesson N unlocked only when lesson N-1 is completed
  const isLessonUnlocked = useCallback((lessonId: string): boolean => {
    if (!isEnrolled) return false
    const idx = allLessonsFlat.findIndex((l: any) => l.id === lessonId)
    if (idx <= 0) return true
    return completedLessons.has(allLessonsFlat[idx - 1]?.id)
  }, [allLessonsFlat, completedLessons, isEnrolled])

  const getLessonStatus = useCallback((lessonId: string): 'completed' | 'available' | 'locked' => {
    if (completedLessons.has(lessonId)) return 'completed'
    if (isLessonUnlocked(lessonId)) return 'available'
    return 'locked'
  }, [completedLessons, isLessonUnlocked])

  const isCourseComplete = allLessonsFlat.length > 0 && allLessonsFlat.every((l: any) => completedLessons.has(l.id))
  
  // ✅ FIXED: Safe URL construction - handles relative and absolute URLs
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_MAIN_URL || 'https://api.deveway.com'
  
  const getSafeUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    
    // If already absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanUrl = url.replace(/^\//, '')
    
    // Construct full URL with API base
    return `${API_BASE_URL}/${cleanUrl}`
  }

  const videoUrl: string | undefined = getSafeUrl(activeLesson?.videoUrl) || undefined
  const fileUrl: string | undefined = getSafeUrl(activeLesson?.fileUrl) || undefined
  const imageUrl: string | undefined = getSafeUrl(activeLesson?.imageUrl) || undefined
  const fileName: string = activeLesson?.fileName || 'document.pdf'
  
  const isCurrentCompleted = activeLessonId ? completedLessons.has(activeLessonId) : false
  const completedCount = completedLessons.size
  const totalLessons = allLessonsFlat.length
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''

  // Merge localStorage progress on first load (before server data arrives)
  useEffect(() => {
    if (!courseId) return
    try {
      const saved = localStorage.getItem(`progress_${courseId}`)
      if (saved) {
        const ids: string[] = JSON.parse(saved)
        if (Array.isArray(ids) && ids.length > 0) {
          setLocalCompleted(prev => new Set([...prev, ...ids]))
        }
      }
    } catch {}
  }, [courseId])

  // Auto-select lesson
  useEffect(() => {
    if (!course || !isEnrolled) return
    if (lessonParam) { setActiveLessonId(lessonParam); return }
    if (!activeLessonId && allLessonsFlat.length > 0) {
      setActiveLessonId(allLessonsFlat[0].id)
    }
  }, [lessonParam, isEnrolled, course, activeLessonId, allLessonsFlat])

  // Auto-open section containing active lesson
  useEffect(() => {
    if (!activeLessonId || sections.length === 0) return
    sections.forEach((s: any) => {
      if (Array.isArray(s.lessons) && s.lessons.some((l: any) => l.id === activeLessonId)) {
        setOpenSections(prev => new Set([...prev, s.id]))
      }
    })
  }, [activeLessonId, sections])

  // Update page title
  useEffect(() => {
    if (activeLesson) {
      document.title = `${activeLesson.title || activeLesson.titleAr} - ${course?.titleAr || course?.titleEn || 'التعلم'}`
    }
  }, [activeLesson, course])

  // Reset states when lesson changes
  useEffect(() => {
    setViewerMode('all')
    setIsLoadingMedia(true)
    setVideoError(null)
  }, [activeLessonId])

  // Apply playback speed to video element
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate
  }, [playbackRate, activeLessonId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      // Ignore when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 5)
          showSeekFeedback('backward')
          break
        case 'ArrowRight':
          e.preventDefault()
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 5)
          showSeekFeedback('forward')
          break
        case ' ':
          e.preventDefault()
          video.paused ? video.play() : video.pause()
          break
        case 'f':
          video.requestFullscreen?.()
          break
      }
    }
    window.addEventListener('keydown', handleKeys)
    return () => window.removeEventListener('keydown', handleKeys)
  }, [activeLessonId])

  // Double-tap to seek ±5s on mobile
  const showSeekFeedback = (side: 'forward' | 'backward') => {
    setSeekFeedback({ side, visible: true })
    setTimeout(() => setSeekFeedback(prev => ({ ...prev, visible: false })), 600)
  }

  const handleVideoTap = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now()
    const touch = e.changedTouches[0]
    const videoWidth = e.currentTarget.offsetWidth
    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      const video = videoRef.current
      if (!video) return
      const isLeft = touch.clientX < videoWidth / 2
      if (isLeft) {
        video.currentTime = Math.max(0, video.currentTime - 5)
        showSeekFeedback('backward')
      } else {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 5)
        showSeekFeedback('forward')
      }
      lastTapRef.current = null
    } else {
      lastTapRef.current = { time: now, x: touch.clientX }
    }
  }

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMarkComplete = async () => {
    if (!activeLessonId || markingComplete) return
    setMarkingComplete(true)
    setLocalCompleted((prev) => {
      const next = new Set([...prev, activeLessonId])
      // Persist to localStorage as backup
      try {
        const allIds = [...next, ...completedLessonIdsList]
        localStorage.setItem(`progress_${courseId}`, JSON.stringify([...new Set(allIds)]))
      } catch {}
      return next
    })
    try {
      await post(`/courses/${courseId}/lessons/${activeLessonId}/complete`, {})
      refetchEnrollment()
      qc.invalidateQueries({ queryKey: ['learn-enrollment', courseId] })
    } catch (e) {
      console.error('Error marking complete:', e)
    }
    setMarkingComplete(false)
    if (nextLesson) setActiveLessonId(nextLesson.id)
  }

  const handleGetCertificate = async () => {
    try {
      const res = await post(`/certificates/generate/${courseId}`, {})
      const certUrl = (res?.data as any)?.data?.pdfUrl
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      if (certUrl) window.open(`${API_BASE}${certUrl}`, '_blank')
      else router.push(`/${locale}/dashboard/certificates`)
    } catch {
      router.push(`/${locale}/dashboard/certificates`)
    }
  }

  const goToNextLesson = () => { if (nextLesson) setActiveLessonId(nextLesson.id) }
  const goToPrevLesson = () => { if (prevLesson) setActiveLessonId(prevLesson.id) }

  // Detect media type — checks lesson.type field first, then URL extension
  const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i
  const getMediaType = (lesson: any): 'video' | 'file' | 'image' | 'none' => {
    if (!lesson) return 'none'
    const type = (lesson.type || '').toUpperCase()
    if (type === 'VIDEO') return 'video'
    if (type === 'FILE' || type === 'PDF' || type === 'DOCUMENT') return 'file'
    if (type === 'IMAGE') return 'image'
    // Inspect URL extension to catch mis-filed images stored in videoUrl
    if (lesson.videoUrl) return IMAGE_EXTS.test(lesson.videoUrl) ? 'image' : 'video'
    if (lesson.imageUrl) return 'image'
    if (lesson.fileUrl) return 'file'
    return 'none'
  }

  // Content type detection
  const mediaType = activeLesson ? getMediaType(activeLesson) : 'none'
  const hasVideo = mediaType === 'video' && !!videoUrl
  const hasFile = !!activeLesson?.fileUrl && !!fileUrl
  const hasImage = (mediaType === 'image') && !!(getSafeUrl(activeLesson?.imageUrl) || getSafeUrl(activeLesson?.videoUrl))
  const effectiveImageUrl = mediaType === 'image'
    ? (getSafeUrl(activeLesson?.imageUrl) || getSafeUrl(activeLesson?.videoUrl))
    : imageUrl
  const hasMultipleTypes = [hasVideo, hasFile, hasImage].filter(Boolean).length > 1

  // Colors
  const isDark = theme === 'dark'
  const bg = isDark ? '#0f1221' : '#ffffff'
  const sidebarBg = isDark ? '#0d1024' : '#f8f8fa'
  const headerBg = isDark ? '#0a0e1a' : '#f1f0fb'
  const textPrimary = isDark ? '#ffffff' : '#0d0d0d'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const borderColor = isDark ? '#1e293b' : '#e5e7eb'
  const cardBg = isDark ? '#181c30' : '#f1f5f9'
  const purple = '#6c3ce0'
  const teal = '#0d9488'
  const green = '#16a34a'
  const redColor = '#ef4444'
  const blueColor = '#3b82f6'
  const purpleColor = '#a855f7'

  if (!authChecked || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: bg }}>
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4" style={{ borderColor: `${purple} ${purple}30 ${purple}30 ${purple}30` }} />
          <p className="text-sm font-medium" style={{ color: textSecondary }}>جاري تحميل المحتوى...</p>
        </div>
      </div>
    )
  }

  if (!isEnrolled && enrollment === null) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" dir="rtl" style={{ background: bg }}>
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${purple}12` }}>
            <Lock className="h-10 w-10" style={{ color: purple }} />
          </div>
          <h2 className="text-2xl font-bold font-madinet mb-3" style={{ color: textPrimary }}>الكورس مقيّد</h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: textSecondary }}>يجب الاشتراك في هذا الكورس للوصول إلى المحتوى</p>
          <a href={`${MAIN_URL}/${locale}/checkout/${courseId}`} className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-bold text-white transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${purple}, #5b21b6)` }}>
            <ShoppingCart className="h-5 w-5" /> اشترك الآن <ArrowLeft className="h-5 w-5" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl" style={{ background: bg }}>
      
      {/* Header */}
      <header className="shrink-0 px-4 py-3" style={{ background: headerBg, borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center gap-4 max-w-screen-xl mx-auto">
          <a href={`/${locale}/courses/${courseId}`} className="flex items-center gap-1.5 text-sm shrink-0 transition-opacity hover:opacity-70" style={{ color: textSecondary }}>
            <ArrowRight className="h-4 w-4" /><span className="hidden sm:inline">العودة للكورس</span>
          </a>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium truncate flex items-center gap-2" style={{ color: textPrimary }}>
                <BookOpen className="h-4 w-4" style={{ color: purple }} />
                {course?.titleAr || course?.titleEn || course?.title}
              </span>
              <span className="shrink-0 mr-3 flex items-center gap-2" style={{ color: textSecondary }}>
                <TrendingUp className="h-4 w-4" style={{ color: teal }} />
                <span className="font-bold" style={{ color: purple }}>{progress}%</span>
                <span>مكتمل</span>
                <span className="mx-2">·</span>
                <CheckCircle2 className="h-4 w-4" style={{ color: green }} />
                <span>{completedCount}/{totalLessons}</span>
              </span>
            </div>
            
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: borderColor }}>
              <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${purple}, ${teal})` }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="p-2 rounded-lg transition-colors hover:bg-purple-10" style={{ color: textSecondary }}><FileText className="h-5 w-5" /></button>
            <button className="p-2 rounded-lg transition-colors hover:bg-purple-10" style={{ color: textSecondary }}><Settings className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-full lg:w-[30%] xl:w-72 shrink-0 overflow-y-auto lg:h-[calc(100vh-58px)] lg:sticky lg:top-[58px]" style={{ background: sidebarBg, borderLeft: `1px solid ${borderColor}` }}>
          {/* Sidebar header + mini progress */}
          <div className="px-4 py-3 sticky top-0 z-10" style={{ background: sidebarBg, borderBottom: `1px solid ${borderColor}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: textSecondary }}>محتوى الكورس</span>
              <span className="text-xs font-bold" style={{ color: purple }}>{progress}% مكتمل</span>
            </div>
            <div style={{ height: 4, background: borderColor, borderRadius: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${progress}%`, background: `linear-gradient(90deg, ${purple}, ${teal})`, transition: 'width 0.5s ease' }} />
            </div>
            <p className="text-xs mt-1" style={{ color: textSecondary }}>{completedCount} من {totalLessons} درس</p>
          </div>

          <div className="p-2">
            {allLessonsFlat.map((lesson: any, idx: number) => {
              const status = getLessonStatus(lesson.id)
              const isActive = activeLessonId === lesson.id
              const lessonMediaType = getMediaType(lesson)
              const lessonType = lessonMediaType === 'video' ? 'فيديو' : lessonMediaType === 'file' ? 'ملف' : lessonMediaType === 'image' ? 'صورة' : 'نص'

              return (
                <button
                  key={lesson.id}
                  onClick={() => status !== 'locked' && setActiveLessonId(lesson.id)}
                  disabled={status === 'locked'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10,
                    width: '100%', textAlign: 'right', border: 'none',
                    cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                    background: isActive ? `${purple}15` : 'transparent',
                    opacity: status === 'locked' ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    borderLeft: isActive ? `3px solid ${purple}` : '3px solid transparent',
                    marginBottom: 2,
                  }}
                >
                  {/* Status Icon */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: status === 'completed' ? green
                      : status === 'available' ? purple
                      : 'rgba(107,114,128,0.25)',
                  }}>
                    {status === 'completed' && <CheckCircle2 size={15} color="#fff" />}
                    {status === 'available' && <PlayCircle size={15} color="#fff" />}
                    {status === 'locked' && <Lock size={13} color="#9ca3af" />}
                  </div>

                  {/* Lesson info */}
                  <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      color: isActive ? purple : status === 'locked' ? textSecondary : textPrimary,
                      lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {lesson.title || lesson.titleAr}
                    </div>
                    <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                      {lessonType}{lesson.duration ? ` • ${lesson.duration} د` : ''}
                      {lesson.isFree && <span style={{ marginRight: 4, color: teal }}>· مجاني</span>}
                    </div>
                  </div>

                  {/* Lesson number */}
                  <span style={{ fontSize: 11, color: textSecondary, flexShrink: 0 }}>{idx + 1}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex flex-col">
          {activeLessonId && activeLesson ? (
            <>
              {/* Media Viewer */}
              <div className="bg-black w-full relative" style={{ minHeight: '400px', maxHeight: '70vh' }}>
                
                {/* Mode Tabs */}
                {hasMultipleTypes && (
                  <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)' }}>
                    {hasVideo && (<button onClick={() => setViewerMode('video')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${viewerMode === 'video' ? 'bg-red-500 text-white shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}><Video className="h-4 w-4" /> فيديو</button>)}
                    {hasFile && (<button onClick={() => setViewerMode('file')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${viewerMode === 'file' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}><FileText className="h-4 w-4" /> ملف PDF</button>)}
                    {hasImage && (<button onClick={() => setViewerMode('image')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${viewerMode === 'image' ? 'bg-purple-500 text-white shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}><Image className="h-4 w-4" /> صورة</button>)}
                  </div>
                )}

                {/* VIDEO PLAYER */}
                {(viewerMode === 'video' || viewerMode === 'all') && hasVideo && videoUrl && (
                  <div>
                    {/* 16:9 video wrapper */}
                    <div
                      className="video-container"
                      style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: 0, overflow: 'hidden' }}
                      onTouchEnd={handleVideoTap}
                    >
                      <video
                        ref={videoRef}
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        controlsList="nodownload"
                        disablePictureInPicture
                        playsInline
                        onContextMenu={e => e.preventDefault()}
                        onCanPlay={() => setIsLoadingMedia(false)}
                        onWaiting={() => setIsLoadingMedia(true)}
                        onError={() => { setIsLoadingMedia(false); setVideoError('فشل تحميل الفيديو') }}
                        onEnded={() => { if (!isCurrentCompleted) handleMarkComplete() }}
                      />

                      {/* Loading spinner */}
                      {isLoadingMedia && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 10, pointerEvents: 'none' }}>
                          <Loader2 className="h-10 w-10 animate-spin text-white" />
                        </div>
                      )}

                      {/* Error overlay */}
                      {videoError && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', zIndex: 10 }}>
                          <div className="text-center p-6">
                            <Video className="h-10 w-10 text-red-400 mx-auto mb-3" />
                            <p className="text-white text-sm mb-3">{videoError}</p>
                            <button onClick={() => { setVideoError(null); videoRef.current?.load() }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm">إعادة المحاولة</button>
                          </div>
                        </div>
                      )}

                      {/* Double-tap seek feedback */}
                      {seekFeedback.visible && (
                        <div style={{
                          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                          ...(seekFeedback.side === 'backward' ? { left: '15%' } : { right: '15%' }),
                          background: 'rgba(0,0,0,0.7)', color: '#fff',
                          borderRadius: '50%', width: 60, height: 60,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, pointerEvents: 'none', zIndex: 20,
                        }}>
                          {seekFeedback.side === 'backward' ? '-5s' : '+5s'}
                        </div>
                      )}
                    </div>

                    {/* Speed controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', flexWrap: 'wrap', background: isDark ? '#0d1024' : '#f8f8fa', borderBottom: `1px solid ${borderColor}` }}>
                      <span style={{ fontSize: 12, color: textSecondary, marginLeft: 4 }}>سرعة:</span>
                      {speeds.map(speed => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackRate(speed)}
                          style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 12,
                            fontWeight: playbackRate === speed ? 700 : 400,
                            background: playbackRate === speed ? purple : 'transparent',
                            color: playbackRate === speed ? '#fff' : textSecondary,
                            border: `1px solid ${playbackRate === speed ? purple : borderColor}`,
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF VIEWER */}
                {(viewerMode === 'file' || (viewerMode === 'all' && !hasVideo)) && hasFile && fileUrl && (
                  <div className="h-[600px] flex flex-col" style={{ background: isDark ? '#1a1a2e' : '#f8fafc' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: isDark ? '#2d2d44' : '#e2e8f0', background: isDark ? '#161625' : '#fff' }}>
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${blueColor}15` }}><FileText className="h-6 w-6" style={{ color: blueColor }} /></div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: textPrimary }}>{fileName}</p>
                          <p className="text-xs" style={{ color: textSecondary }}>اضغط على زر التحميل لحفظ الملف</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: blueColor, color: 'white', boxShadow: `0 4px 14px ${blueColor}30` }}><Download className="h-4 w-4" /> تحميل الملف</a>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'transparent', color: blueColor, border: `1.5px solid ${blueColor}30` }}><ExternalLink className="h-4 w-4" /> فتح</a>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                        className="w-full h-full border-0"
                        title={fileName}
                        style={{ background: isDark ? '#0f0f1a' : '#e5e7eb' }}
                      />
                    </div>
                  </div>
                )}

                {/* IMAGE VIEWER */}
                {(viewerMode === 'image' || (viewerMode === 'all' && !hasVideo && !hasFile)) && hasImage && effectiveImageUrl && (
                  <div className="min-h-[500px] flex flex-col items-center justify-center relative" style={{ background: isDark ? '#0a0a14' : '#1a1a2e' }}>
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <a href={effectiveImageUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"><ZoomIn className="h-5 w-5" /></a>
                      <a href={effectiveImageUrl} download className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"><Download className="h-5 w-5" /></a>
                    </div>
                    <div className="max-h-[600px] max-w-full p-6 flex items-center justify-center">
                      <img src={effectiveImageUrl} alt={activeLesson.title || activeLesson.titleAr || ''} className="max-h-full max-w-full object-contain rounded-xl shadow-2xl" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl text-sm text-white/90" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>{activeLesson.title || activeLesson.titleAr}</div>
                  </div>
                )}

                {/* No Media */}
                {!hasVideo && !hasFile && !hasImage && (
                  <div className="h-[400px] flex items-center justify-center" style={{ background: isDark ? '#0a0a14' : '#f1f5f9' }}>
                    <div className="text-center">
                      <File className="mx-auto h-16 w-16 mb-3" style={{ color: `${purple}30` }} />
                      <p className="text-sm font-medium" style={{ color: textPrimary }}>لا يوجد وسائط لهذا الدرس</p>
                      {activeLesson.description && (<p className="text-xs mt-3 max-w-md mx-auto leading-relaxed" style={{ color: textSecondary }}>{activeLesson.description}</p>)}
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson Info */}
              <div className="flex-1 p-6" style={{ borderTop: `1px solid ${borderColor}`, background: bg }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {mediaType === 'video' ? <Video className="h-5 w-5" style={{ color: redColor }} /> : mediaType === 'file' ? <FileText className="h-5 w-5" style={{ color: blueColor }} /> : mediaType === 'image' ? <Image className="h-5 w-5" style={{ color: purpleColor }} /> : <File className="h-5 w-5" style={{ color: purple }} />}
                      <h1 className="text-xl font-bold font-madinet" style={{ color: textPrimary }}>{activeLesson.title || activeLesson.titleAr}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: textSecondary }}>
                      {activeLesson.duration && (<span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{activeLesson.duration}</span>)}
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />الدرس {activeLessonIndex >= 0 ? activeLessonIndex + 1 : 1} من {totalLessons}</span>
                      {hasVideo && <span className="flex items-center gap-1" style={{ color: redColor }}><Video className="h-3.5 w-3.5" />فيديو</span>}
                      {hasFile && <span className="flex items-center gap-1" style={{ color: blueColor }}><FileText className="h-3.5 w-3.5" />ملف PDF</span>}
                      {hasImage && <span className="flex items-center gap-1" style={{ color: purpleColor }}><Image className="h-3.5 w-3.5" />صورة</span>}
                      {isCurrentCompleted && <span className="flex items-center gap-1" style={{ color: green }}><CheckCircle2 className="h-3.5 w-3.5" />تم الإكمال</span>}
                    </div>
                  </div>

                  {isCurrentCompleted ? (
                    <div className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shrink-0" style={{ background: `${green}12`, color: green, border: `1px solid ${green}25` }}><Award className="h-4 w-4" /><span>مكتمل</span><CheckCircle2 className="h-4 w-4" /></div>
                  ) : (
                    <button onClick={handleMarkComplete} disabled={markingComplete} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100" style={{ background: `linear-gradient(135deg, ${purple}, #5b21b6)`, boxShadow: `0 4px 16px ${purple}35` }}>{markingComplete ? <><Loader2 className="h-4 w-4 animate-spin" />جاري...</> : <><CheckCheck className="h-4 w-4" />تمييز كمكتمل</>}</button>
                  )}
                </div>

                {activeLesson.description && (
                  <div className="mt-4 p-4 rounded-xl text-sm leading-relaxed" style={{ background: cardBg, color: textSecondary, border: `1px solid ${borderColor}` }}><FileText className="inline h-4 w-4 ml-2" style={{ color: purple }} />{activeLesson.description}</div>
                )}

                {hasFile && fileUrl && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: `${blueColor}08`, border: `1px solid ${blueColor}20` }}>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: blueColor }}><Download className="h-4 w-4" />تحميل المواد الدراسية</h3>
                    <div className="flex flex-wrap gap-3">
                      <a href={fileUrl} download={fileName} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: blueColor, color: 'white', boxShadow: `0 4px 12px ${blueColor}30` }}><FileDown className="h-4 w-4" />تحميل {fileName}</a>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'transparent', color: blueColor, border: `1.5px solid ${blueColor}30` }}><Eye className="h-4 w-4" />عرض</a>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: `1px solid ${borderColor}` }}>
                  {nextLesson && (isEnrolled || nextLesson.isFree) && (
                    <button onClick={goToNextLesson} className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95" style={{ background: `linear-gradient(135deg, ${purple}, #5b21b6)`, boxShadow: `0 4px 16px ${purple}35` }}><SkipForward className="h-4 w-4" /><div className="text-right"><div className="text-xs opacity-80">التالي</div><div>{nextLesson.title || nextLesson.titleAr}</div></div><ArrowLeft className="h-4 w-4" /></button>
                  )}
                  {prevLesson && (
                    <button onClick={goToPrevLesson} className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:scale-105 active:scale-95" style={{ background: cardBg, color: textPrimary, border: `1px solid ${borderColor}` }}><ArrowRight className="h-4 w-4" /><div className="text-right"><div className="text-xs opacity-60">السابق</div><div>{prevLesson.title || prevLesson.titleAr}</div></div><SkipBack className="h-4 w-4" /></button>
                  )}
                </div>

                {/* Interactions */}
                <div className="mt-6 pt-6 flex items-center gap-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-purple-5" style={{ color: textSecondary }}><ThumbsUp className="h-4 w-4" />مفيد</button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-purple-5" style={{ color: textSecondary }}><MessageSquare className="h-4 w-4" />اسأل سؤال</button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-purple-5" style={{ color: textSecondary }}><Share2 className="h-4 w-4" />مشاركة</button>
                </div>

                {/* Course complete sticky button */}
                {isCourseComplete && (
                  <div style={{ position: 'sticky', bottom: 20, marginTop: 16 }}>
                    <button
                      onClick={handleGetCertificate}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 12, padding: '16px 24px', borderRadius: 16, border: 'none',
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                        boxShadow: '0 8px 32px rgba(22,163,74,0.4)',
                      }}
                    >
                      <Award size={22} />
                      تهانينا! أكملت الكورس — احصل على شهادتك
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[60vh] items-center justify-center text-center p-6">
              <div>
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${purple}12` }}><PlayCircle className="h-10 w-10" style={{ color: `${purple}60` }} /></div>
                <h2 className="text-xl font-bold font-madinet mb-2" style={{ color: textPrimary }}>اختر درساً للبدء</h2>
                <p className="text-sm mb-6" style={{ color: textSecondary }}>اختر أي درس من القائمة الجانبية لبدء التعلم</p>
                <button onClick={() => { const first = allLessonsFlat[0]; if (first) setActiveLessonId(first.id) }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105" style={{ background: purple }}><Play className="h-4 w-4" />ابدأ من أول درس</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Button */}
      <a href={`${MAIN_URL}/${locale}/dashboard/ai-chat`} title="اسأل الذكاء الاصطناعي" className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: `linear-gradient(135deg, ${purple}, #8b5cf6)`, boxShadow: `0 6px 24px ${purple}50` }}><Sparkles className="h-7 w-7 text-white" /></a>

      {/* Video Protection + Watermark */}
      <VideoProtection userName={undefined} userEmail={undefined} />

      {/* Mobile Progress Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between" style={{ background: headerBg, borderTop: `1px solid ${borderColor}` }}>
        <button onClick={goToPrevLesson} disabled={!prevLesson} className="p-2 rounded-lg disabled:opacity-30" style={{ color: textPrimary }}><ArrowRight className="h-5 w-5" /></button>
        <div className="flex-1 mx-4"><div className="h-1.5 rounded-full" style={{ background: borderColor }}><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: purple }} /></div></div>
        <button onClick={goToNextLesson} disabled={!nextLesson} className="p-2 rounded-lg disabled:opacity-30" style={{ color: textPrimary }}><ArrowLeft className="h-5 w-5" /></button>
      </div>
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-center"><Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" /><p className="text-sm text-muted-foreground">جاري تحميل صفحة التعلم...</p></div></div>}>
      <LearnPageInner />
    </Suspense>
  )
}