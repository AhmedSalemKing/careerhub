'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { get, post, del } from '../../../../lib/api'
import {
  Send,
  Plus,
  Trash2,
  User,
  Loader2,
  Sparkles,
  MessageSquare,
  Target,
  X,
  Menu,
  GraduationCap,
  BrainCircuit,
  Check,
  Clock,
} from 'lucide-react'
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
        <h3 key={i} className="font-semibold text-base mt-3 mb-1" style={{ color: 'var(--primary)' }}>
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="font-semibold text-lg mt-4 mb-2" style={{ color: 'var(--foreground)' }}>
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mr-2 mb-1">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </li>
      )
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      elements.push(
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mr-2 mb-1">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>{num}</span>
          <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </li>
      )
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-sm leading-relaxed mb-1" dangerouslySetInnerHTML={{
          __html: line
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--foreground);font-weight:600">$1</strong>')
            .replace(/`(.*?)`/g, '<code style="background:var(--code-bg);color:var(--primary);padding:2px 6px;border-radius:6px;font-size:13px;font-family:monospace">$1</code>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
        }} />
      )
    } else if (i > 0) {
      elements.push(<div key={i} className="h-2" />)
    }
  })

  return <div className="space-y-0.5">{elements}</div>
}

// ════════════════════════════════════
// TYPING INDICATOR
// ══════════════════════════════════

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: 'var(--muted)',
            animation: `typingBounce 1.4s ease-in-out ${i * 0.16}s infinite`
          }}
        />
      ))}
    </div>
  )
}

