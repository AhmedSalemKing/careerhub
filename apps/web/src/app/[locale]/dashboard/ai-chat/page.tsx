'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { get, post, del } from '../../../../lib/api'
import {
  Plus,
  MessageSquare,
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

  const handleSuggestion = (text: string) => {
    setInput(text)
  }

  const clearChat = () => {
    setActiveConvId(null)
    setMessages([])
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

      {/* ═══ MAIN CHAT AREA (REDESIGNED) ═══ */}
      <main className="flex-1 flex flex-col min-w-0">
        <div style={{
          display: 'flex', flexDirection: 'column',
          height: '100%',
          maxWidth: '900px', margin: '0 auto',
          padding: '0 1rem',
        }}>
          {/* ── HEADER ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '1.25rem 0',
            borderBottom: '1px solid var(--border)',
          }}>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted-foreground)', padding: '4px',
                display: 'flex', alignItems: 'center',
              }}
              aria-label={isAr ? 'فتح القائمة' : 'Open menu'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {/* AI Avatar */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #5120c8, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(81,32,200,0.4)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 2px' }}>
                {isAr ? 'المساعد الذكي' : 'AI Assistant'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 6px rgba(74,222,128,0.6)',
                }}/>
                <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 500 }}>
                  {isAr ? 'متاح الآن' : 'Online'}
                </span>
              </div>
            </div>
            {/* New Chat button */}
            <button onClick={clearChat}
              style={{
                marginRight: 'auto', marginLeft: isAr ? '0' : 'auto',
                padding: '6px 14px', borderRadius: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                color: 'var(--muted-foreground)', fontSize: '0.78rem',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
              {isAr ? 'محادثة جديدة' : 'New Chat'}
            </button>
          </div>

          {/* ── MESSAGES AREA ── */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1.5rem 0',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(81,32,200,0.3) transparent',
          }}>
            {isEmpty ? (
              /* ── WELCOME STATE ── */
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '3rem 1rem', textAlign: 'center',
              }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(81,32,200,0.2), rgba(124,58,237,0.15))',
                  border: '1px solid rgba(81,32,200,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                  boxShadow: '0 8px 24px rgba(81,32,200,0.2)',
                }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                    stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px' }}>
                  {isAr ? 'مرحبا! كيف يمكنني مساعدتك' : 'Hello! How can I help you?'}
                </h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem',
                  maxWidth: '400px', lineHeight: 1.7, margin: '0 0 2rem' }}>
                  {isAr
                    ? 'اسألني عن أي موضوع تعليمي، مفهوم برمجي، أو احصل على مساعدة في دراستك'
                    : 'Ask me about any educational topic, programming concept, or get help with your studies'}
                </p>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '8px',
                  justifyContent: 'center', maxWidth: '500px',
                }}>
                  {[
                    isAr ? 'اشرح لي مفهوم OOP' : 'Explain OOP concepts',
                    isAr ? 'ما الفرق بين REST و GraphQL' : 'REST vs GraphQL?',
                    isAr ? 'كيف أبدأ تعلم البرمجة' : 'How to start coding?',
                    isAr ? 'اقترح لي مسار تعلم Web Dev' : 'Web Dev learning path',
                  ].map((suggestion, i) => (
                    <button key={i}
                      onClick={() => handleSuggestion(suggestion)}
                      style={{
                        padding: '8px 16px', borderRadius: '20px',
                        background: 'rgba(81,32,200,0.1)',
                        border: '1px solid rgba(81,32,200,0.25)',
                        color: '#a78bfa', fontSize: '0.8rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(81,32,200,0.2)'
                        e.currentTarget.style.borderColor = 'rgba(81,32,200,0.5)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(81,32,200,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(81,32,200,0.25)'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── MESSAGES LIST ── */
              <>
                {messages.map((msg: any) => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: '10px', alignItems: 'flex-start',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '9px',
                        background: 'linear-gradient(135deg,#5120c8,#7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#fff" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="9" cy="12" r="1" fill="#fff"/>
                          <circle cx="15" cy="12" r="1" fill="#fff"/>
                        </svg>
                      </div>
                    )}
                    <div style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user'
                        ? '16px 4px 16px 16px'
                        : '4px 16px 16px 16px',
                      background: msg.role === 'user'
                        ? '#5120c8'
                        : 'var(--card-bg)',
                      border: msg.role === 'user'
                        ? 'none'
                        : '1px solid var(--border)',
                      color: msg.role === 'user' ? '#fff' : 'var(--foreground)',
                      fontSize: '0.9rem', lineHeight: 1.7,
                      boxShadow: msg.role === 'user'
                        ? '0 4px 12px rgba(81,32,200,0.3)' : 'none',
                    }}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <MessageContent content={msg.content} />
                      )}
                    </div>
                  </div>
                ))}

                {isStreaming && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '9px',
                      background: 'linear-gradient(135deg,#5120c8,#7c3aed)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </div>
                    <div style={{
                      padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                    }}>
                      {streamingContent ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MessageContent content={streamingContent} />
                          <span style={{
                            display: 'inline-block', width: '4px', height: '16px',
                            background: '#5120c8', borderRadius: '2px',
                            animation: 'cursorBlink 800ms infinite',
                          }}/>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          {[0,1,2].map(j => (
                            <div key={j} style={{
                              width: '7px', height: '7px', borderRadius: '50%',
                              background: '#a78bfa',
                              animation: 'bounce 1.2s infinite',
                              animationDelay: `${j * 0.2}s`,
                            }}/>
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

          {/* ── INPUT AREA ── */}
          <div style={{
            padding: '1rem 0 1.5rem',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'flex-end',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '14px', padding: '10px 14px',
              transition: 'border-color 0.2s',
            }}>
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isAr ? 'اكتب رسالتك هنا... (Enter للإرسال)' : 'Type your message... (Enter to send)'}
                disabled={isStreaming}
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: 'var(--foreground)', fontSize: '0.9rem',
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.6, maxHeight: '120px', overflowY: 'auto',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!hasInput || isStreaming}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: hasInput && !isStreaming ? '#5120c8' : 'var(--card-bg)',
                  border: `1px solid ${hasInput && !isStreaming ? '#5120c8' : 'var(--border)'}`,
                  color: hasInput && !isStreaming ? '#fff' : 'var(--muted-foreground)',
                  cursor: hasInput && !isStreaming ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transform: isAr ? 'rotate(180deg)' : 'none' }}>
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ textAlign:'center', fontSize:'0.72rem',
              color:'var(--muted-foreground)', margin:'8px 0 0' }}>
              {isAr
                ? 'المساعد الذكي يعمل بتقنية Claude AI - قد تكون الإجابات غير دقيقة أحيانا'
                : 'Powered by Claude AI - responses may occasionally be inaccurate'}
            </p>
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0) }
            30% { transform: translateY(-6px) }
          }
          @keyframes cursorBlink {
            0%, 100% { opacity: 1 }
            50% { opacity: 0 }
          }
        `}</style>
      </main>
    </div>
  )
}