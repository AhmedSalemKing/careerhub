'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import DOMPurify from 'isomorphic-dompurify'
import { get, post, del } from '../../../../lib/api'
import { Plus } from 'lucide-react'
import { notify } from '../../../../lib/notify'

// ════════════════════════════════════
// INTERFACES
// ════════════════════════════════════

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  title: string
  updatedAt: string
  messages?: { content: string; role: string }[]
}

// ════════════════════════════════════
// MARKDOWN RENDERER
// ════════════════════════════════════

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="font-medium text-base mt-3 mb-1" style={{ color: 'var(--primary)' }}>
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="font-medium text-lg mt-4 mb-2" style={{ color: 'var(--foreground)' }}>
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mr-2 mb-1">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')) }} />
        </li>
      )
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      elements.push(
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mr-2 mb-1">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>{num}</span>
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')) }} />
        </li>
      )
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-sm leading-relaxed mb-1" dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(line
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--foreground);font-weight:500">$1</strong>')
            .replace(/`(.*?)`/g, '<code style="background:var(--code-bg);color:var(--primary);padding:2px 6px;border-radius:6px;font-size:13px;font-family:monospace">$1</code>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>'))
        }} />
      )
    } else if (i > 0) {
      elements.push(<div key={i} className="h-2" />)
    }
  })

  return <div className="space-y-0.5">{elements}</div>
}



const SUGGESTED_PROMPTS_AR = [
  'ما هي الكورسات المتاحة في تطوير الويب؟',
  'كيف أبدأ تعلم البرمجة من الصفر؟',
  'ما الفرق بين Frontend و Backend؟',
  'اقترح لي مسار مهني في أمن المعلومات',
]
const SUGGESTED_PROMPTS_EN = [
  'Which web development courses are available?',
  'How do I start learning to code from scratch?',
  "What's the difference between Frontend and Backend?",
  'Suggest a career path in cybersecurity',
]

/**
 * Renders an assistant reply. Course suggestions the model writes as
 * [COURSE_SUGGESTION]title | path[/COURSE_SUGGESTION] become link chips; a
 * suggestion still being streamed (no closing tag yet) is held back so the raw
 * marker never flashes on screen.
 */
function MessageBody({ content, locale }: { content: string; locale: string }) {
  const visible = content.replace(/\[COURSE_SUGGESTION\](?:(?!\[\/COURSE_SUGGESTION\])[\s\S])*$/, '')
  const parts = visible.split(/\[COURSE_SUGGESTION\]([\s\S]*?)\[\/COURSE_SUGGESTION\]/g)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part.trim() ? <MessageContent key={i} content={part} /> : null
        const [title, rawPath] = part.split('|').map((x) => x.trim())
        // Only same-site paths are linked; anything else falls back to the catalogue.
        const href = rawPath && rawPath.startsWith('/') && !rawPath.startsWith('//') ? rawPath : `/${locale}/courses`
        return (
          <a
            key={i}
            href={href}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, margin: '4px 0',
              background: 'var(--primary-muted)', border: '1px solid var(--primary-border)',
              color: 'var(--primary)', textDecoration: 'none',
              fontFamily: 'PingAR, sans-serif', fontWeight: 300, fontSize: 13,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 7v14" />
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
            </svg>
            {title}
          </a>
        )
      })}
    </>
  )
}

// ════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════

