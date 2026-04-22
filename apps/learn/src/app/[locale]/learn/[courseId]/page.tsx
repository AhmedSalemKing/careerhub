'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { get, post } from '../../../../lib/api'
import { getMediaUrl } from '../../../../lib/media'
import {
  Lock, Play, BookOpen, ArrowRight, ArrowLeft, Sparkles,
  CheckCircle2, ChevronDown, CheckCheck, Video, FileText,
  Clock, Award, ChevronLeft, Settings,
  Download, Share2, MessageSquare, ThumbsUp,
  User, GraduationCap, TrendingUp,
  Loader2, Gift, ShoppingCart, PlayCircle, Image, File, ExternalLink,
  ZoomIn, Eye, FileDown, Volume2, VolumeX,
  Pause, SkipForward, SkipBack
} from 'lucide-react'
import VideoProtection from '../../../../components/VideoProtection'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

function LearnPageInner() {
  const params = useParams()
  const courseId = params.courseId as string
  const locale = useLocale()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const lessonParam = searchParams.get('lesson')

  // ReactPlayer v3 ref (wraps HTMLVideoElement)
  const playerRef = useRef<HTMLVideoElement>(null)

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set())
  const [authChecked, setAuthChecked] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [markingComplete, setMarkingComplete] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  // Media states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const [viewerMode, setViewerMode] = useState<'video' | 'file' | 'image' | 'all'>('all')
  const [showControls, setShowControls] = useState(true)
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)

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

  // ✅ FIXED: Safe array extraction - handle all possible data structures
  const getCompletedLessonIds = (): string[] => {
    try {
      if (!enrollment) return []
      
      // Case 1: completedLessons is an array of objects with lessonId
      if (Array.isArray(enrollment.completedLessons)) {
        return enrollment.completedLessons.map((cl: any) => cl.lessonId || cl.id || cl).filter(Boolean)
      }
      
      // Case 2: progress is an array of objects with lessonId  
      if (Array.isArray(enrollment.progress)) {
        return enrollment.progress.map((p: any) => p.lessonId || p.id || p).filter(Boolean)
      }
      
      // Case 3: progress is an array of strings directly
      if (typeof enrollment.progress === 'object' && Array.isArray(Object.values(enrollment.progress))) {
        return Object.values(enrollment.progress).map(String).filter(Boolean)
      }
      
      // Case 4: lessons array inside enrollment
      if (Array.isArray(enrollment.lessons)) {
        return enrollment.lessons.filter((l: any) => l.completed || l.status === 'COMPLETED').map((l: any) => l.id || l.lessonId)
      }
      
      return []
    } catch (e) {
      console.error('Error parsing completed lessons:', e)
      return []
    }
  }

  const completedLessonIdsList = getCompletedLessonIds()
  // Merge server-confirmed completions with locally-tracked ones for instant UI feedback
  const completedLessonIds = new Set([...completedLessonIdsList, ...Array.from(localCompleted)])

  // ✅ FIXED: Safe sections extraction - ensure it's always an array
  const sections: any[] = Array.isArray(course?.sections) 
    ? course.sections 
    : Array.isArray(course?.modules) 
      ? course.modules 
      : []
  
  const allLessons = sections.flatMap((s: any) => Array.isArray(s.lessons) ? s.lessons : [])
  const activeLesson = allLessons.find((l: any) => l.id === activeLessonId)
  const activeLessonIndex = allLessons.findIndex((l: any) => l.id === activeLessonId)
  const prevLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null
  const nextLesson = activeLessonIndex < allLessons.length - 1 ? allLessons[activeLessonIndex + 1] : null

  // Lock system: each lesson requires the previous one to be completed
  const isLessonUnlocked = (lessonId: string): boolean => {
    if (!isEnrolled) return false
    const idx = allLessons.findIndex((l: any) => l.id === lessonId)
    if (idx <= 0) return true // first lesson always accessible
    return completedLessonIds.has(allLessons[idx - 1]?.id)
  }

  const isCourseComplete =
    allLessons.length > 0 && allLessons.every((l: any) => completedLessonIds.has(l.id))
  
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
  
  const isCurrentCompleted = activeLessonId ? completedLessonIds.has(activeLessonId) : false
  const completedCount = completedLessonIds.size
  const totalLessons = allLessons.length
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''

  // Auto-select lesson
  useEffect(() => {
    if (!course || !isEnrolled) return
    if (lessonParam) { setActiveLessonId(lessonParam); return }
    if (!activeLessonId && sections.length > 0) {
      const firstSection = sections[0]
      if (firstSection && Array.isArray(firstSection.lessons) && firstSection.lessons.length > 0) {
        setActiveLessonId(firstSection.lessons[0].id)
      }
    }
  }, [lessonParam, isEnrolled, course, activeLessonId])

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
    setIsPlaying(false)
    setCurrentTime(0)
  }, [activeLessonId])

  // ReactPlayer v3 event handlers (native HTMLVideoElement events)
  const handleVideoReady = () => { setIsLoadingMedia(false); setVideoError(null) }
  const handleVideoWaiting = () => { setIsLoadingMedia(true) }
  const handleVideoCanPlay = () => { setIsLoadingMedia(false); setVideoError(null) }
  const handleVideoError = () => {
    setIsLoadingMedia(false)
    setVideoError('فشل تحميل الفيديو. يرجى التحقق من اتصالك بالإنترنت.')
  }
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime)
  }
  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration)
  }
  const handleVideoEnd = () => { setIsPlaying(false) }

  const togglePlay = () => setIsPlaying((prev) => !prev)
  const toggleMute = () => setIsMuted((prev) => !prev)
  const seekTo = (time: number) => {
    if (playerRef.current) playerRef.current.currentTime = time
  }
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
    // Immediately unlock next lesson in UI without waiting for server
    setLocalCompleted((prev) => new Set([...prev, activeLessonId]))
    try {
      await post(`/courses/${courseId}/lessons/${activeLessonId}/complete`, {})
      refetchEnrollment()
      qc.invalidateQueries({ queryKey: ['learn-enrollment', courseId] })
    } catch (e) {
      console.error('Error marking complete:', e)
    }
    setMarkingComplete(false)
    // Auto-advance to next lesson
    if (nextLesson) setActiveLessonId(nextLesson.id)
  }

  const handleCourseComplete = () => {
    const MAIN = process.env.NEXT_PUBLIC_MAIN_URL || ''
    window.location.href = `${MAIN}/${locale}/dashboard/certificates`
  }

  const goToNextLesson = () => { if (nextLesson) setActiveLessonId(nextLesson.id) }
  const goToPrevLesson = () => { if (prevLesson) setActiveLessonId(prevLesson.id) }

  // Content type detection
  const hasVideo = !!activeLesson?.videoUrl && !!videoUrl
  const hasFile = !!activeLesson?.fileUrl && !!fileUrl
  const hasImage = !!activeLesson?.imageUrl && !!imageUrl
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
            <button onClick={() => setShowNotes(!showNotes)} className="p-2 rounded-lg transition-colors hover:bg-purple-10" style={{ color: textSecondary }}><FileText className="h-5 w-5" /></button>
            <button className="p-2 rounded-lg transition-colors hover:bg-purple-10" style={{ color: textSecondary }}><Settings className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-full lg:w-[30%] xl:w-72 shrink-0 overflow-y-auto lg:h-[calc(100vh-58px)] lg:sticky lg:top-[58px]" style={{ background: sidebarBg, borderLeft: `1px solid ${borderColor}` }}>
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>محتوى الكورس</span>
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${purple}15}`, color: purple }}>{progress}% مكتمل</span>
            </div>

            {sections.map((section: any) => {
              if (!section || !section.id) return null
              
              const isOpen = openSections.has(section.id)
              const sectionLessons: any[] = Array.isArray(section.lessons) ? section.lessons : []
              const sectionCompletedCount = sectionLessons.filter((l: any) => completedLessonIds.has(l.id)).length
              const sectionCompleted = sectionLessons.length > 0 && sectionCompletedCount === sectionLessons.length

              return (
                <div key={section.id} className="rounded-xl overflow-hidden transition-all hover:shadow-sm" style={{ border: `1px solid ${borderColor}` }}>
                  <button onClick={() => toggleSection(section.id)} className="w-full flex items-center gap-2.5 px-3 py-3 text-right text-sm font-semibold transition-opacity hover:opacity-80" style={{ background: isDark ? '#151929' : '#ffffff', color: textPrimary }}>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center`} style={{ background: sectionCompleted ? `${green}15` : `${purple}15` }}>
                      {sectionCompleted ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: green }} /> : <BookOpen className="h-3.5 w-3.5" style={{ color: purple }} />}
                    </div>
                    <span className="flex-1 text-right leading-snug">{section.title || section.titleAr || section.titleEn}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {sectionLessons.length > 0 && (<span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sectionCompleted ? `${green}15` : cardBg, color: sectionCompleted ? green : textSecondary }}>{sectionCompletedCount}/{sectionLessons.length}</span>)}
                      <ChevronDown className="h-4 w-4 transition-transform duration-200" style={{ color: textSecondary, transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${borderColor}` }}>
                      {sectionLessons.map((lesson: any, index: number) => {
                        if (!lesson || !lesson.id) return null
                        
                        const unlocked = lesson.isFree || isLessonUnlocked(lesson.id)
                        const canAccess = unlocked
                        const isActive = activeLessonId === lesson.id
                        const isCompleted = completedLessonIds.has(lesson.id)
                        const isLocked = isEnrolled && !unlocked
                        const lessonHasVideo = !!lesson.videoUrl
                        const lessonHasFile = !!lesson.fileUrl
                        const lessonHasImage = !!lesson.imageUrl

                        return (
                          <button key={lesson.id} onClick={() => canAccess && setActiveLessonId(lesson.id)} disabled={!canAccess} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right text-sm transition-all relative group" style={{ background: isActive ? `${purple}08` : 'transparent', borderRight: isActive ? `3px solid ${purple}` : '3px solid transparent', color: isActive ? purple : canAccess ? textPrimary : textSecondary, cursor: canAccess ? 'pointer' : 'not-allowed', opacity: canAccess ? 1 : 0.45 }}>
                            <span className="text-xs w-5 text-center shrink-0" style={{ color: isActive ? purple : textSecondary, opacity: 0.6 }}>{index + 1}</span>
                            <div className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full transition-colors" style={{ background: isCompleted ? `${green}15` : isActive ? `${purple}18` : cardBg }}>
                              {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: green }} /> : isLocked ? <Lock className="h-3 w-3" style={{ color: textSecondary }} /> : !canAccess ? <Lock className="h-3 w-3" style={{ color: textSecondary }} /> : lessonHasVideo ? <Video className="h-3 w-3" style={{ color: isActive ? redColor : textSecondary }} /> : lessonHasFile ? <FileText className="h-3 w-3" style={{ color: isActive ? blueColor : textSecondary }} /> : lessonHasImage ? <Image className="h-3 w-3" style={{ color: isActive ? purpleColor : textSecondary }} /> : <File className="h-3 w-3" style={{ color: textSecondary }} />}
                            </div>
                            <span className={`flex-1 line-clamp-2 text-right leading-snug ${isActive ? 'font-semibold' : ''}`}>{lesson.title || lesson.titleAr}</span>
                            {isActive && (<div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l" style={{ background: purple }} />)}
                            {lesson.isFree && !isActive && (<span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1" style={{ background: `${teal}18`, color: teal }}><Gift className="h-3 w-3" /> مجاني</span>)}
                            {isActive && (<ChevronLeft className="h-4 w-4 shrink-0" style={{ color: purple }} />)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
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
                  <div className="video-container relative w-full flex items-center justify-center" style={{ height: viewerMode === 'all' && hasMultipleTypes ? '450px' : '100%', maxHeight: '70vh', background: '#000' }} onMouseEnter={() => setShowControls(true)} onMouseLeave={() => { if (isPlaying) setShowControls(false) }}>

                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                      <ReactPlayer
                        ref={playerRef}
                        key={videoUrl}
                        src={videoUrl}
                        playing={isPlaying}
                        muted={isMuted}
                        width="100%"
                        height="100%"
                        onReady={handleVideoReady}
                        onWaiting={handleVideoWaiting}
                        onCanPlay={handleVideoCanPlay}
                        onTimeUpdate={handleTimeUpdate}
                        onDurationChange={handleDurationChange}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={handleVideoEnd}
                        onError={handleVideoError}
                        style={{ position: 'absolute', top: 0, left: 0 }}
                      />
                    </div>

                    {/* Loading Spinner */}
                    {isLoadingMedia && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader2 className="h-12 w-12 animate-spin text-white" />
                      </div>
                    )}

                    {/* Error Message */}
                    {videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
                        <div className="text-center p-6 max-w-md">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"><Video className="h-8 w-8 text-red-400" /></div>
                          <p className="text-white font-medium mb-2">خطأ في تشغيل الفيديو</p>
                          <p className="text-white/60 text-sm mb-4">{videoError}</p>
                          <button onClick={() => { setVideoError(null); setIsLoadingMedia(true); if (playerRef.current) playerRef.current.load() }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors">إعادة المحاولة</button>
                        </div>
                      </div>
                    )}

                    {/* Custom Controls */}
                    {!isLoadingMedia && !videoError && (
                      <div className={`absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                        <div className="px-4 pt-6 pb-2">
                          {/* Progress Bar */}
                          <div className="w-full h-1 bg-white/30 rounded-full cursor-pointer group" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const percent = (e.clientX - rect.left) / rect.width; seekTo(percent * duration) }}>
                            <div className="h-full bg-red-500 rounded-full relative" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          {/* Controls Row */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3">
                              <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}</button>
                              <button onClick={goToPrevLesson} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"><SkipBack className="h-4 w-4" /></button>
                              <button onClick={goToNextLesson} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"><SkipForward className="h-4 w-4" /></button>
                              <span className="text-xs text-white/80 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                              {!isCurrentCompleted ? (
                                <button onClick={handleMarkComplete} disabled={markingComplete} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 text-xs font-medium transition-colors disabled:opacity-50">{markingComplete ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}{markingComplete ? 'جاري...' : 'تم الإكمال'}</button>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/30 rounded-lg text-green-400 text-xs font-medium"><CheckCircle2 className="h-3 w-3" /> مكتمل ✓</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    {!isPlaying && !isLoadingMedia && !videoError && (
                      <div className="absolute inset-0 flex items-center justify-center z-5 cursor-pointer" onClick={togglePlay}>
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"><Play className="h-10 w-10 text-white ml-1" /></div>
                      </div>
                    )}
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
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: blueColor, color: 'white', boxShadow: `0 4px 14px ${blueColor}30` }} onClick={(e) => { e.preventDefault(); window.open(fileUrl, '_blank'); }}><Download className="h-4 w-4" /> تحميل الملف</a>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'transparent', color: blueColor, border: `1.5px solid ${blueColor}30` }}><ExternalLink className="h-4 w-4" /> فتح</a>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative">
                      <iframe src={`${fileUrl}#toolbar=1&navpanes=0`} className="w-full h-full border-0" title={fileName} style={{ background: isDark ? '#0f0f1a' : '#e5e7eb' }} />
                    </div>
                  </div>
                )}

                {/* IMAGE VIEWER */}
                {(viewerMode === 'image' || (viewerMode === 'all' && !hasVideo && !hasFile)) && hasImage && imageUrl && (
                  <div className="min-h-[500px] flex flex-col items-center justify-center relative" style={{ background: isDark ? '#0a0a14' : '#1a1a2e' }}>
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"><ZoomIn className="h-5 w-5" /></a>
                      <a href={imageUrl} download className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"><Download className="h-5 w-5" /></a>
                    </div>
                    <div className="max-h-[600px] max-w-full p-6 flex items-center justify-center">
                      <img src={imageUrl} alt={activeLesson.title || activeLesson.titleAr || ''} className="max-h-full max-w-full object-contain rounded-xl shadow-2xl" />
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
                      {hasVideo ? <Video className="h-5 w-5" style={{ color: redColor }} /> : hasFile ? <FileText className="h-5 w-5" style={{ color: blueColor }} /> : hasImage ? <Image className="h-5 w-5" style={{ color: purpleColor }} /> : <File className="h-5 w-5" style={{ color: purple }} />}
                      <h1 className="text-xl font-bold font-madinet" style={{ color: textPrimary }}>{activeLesson.title || activeLesson.titleAr}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: textSecondary }}>
                      {activeLesson.duration && (<span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{activeLesson.duration}</span>)}
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />الدرس {activeLessonIndex + 1} من {totalLessons}</span>
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
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[60vh] items-center justify-center text-center p-6">
              <div>
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `${purple}12` }}><PlayCircle className="h-10 w-10" style={{ color: `${purple}60` }} /></div>
                <h2 className="text-xl font-bold font-madinet mb-2" style={{ color: textPrimary }}>اختر درساً للبدء</h2>
                <p className="text-sm mb-6" style={{ color: textSecondary }}>اختر أي درس من القائمة الجانبية لبدء التعلم</p>
                <button onClick={() => { const first = allLessons[0]; if (first) setActiveLessonId(first.id) }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105" style={{ background: purple }}><Play className="h-4 w-4" />ابدأ من أول درس</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Course Complete Banner */}
      {isCourseComplete && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
          <button
            onClick={handleCourseComplete}
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-bold text-white text-base transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              boxShadow: '0 4px 24px rgba(22,163,74,0.5)',
            }}
          >
            <Award className="h-5 w-5" />
            تم إكمال الكورس — احصل على شهادتك
          </button>
        </div>
      )}

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