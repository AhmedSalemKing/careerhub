'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle, Lock, Send,
  Menu, X, Bot, User, Loader2
} from 'lucide-react'
import { get, post } from '../../../../../lib/api'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Skeleton } from '../../../../components/ui/skeleton'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Separator } from '../../../../components/ui/separator'
import { useToast } from '../../../../../lib/toast'

interface Lesson {
  id: string
  title: Record<string, string>
  description?: Record<string, string>
  duration: number
  order: number
  playbackUrl?: string
  isCompleted: boolean
  isLocked: boolean
  progress?: number
}

interface Module {
  id: string
  title: Record<string, string>
  description?: Record<string, string>
  lessons: Lesson[]
}

interface Course {
  id: string
  title: Record<string, string>
  modules: Module[]
  totalProgress: number
}

interface AIResponse {
  message: string
  suggestions?: string[]
}

export default function LearnPage() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const isRTL = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { toast } = useToast()

  const [currentLessonId, setCurrentLessonId] = useState<string>('')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [aiMessage, setAiMessage] = useState('')
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isTyping, setIsTyping] = useState(false)

  const videoRef = useRef<HTMLIFrameElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const queryClient = useQueryClient()

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course-learn', slug],
    queryFn: () => get<Course>(`/courses/${slug}/learn`),
  })

  const { data: previousLesson } = useQuery({
    queryKey: ['previous-lesson', currentLessonId],
    queryFn: () => get<{ lesson: Lesson }>(`/lessons/${currentLessonId}/previous`),
    enabled: !!currentLessonId,
  })

  const { data: nextLesson } = useQuery({
    queryKey: ['next-lesson', currentLessonId],
    queryFn: () => get<{ lesson: Lesson }>(`/lessons/${currentLessonId}/next`),
    enabled: !!currentLessonId,
  })

  const progressMutation = useMutation({
    mutationFn: (progress: number) => post(`/lessons/${currentLessonId}/progress`, { progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-learn', slug] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => post(`/lessons/${currentLessonId}/complete`),
    onSuccess: () => {
      toast({ description: t('learn.lesson_completed'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['course-learn', slug] })
      if (nextLesson?.data?.lesson) {
        setCurrentLessonId(nextLesson.data.lesson.id)
      }
    },
    onError: () => {
      toast({ description: t('errors.something_wrong'), variant: 'danger' })
    },
  })

  const aiMutation = useMutation({
    mutationFn: (message: string) => post<AIResponse>('/api/ai/lesson-assistant', {
      lessonId: currentLessonId,
      message,
    }),
    onSuccess: (response) => {
      setIsTyping(false)
      const assistantMessage = response.data.message
      setAiMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])

      if (response.data.suggestions) {
        response.data.suggestions.forEach(suggestion => {
          setAiMessages(prev => [...prev, { role: 'assistant', content: suggestion }])
        })
      }
    },
    onError: () => {
      setIsTyping(false)
      toast({ description: t('errors.something_wrong'), variant: 'danger' })
    },
  })

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (currentLessonId && videoRef.current) {
      progressIntervalRef.current = setInterval(() => {
        // In a real implementation, you'd get the actual video progress
        // For now, we'll simulate it
        const mockProgress = Math.random() * 100
        progressMutation.mutate(mockProgress)
      }, 10000)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentLessonId])

  // Set first lesson as current when course loads
  useEffect(() => {
    if (courseData?.data && !currentLessonId) {
      const firstModule = courseData.data.modules[0]
      if (firstModule && firstModule.lessons.length > 0) {
        const firstUnlockedLesson = firstModule.lessons.find(lesson => !lesson.isLocked)
        if (firstUnlockedLesson) {
          setCurrentLessonId(firstUnlockedLesson.id)
        }
      }
    }
  }, [courseData, currentLessonId])

  const currentLesson = courseData?.data?.modules
    .flatMap(module => module.lessons)
    .find(lesson => lesson.id === currentLessonId)

  const handleSendMessage = () => {
    if (!aiMessage.trim()) return

    const userMessage = aiMessage.trim()
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setAiMessage('')
    setIsTyping(true)
    aiMutation.mutate(userMessage)
  }

  const handleMarkComplete = () => {
    if (currentLesson && !currentLesson.isCompleted) {
      completeMutation.mutate()
    }
  }

  const handlePrevious = () => {
    if (previousLesson?.data?.lesson) {
      setCurrentLessonId(previousLesson.data.lesson.id)
    }
  }

  const handleNext = () => {
    if (nextLesson?.data?.lesson) {
      setCurrentLessonId(nextLesson.data.lesson.id)
    }
  }

  if (courseLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!courseData?.data) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('errors.course_not_found')}</h1>
          <Button onClick={() => router.back()} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  const course = courseData.data

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Course Content */}
        <div className={`${leftPanelOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r bg-muted/30 overflow-hidden flex flex-col`}>
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t('learn.course_content')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeftPanelOpen(false)}
              >
                <ChevronLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>{t('learn.progress')}</span>
                <span>{course.totalProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${course.totalProgress}%` }}
                />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {course.modules.map((module) => (
                <div key={module.id} className="space-y-2">
                  <h4 className="font-medium text-sm">
                    {module.title[locale] || module.title.en}
                  </h4>
                  <div className="space-y-1">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => !lesson.isLocked && setCurrentLessonId(lesson.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${lesson.id === currentLessonId
                          ? 'bg-primary/10 border border-primary/20'
                          : lesson.isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-muted cursor-pointer'
                          }`}
                        disabled={lesson.isLocked}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {lesson.isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : lesson.isLocked ? (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            ) : lesson.id === currentLessonId ? (
                              <Circle className="h-4 w-4 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {lesson.title[locale] || lesson.title.en}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lesson.duration}m
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Video Player */}
        <div className="flex-1 flex flex-col">
          {/* Video Area */}
          <div className="flex-1 relative bg-black">
            {currentLesson?.playbackUrl ? (
              <iframe
                ref={videoRef}
                src={currentLesson.playbackUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('learn.lesson_locked')}</p>
                </div>
              </div>
            )}

            {/* Left Panel Toggle */}
            {!leftPanelOpen && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setLeftPanelOpen(true)}
              >
                <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            )}

            {/* Right Panel Toggle */}
            {!rightPanelOpen && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setRightPanelOpen(true)}
              >
                <ChevronLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>

          {/* Lesson Info */}
          <div className="p-4 border-t bg-background">
            <h2 className="text-lg font-semibold mb-2">
              {currentLesson?.title[locale] || currentLesson?.title.en}
            </h2>
            {currentLesson?.description && (
              <p className="text-sm text-muted-foreground">
                {currentLesson.description[locale] || currentLesson.description.en}
              </p>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="border-t bg-background p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={!previousLesson?.data?.lesson}
              >
                {isRTL ? <ChevronRight className="h-4 w-4 mr-2" /> : <ChevronLeft className="h-4 w-4 mr-2" />}
                {t('learn.previous_lesson')}
              </Button>

              <Button
                variant={currentLesson?.isCompleted ? "secondary" : "default"}
                onClick={handleMarkComplete}
                disabled={!currentLesson || currentLesson.isCompleted || currentLesson.isLocked}
              >
                {currentLesson?.isCompleted ? (
                  <><CheckCircle className="h-4 w-4 mr-2" /> {t('learn.completed')}</>
                ) : (
                  <><Circle className="h-4 w-4 mr-2" /> {t('learn.mark_complete')}</>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={!nextLesson?.data?.lesson}
              >
                {t('learn.next_lesson')}
                {isRTL ? <ChevronLeft className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Assistant */}
        <div className={`${rightPanelOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-l bg-muted/30 overflow-hidden flex flex-col`}>
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <h3 className="font-semibold">{t('learn.assistant')}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelOpen(false)}
              >
                <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {aiMessages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('learn.ask_assistant')}</p>
                </div>
              )}

              {aiMessages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <Bot className="h-4 w-4 mt-1" />}
                  <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                    }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === 'user' && <User className="h-4 w-4 mt-1" />}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Bot className="h-4 w-4 mt-1" />
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                placeholder={t('learn.type_message')}
                value={aiMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!aiMessage.trim() || isTyping}
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