export default function AiChatPage() {
  const locale = useLocale()
  const qc = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)
  const isInitialMount = useRef(true)

  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAr = locale === 'ar'

  // ── Queries ────────────────────
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      try {
        const res = await get('/ai/conversations')
        return (res?.data as any)?.data ?? []
      } catch (error) {
        console.error('Failed to load conversations:', error)
        return []
      }
    },
  })

  const loadConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId)
    setMessages([])
    setSidebarOpen(false)
    
    try {
      const res = await get(`/ai/conversations/${convId}`)
      const data = (res?.data as any)?.data
      if (data?.messages) {
        setMessages(data.messages as Message[])
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }, [])

  const createConv = useMutation({
    mutationFn: async () => {
      try {
        const res = await post('/ai/conversations', { context: 'dashboard' })
        return (res?.data as any)?.data
      } catch (error) {
        console.error('Error creating conversation:', error)
        throw error
      }
    },
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['ai-conversations'] })
      setActiveConvId(conv.id)
      setMessages([])
      setSidebarOpen(false)
    },
    onError: (error) => {
      console.error('Error creating conversation:', error)
      notify.error('فشل إنشاء المحادثة')
    },
  })

  const deleteConv = useMutation({
    mutationFn: async (id: string) => {
      try {
        await del(`/ai/conversations/${id}`)
      } catch (error) {
        console.error('Error deleting conversation:', error)
        throw error
      }
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['ai-conversations'] })
      if (activeConvId === id) {
        setActiveConvId(null)
        setMessages([])
      }
    },
    onError: (error) => {
      console.error('Error deleting conversation:', error)
      notify.error('فشل حذف المحادثة')
    },
  })

  // ── Send Message ──────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return

      let convId = activeConvId
      
      // Create conversation if none exists
      if (!convId) {
        try {
          const res = await post('/ai/conversations', { context: 'dashboard' })
          convId = (res?.data as any)?.data?.id
          
          if (!convId) {
            console.error('Failed to create conversation: No ID returned')
            return
          }
          
          setActiveConvId(convId)
          qc.invalidateQueries({ queryKey: ['ai-conversations'] })
        } catch (error) {
          console.error('Error creating conversation:', error)
          notify.error('فشل بدء المحادثة')
          return
        }
      }

      // Add user message immediately
      const userMsg: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // ✅ FIX #9: substring instead of substr
        role: 'user' as const,
        content: text,
        createdAt: new Date().toISOString(),
      }

      setMessages(prev => [...prev, userMsg])
      setInput('')
      setIsStreaming(true)
      setStreamingContent('')

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      try {
        const token = localStorage.getItem('deveway_token') || 
                     document.cookie.match(/deveway_token=([^;]+)/)?.[1] || ''

        const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
        const response = await fetch(`${API_BASE}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId: convId, message: text }),
        })

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        
        if (!reader) {
          throw new Error('No reader available')
        }

        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          if (!value) continue
          
          const chunk = decoder.decode(value)
          
          if (!chunk) continue
          
          const lines = chunk.split('\n').filter((line: string) => line.startsWith('data: '))
          
          for (const line of lines) {
            const data = line.replace(/^data:\s*/, '').trim()
            
            if (!data || data === '[DONE]') break
            
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.content && typeof parsed.content === 'string') {
                fullContent += parsed.content
                setStreamingContent(fullContent)
              }
              
              if (parsed.error) {
                throw new Error(parsed.error || 'Unknown AI error')
              }
            } 
            catch (error: unknown) {
              console.error('Skipping malformed JSON chunk:', error)
              continue
            }
          }
        }

        // Add final AI message
        if (fullContent) {
          const aiMsg: Message = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // ✅ FIX #9
            role: 'assistant' as const,
            content: fullContent,
            createdAt: new Date().toISOString(),
          }
          
          setMessages(prev => [...prev, aiMsg])
        }
      } catch (error) {
        console.error('Send message error:', error)
        notify.error('حدث خطأ في إرسال رسالتك')
      } finally {
        setIsStreaming(false)
        setStreamingContent('')
        qc.invalidateQueries({ queryKey: ['ai-conversations'] })
      }
    },
    [activeConvId, isStreaming, qc]
  )

  // ── Auto-scroll inside messages container only ──
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // ── Auto-load / create conversation on mount ──
  useEffect(() => {
    if (!isInitialMount.current || !Array.isArray(conversations)) return
    isInitialMount.current = false

    if (conversations.length > 0 && conversations[0]?.id) {
      loadConversation(conversations[0].id)
    } else {
      createConv.mutate()
    }
  }, [conversations, loadConversation, createConv])

  // ── Composition handlers ─────────
  const handleCompositionStart = () => { isComposingRef.current = true }
  const handleCompositionEnd = () => { isComposingRef.current = false }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // ── Input change handler ─────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    
    // Auto-resize textarea
    e.target.style.height = 'auto'
    
    const newHeight = Math.min(e.target.scrollHeight, 140)
    e.target.style.height = `${newHeight}px`
  }

  const clearChat = () => {
    setActiveConvId(null)
    setMessages([])
  }

  // ── Computed values ──────────────
  const isEmpty = messages.length === 0 && !isStreaming
  const hasInput = input.trim().length > 0

  // ── RENDER ──────────────────────
  const SUGGESTED_PROMPTS = isAr ? SUGGESTED_PROMPTS_AR : SUGGESTED_PROMPTS_EN
  const F = 'PingAR, sans-serif'
  const avatar = (size: number, icon: number) => (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'var(--primary)', color: 'var(--primary-foreground)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
        <circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    </div>
  )

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        display: 'flex', height: 'calc(100dvh - 80px)', overflow: 'hidden',
        background: 'var(--background)', color: 'var(--foreground)', fontFamily: F,
      }}
    >
      {/* ═══ SIDEBAR ═══ */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'color-mix(in srgb, var(--background) 60%, transparent)' }}
        />
      )}
      <aside
        className={`fixed inset-y-0 z-50 flex w-[272px] flex-col transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          isAr ? 'right-0' : 'left-0'
        } ${sidebarOpen ? 'translate-x-0' : isAr ? 'translate-x-full' : '-translate-x-full'}`}
        style={{
          background: 'var(--card)',
          [isAr ? 'borderLeft' : 'borderRight']: '1px solid var(--border)',
        }}
        aria-label={isAr ? 'قائمة المحادثات' : 'Conversations'}
      >
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => createConv.mutate()}
            disabled={createConv.isPending}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--foreground)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: F, fontWeight: 300, fontSize: 13,
            }}
          >
            <Plus size={14} strokeWidth={2} />
            {isAr ? 'محادثة جديدة' : 'New conversation'}
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: F, fontWeight: 300, fontSize: 12, color: 'var(--muted-foreground)' }}>
              {isAr ? 'لا توجد محادثات سابقة' : 'No previous conversations'}
            </div>
          ) : (
            conversations.map((conv) => {
              const active = activeConvId === conv.id
              return (
                <div
                  key={conv.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2,
                    borderRadius: 8, background: active ? 'var(--primary-subtle)' : 'transparent',
                  }}
                >
                  <button
                    onClick={() => loadConversation(conv.id)}
                    style={{
                      flex: 1, minWidth: 0, padding: '10px 12px', border: 'none',
                      background: 'transparent', cursor: 'pointer', textAlign: isAr ? 'right' : 'left',
                      color: active ? 'var(--primary)' : 'var(--foreground)',
                      fontFamily: F, fontWeight: 300, fontSize: 12,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={() => deleteConv.mutate(conv.id)}
                    aria-label={isAr ? 'حذف المحادثة' : 'Delete conversation'}
                    style={{
                      width: 28, height: 28, border: 'none', background: 'transparent',
                      color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </nav>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, background: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="md:hidden"
              aria-label={isAr ? 'القائمة' : 'Menu'}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'color-mix(in srgb, var(--foreground) 6%, transparent)',
                color: 'var(--foreground)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {avatar(36, 18)}
            <div>
              <h1 style={{ margin: 0, fontFamily: F, fontWeight: 900, fontSize: 15, color: 'var(--foreground)' }}>
                {isAr ? 'رشيد — مساعد DeveWay' : 'Rasheed — DeveWay assistant'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success, currentColor)', color: 'var(--success, var(--primary))' }} />
                <span style={{ fontFamily: F, fontWeight: 300, fontSize: 11, color: 'var(--muted-foreground)' }}>
                  {isAr ? 'متاح الآن' : 'Online'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted-foreground)', cursor: 'pointer',
              fontFamily: F, fontWeight: 300, fontSize: 12,
            }}
          >
            <Plus size={12} strokeWidth={2} />
            {isAr ? 'جديد' : 'New'}
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 20px 8px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          {isEmpty ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 8px' }}>
              {avatar(64, 30)}
              <h2 style={{ margin: '16px 0 6px', fontFamily: F, fontWeight: 500, fontSize: 18, color: 'var(--foreground)' }}>
                {isAr ? 'مرحباً، أنا رشيد' : "Hi, I'm Rasheed"}
              </h2>
              <p style={{ margin: '0 0 24px', maxWidth: 420, fontFamily: F, fontWeight: 300, fontSize: 13, lineHeight: 1.8, color: 'var(--muted-foreground)' }}>
                {isAr
                  ? 'مساعدك الذكي في DeveWay. أساعدك في اختيار الكورس المناسب، ومسارك المهني، وشرح المفاهيم التقنية.'
                  : 'Your DeveWay assistant. I help you pick courses, plan your career path and explain technical concepts.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560 }}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)',
                      background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
                      fontFamily: F, fontWeight: 300, fontSize: 12,
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg: any) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id}
                    style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}
                  >
                    {isUser ? (
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: 'color-mix(in srgb, var(--foreground) 10%, transparent)',
                          color: 'var(--foreground)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    ) : (
                      avatar(32, 14)
                    )}
                    <div
                      style={{
                        maxWidth: '78%', padding: '12px 16px', borderRadius: 14,
                        background: isUser ? 'var(--primary-muted)' : 'var(--card)',
                        border: isUser ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                        fontFamily: F, fontWeight: 300, fontSize: 14, lineHeight: 1.7,
                        color: 'var(--foreground)',
                      }}
                    >
                      {isUser ? (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                      ) : (
                        <MessageBody content={msg.content} locale={locale} />
                      )}
                    </div>
                  </div>
                )
              })}

              {isStreaming && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {avatar(32, 14)}
                  <div
                    style={{
                      maxWidth: '78%', padding: '12px 16px', borderRadius: 14,
                      background: 'var(--card)', border: '1px solid var(--border)',
                      fontFamily: F, fontWeight: 300, fontSize: 14, color: 'var(--foreground)',
                    }}
                  >
                    {streamingContent ? (
                      <MessageBody content={streamingContent} locale={locale} />
                    ) : (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: 'var(--muted-foreground)',
                              animation: `bounce 1.2s ease ${j * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--background)',
              border: '1px solid var(--border)', borderRadius: 14, padding: '8px 12px',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={isAr ? 'اسأل رشيد...' : 'Ask Rasheed...'}
              disabled={isStreaming}
              rows={1}
              style={{
                flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none',
                fontFamily: F, fontWeight: 300, fontSize: 14, color: 'var(--foreground)',
                lineHeight: 1.6, minHeight: 24, maxHeight: 120, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!hasInput || isStreaming}
              aria-label={isAr ? 'إرسال' : 'Send'}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
                background: hasInput && !isStreaming ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)',
                color: hasInput && !isStreaming ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                cursor: hasInput && !isStreaming ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAr ? 'scaleX(-1)' : 'none' }}>
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div style={{ marginTop: 8, textAlign: 'center', fontFamily: F, fontWeight: 300, fontSize: 11, color: 'var(--muted-foreground)' }}>
            {isAr ? 'رشيد مخصص لمساعدتك في رحلتك التعليمية على DeveWay' : 'Rasheed is here to support your learning journey on DeveWay'}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