// ════════════════════════════════════
// MESSAGE BUBBLE
// ══════════════════════════════════

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(msg.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  let timeStr = ''
  try {
    timeStr = new Date(msg.createdAt).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    timeStr = '--:--'
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105`}
        style={
          isUser 
            ? { background: 'var(--primary)' } 
            : { background: 'var(--surface-2)', border: `1px solid var(--border)` }
        }
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <BrainCircuit className="h-4 w-4" style={{ color: 'var(--primary)' }} />
        )}
      </div>

      {/* Content Wrapper */}
      <div className="relative max-w-[75%] min-w-[100px]">
        
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser ? 'rounded-tr-md' : 'rounded-tl-md'
          }`}
          style={
            isUser
              ? { background: 'var(--primary)', color: '#ffffff' }
              : { background: 'var(--surface)', border: `1px solid var(--border)`, color: 'var(--foreground)' }
          }
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <MessageContent content={msg.content} />
          )}
        </div>

        {/* Meta Row */}
        <div 
          className={`flex items-center gap-2 mt-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {timeStr}
          </span>
          
          {!isUser && (
            <button
              onClick={handleCopy}
              className="p-1 rounded-md transition-colors duration-150"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => { if(e.currentTarget) e.currentTarget.style.color = 'var(--primary)' }}
              onMouseLeave={(e) => { if(e.currentTarget) e.currentTarget.style.color = 'var(--muted)' }}
              title="نسخ الرسالة"
            >
              {copied ? <Check className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════

export default function AiChatPage() {
  const locale = useLocale()
  const qc = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  void locale

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
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
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
              console.warn('Skipping malformed JSON chunk:', error)
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

  // ── Auto-scroll to bottom ─────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent])

  // ── Keyboard handler ─────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  // ── Computed values ──────────────
  const isEmpty = messages.length === 0 && !isStreaming
  const hasInput = input.trim().length > 0

  // ── RENDER ──────────────────────
  return (
    <div 
      className="flex h-screen overflow-hidden"
      dir="rtl"
      style={{ 
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ═══ SIDEBAR ═══ */}
      {/* ✅ FIX #1: Changed 'flex col' to 'flex flex-col' */}
      <aside 
        className={`
          fixed 
          inset-y-0 
          right-0 
          z-30 
          w-[288px]
          md:w-[256px]
          lg:w-[288px]
          flex 
          flex-col 
          border-l 
          transition-transform 
          duration-300 
          ease-out 
          md:relative 
          md:right-auto 
          md:left-0 
          md:w-64 
          lg:w-72 
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          md:translate-x-0
        `}
        style={{ 
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        {/* New Chat Button */}
        <div 
          className="p-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => createConv.mutate()}
            disabled={createConv.isPending}
            className="
              w-full 
              flex 
              items-center 
              justify-center 
              gap-2 
              rounded-xl 
              px-4 
              py-2.5 
              text-sm 
              font-bold 
              transition-all 
              duration-200 
              hover:scale-[1.02] 
              active:scale-[0.98]
            "
            style={{
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              fontFamily: "'PingARLT', sans-serif",
              boxShadow: '0 2px 8px rgba(81, 32, 200, 0.25)',
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>محادثة جديدة</span>
          </button>
        </div>

        {/* Conversations List */}
        <nav 
          className="flex-1 overflow-y-auto p-2"
          aria-label="قائمة المحادثات"
        >
          {conversations.length === 0 ? (
            <div 
              className="
                flex 
                flex-col 
                items-center 
                justify-center 
                py-16 
                px-4 
                text-center 
              "
            >
              <MessageSquare 
                className="
                  h-12 
                  w-12 
                  mb-4 
                  opacity-20 
                " 
                style={{ color: 'var(--muted)' }} 
              />
              <p 
                className="text-sm font-medium mt-2"
                style={{ color: 'var(--muted)' }} 
              >
                لا توجد محادثات بعد
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: 'var(--muted-foreground)' }} 
              >
                ابدأ محادثة جديدة!
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => loadConversation(conv.id)}
                    className="
                      w-full 
                      text-right 
                      flex 
                      items-center 
                      gap-3 
                      rounded-xl 
                      px-3 
                      py-2.5 
                      text-sm 
                      transition-all 
                      duration-150 
                      hover:bg-[color:var(--surface-2)]
                      active:bg-[color:var(--primary-subtle)]
                    "
                    style={{
                      backgroundColor: activeConvId === conv.id ? 'var(--primary-subtle)' : 'transparent',
                      color: activeConvId === conv.id ? 'var(--primary)' : 'var(--foreground)',
                    }}
                  >
                    <MessageSquare 
                      className="h-4 w-4 shrink-0 opacity-60"
                      style={{ 
                        color: activeConvId === conv.id ? 'var(--primary)' : 'var(--muted)' 
                      }} 
                    />
                    
                    <span 
                      className="
                        truncate 
                        flex-1 
                        text-right 
                        font-medium 
                      " 
                      style={{ 
                        color: activeConvId === conv.id ? 'var(--primary)' : 'var(--foreground)' 
                      }} 
                    >
                      {conv.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* Mobile Close Button */}
        <div 
          className="
            md:hidden 
            p-3 
            border-t 
            mt-auto 
          " 
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="
              w-full 
              py-2.5 
              rounded-xl 
              text-sm 
              font-medium 
              transition-colors 
              duration-150 
              hover:opacity-80 
            "
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--foreground)',
            }}
          >
            إغلاق القائمة
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="
            fixed 
            inset-0 
            z-40 
            bg-black/50 
            backdrop-blur-sm 
            md:hidden 
          "
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ MAIN CHAT AREA ═══ */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">

        {/* ── HEADER ── */}
        <header 
          className="
            flex 
            items-center 
            justify-between 
            px-4 
            lg:px-6 
            py-3 
            shrink-0 
            relative 
            z-10 
          "
          style={{ 
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
          }}
        >
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="
              md:hidden 
              p-2 
              -ml-2 
              rounded-lg 
              hover:opacity-80 
              transition-colors 
              duration-150 
            "
            style={{ color: 'var(--muted)'}}
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="h-5 w-5" strokeWidth={2}/>
          </button>

          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div 
              className="
                flex 
                items-center 
                justify-center 
                h-9 
                w-9 
                rounded-xl 
                shadow-lg 
                transition-transform 
                duration-200 
                hover:scale-105 
              "
              style={{
                backgroundColor: 'var(--primary)',
                boxShadow: '0 4px 14px rgba(81, 32, 200, 0.3)',
              }}
            >
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5}/>
            </div>

            {/* Title & Status */}
            <div>
              <h1 
                className="
                  text-base 
                  font-bold 
                  tracking-tight 
                  leading-none 
                "
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: 'var(--foreground)',
                }}
              >
                DeveWay AI
              </h1>
            </div>

            {/* ✅ FIX #2: Added proper border to Online Status Badge */}
            <div 
              className="
                hidden 
                sm:flex 
                items-center 
                gap-1.5 
                rounded-full 
                px-3 
                py-1 
                text-xs 
                font-semibold 
              "
              style={{
                backgroundColor: 'rgba(52, 199, 89, 0.08)',
                border: '1px solid rgba(52, 199, 89, 0.15)', // ✅ Added border property
              }}
            >
              <span 
                className="
                  h-1.5 
                  w-1.5 
                  rounded-full 
                  animate-pulse 
                " 
                style={{ backgroundColor: '#34D399' }}
              />
              <span 
                style={{ 
                  color: '#34D399',
                  fontSize: '11px',
                  fontWeight: 600,
                }} 
              >
                متصل
              </span>
            </div>
          </div>
        </header>

        {/* ── MESSAGES AREA ── */}
        <section 
          className="
            flex-1 
            overflow-y-auto 
            px-4 
            py-6 
            min-h-0 
          "
        >
          {isEmpty ? (
            /* ── WELCOME SCREEN ── */
            <div 
              className="
                flex 
                flex-col 
                items-center 
                justify-center 
                h-full 
                px-4 
                py-16 
                text-center 
              "
            >
              {/* Hero Icon */}
              <div 
                className="
                  mb-6 
                  flex 
                  h-20 
                  w-20 
                  items-center 
                  justify-center 
                  rounded-2xl 
                  mx-auto 
                "
                style={{
                  backgroundColor: 'var(--primary-subtle)',
                  border: '1px solid var(--primary-border)',
                  boxShadow: '0 0 40px rgba(81, 32, 200, 0.10)',
                }}
              >
                <BrainCircuit 
                  className="
                    h-10 
                    w-10 
                  " 
                  style={{ color: 'var(--primary)' }} 
                  strokeWidth={2.5} 
                />
              </div>

              {/* Welcome Text */}
              <h2 
                className="
                  mb-2 
                  text-2xl 
                  font-black 
                  tracking-tight 
                  leading-snug 
                "
                style={{ 
                  fontFamily: "'PingARLT', 'Cairo', sans-serif",
                  color: 'var(--foreground)',
                }}
              >
                مرحباً! 👋
              </h2>
              
              <p 
                className="
                  max-w-md 
                  mx-auto 
                  mb-8 
                  text-sm 
                  leading-relaxed 
                "
                style={{ 
                  color: 'var(--muted)', 
                }}
              >
                أنا مساعدك الذكي الشخصي. اسألني عن أي شيء.
              </p>

              {/* Quick Suggestions */}
              <div 
                className="
                  flex 
                  flex-wrap 
                  justify-center 
                  gap-2 
                  max-w-lg 
                  mx-auto 
                  mb-8 
                "
              >
                {['تعلم البرمجة', 'خطة تعلم', 'مسار مهني'].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(suggestion)}
                    className="
                      px-4 
                      py-2 
                      rounded-full 
                      text-xs 
                      font-medium 
                      transition-all 
                      duration-200 
                      hover:scale-105 
                      active:scale-95 
                      border 
                      shadow-none 
                    "
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--muted)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-border)'
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--muted)'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── MESSAGES LIST ── */
            <div 
              className="
                max-w-3xl 
                mx-auto 
                space-y-4 
                px-4 
                pb-32 
              "
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Streaming Indicator */}
              {isStreaming && (
                <div className="flex gap-3">
                  {/* AI Avatar */}
                  <div 
                    className="
                      flex 
                      h-8 
                      w-8 
                      shrink-0 
                      items-center 
                      justify-center 
                      rounded-xl 
                    "
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <BrainCircuit 
                      className="h-4 w-4" 
                      style={{ color: 'var(--primary)' }} 
                      strokeWidth={2}
                    />
                  </div>

                  {/* Typing or Streaming Bubble */}
                  <div 
                    className="
                      max-w-[70%] 
                      rounded-2xl 
                      rounded-tl-md 
                      px-4 
                      py-3 
                      border 
                      shadow-sm 
                    "
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {streamingContent ? (
                      <>
                        <MessageContent content={streamingContent} />
                        
                        {/* Cursor blink effect */}
                        <span 
                          className="
                            inline-block 
                            h-4 
                            w-0.5 
                            align-middle 
                            rounded-full 
                            ml-1 
                            animate-pulse 
                          " 
                          style={{
                            backgroundColor: 'var(--primary)',
                            animationDuration: '800ms',
                            animationIterationCount: 'infinite',
                          }}
                        />
                      </>
                    ) : (
                      <TypingIndicator />
                    )}
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>
{/* ── INPUT AREA ── */}
<footer 
  className="
    shrink-0 
    px-4 
    pb-4 
    pt-3 
    sticky 
    bottom-0 
    z-10 
  "
  style={{
    background: 'linear-gradient(to top, var(--surface) 80%, transparent)',
  }}
>
  {/* Quick Action Chips */}
  {!isEmpty && (
    <div 
      className="
        flex 
        justify-center 
        gap-2 
        mb-3 
        overflow-x-auto 
        pb-1
      "
    >
      {['تلخيص', 'شرح', 'مثال', 'خطة'].map((action, index) => (
        <button
          key={index}
          onClick={() => sendMessage(action)}
          className="
            shrink-0 
            px-3.5 
            py-1.5 
            rounded-full 
            text-xs 
            font-medium 
            transition-all 
            duration-200 
            hover:scale-105 
            active:scale-95 
            border
          "
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-subtle)'
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.color = 'var(--primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--muted-foreground)'
          }}
        >
          {action}
        </button>
      ))}
    </div>
  )}

  {/* ═══ PROFESSIONAL INPUT BAR ═══ */}
  <div 
    className="
      relative 
      flex 
      items-center 
      gap-2 
      rounded-2xl
      transition-all 
      duration-300 
      group
    "
    style={{
      background: 'var(--background)',
      border: `2px solid ${hasInput ? 'var(--primary)' : 'var(--border)'}`,
      boxShadow: hasInput 
        ? '0 0 0 4px rgba(99, 102, 241, 0.1), 0 8px 32px rgba(81, 32, 200, 0.15)'
        : '0 2px 12px rgba(0, 0, 0, 0.08)',
      transform: hasInput ? 'translateY(-2px)' : 'translateY(0)',
    }}
  >
    {/* ✨ Decorative gradient border effect on focus */}
    {hasInput && (
      <div 
        className="absolute -inset-[2px] rounded-2xl -z-10 opacity-50 blur-sm"
        style={{
          background: 'linear-gradient(135deg, var(--primary), #8b5cf6, var(--primary))',
        }}
      />
    )}

    {/* Textarea - takes full available space */}
    <textarea
      ref={textareaRef}
      value={input}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder="اكتب رسالتك هنا..."
      disabled={isStreaming}
      rows={1}
      className="
        flex-1 
        resize-none 
        bg-transparent 
        outline-none 
        disabled:opacity-50 
        text-sm 
        leading-relaxed
        max-h-[120px] 
        py-3 
        pl-3 
        pr-2
        placeholder:text-muted-400
      "
      style={{
        color: 'var(--foreground)',
        fontFamily: "'DM Sans', sans-serif",
        caretColor: 'var(--primary)',
      }}
    />

    {/* Send Button - Integrated inside the bar */}
    <button
      onClick={() => sendMessage(input)}
      disabled={!hasInput || isStreaming}
      className="
        flex 
        items-center 
        justify-center
        h-9 
        w-9 
        shrink-0 
        rounded-xl 
        transition-all 
        duration-200 
        m-1.5
        active:scale-90
      "
      style={{
        background: hasInput 
          ? 'linear-gradient(135deg, var(--primary), #7c3aed)'
          : 'var(--surface-2)',
        color: hasInput ? '#ffffff' : 'var(--muted)',
        cursor: hasInput ? 'pointer' : 'not-allowed',
        boxShadow: hasInput 
          ? '0 4px 14px rgba(99, 102, 241, 0.4)'
          : 'none',
        opacity: hasInput ? 1 : 0.5,
      }}
    >
      {isStreaming ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
      ) : (
        <Send className="h-4 w-4" strokeWidth={2.5} />
      )}
    </button>
  </div>

  {/* Disclaimer */}
  <p 
    className="
      text-center 
      text-[11px] 
      pt-2.5 
      select-none
      tracking-wide
    "
    style={{ 
      color: 'var(--muted-foreground)',
      opacity: 0.7,
    }}
  >
    DeveWay AI • Llama 3.3 ⚡
  </p>
</footer>
      </main>
    </div>
  )
}