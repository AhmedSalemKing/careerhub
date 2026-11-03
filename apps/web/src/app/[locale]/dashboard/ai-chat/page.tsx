'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { getToken } from '@/lib/auth'

// Plain React + fetch only. The conversation lives in component state and every
// reply comes from the Gemini-backed /api/ai/chat route (Rasheed persona).

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
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

const F = 'PingAR, sans-serif'

// ════════════════════════════════════
// MESSAGE RENDERING (no HTML strings)
// ════════════════════════════════════

/** **bold**, `code` and *italic* as React nodes. */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*|(https?:\/\/[^\s)]+)/g
  let last = 0
  let n = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index))
    const key = `${keyBase}-${n++}`
    if (match[1] !== undefined) {
      out.push(<strong key={key} style={{ color: 'var(--foreground)', fontWeight: 500 }}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      out.push(
        <code key={key} style={{ background: 'var(--code-bg)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}>
          {match[2]}
        </code>,
      )
    } else if (match[4] !== undefined) {
      out.push(
        <a key={key} href={fixLink(match[4])} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          {match[4]}
        </a>,
      )
    } else {
      out.push(<em key={key}>{match[3]}</em>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function MessageContent({ content }: { content: string }) {
  const rows = content.split('\n').map((line, i) => {
    if (line.startsWith('### ') || line.startsWith('## ')) {
      const text = line.replace(/^#{2,3} /, '')
      return (
        <div key={i} style={{ fontFamily: F, fontWeight: 500, fontSize: 15, margin: '10px 0 4px', color: 'var(--foreground)' }}>
          {renderInline(text, `h-${i}`)}
        </div>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '2px 0' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', marginTop: 10, flexShrink: 0 }} />
          <span>{renderInline(line.slice(2), `li-${i}`)}</span>
        </div>
      )
    }
    const num = line.match(/^(\d+)\. (.*)$/)
    if (num) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '2px 0' }}>
          <span style={{ minWidth: 20, height: 20, borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 }}>
            {num[1]}
          </span>
          <span>{renderInline(num[2], `ol-${i}`)}</span>
        </div>
      )
    }
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />
    return <div key={i}>{renderInline(line, `p-${i}`)}</div>
  })
  return <div>{rows}</div>
}

/** The model sometimes writes the old catalogue host; the live site is devewayhub. */
const fixContent = (text: string): string =>
  text
    // the model sometimes closes the tag with ">" instead of "]"
    .replace(/\[\/COURSE_SUGGESTION>/gi, '[/COURSE_SUGGESTION]')
    .replace(/https?:\/\/deveway-teal\.vercel\.app\/(ar|en)\/courses/g, 'https://devewayhub.vercel.app/$1/courses')
    .replace(/https?:\/\/deveway-teal\.vercel\.app\/courses/g, 'https://devewayhub.vercel.app/ar/courses')

const COURSES_SITE = 'https://devewayhub.vercel.app'
const MAIN_SITE = 'https://deveway-teal.vercel.app'

/** Where a suggestion chip goes: course pages live on devewayhub, everything else on the main site. */
function suggestionHref(path: string | undefined): string {
  const fallback = `${COURSES_SITE}/ar/courses`
  if (!path) return fallback
  if (/^https?:\/\//i.test(path)) return fixContent(path)
  const rel = path.startsWith('/') ? path : `/${path}`
  if (rel.startsWith('//')) return fallback
  return rel.includes('courses') ? `${COURSES_SITE}${rel}` : `${MAIN_SITE}${rel}`
}

/** Applied to every href before it is rendered. */
const fixLink = (url: string): string => fixContent(url)

/** Sent with the first message so the model always uses the right catalogue URL. */
const COURSE_LINK_INSTRUCTION =
  'عند اقتراح أي كورس أو رابط للكورسات، استخدم دائماً هذا الرابط فقط: https://devewayhub.vercel.app/ar/courses\n' +
  'لا تستخدم أبداً: https://deveway-teal.vercel.app/ar/courses\n' +
  'عند اقتراح كورس، استخدم هذا الفورمات الدقيق فقط:\n' +
  '[COURSE_SUGGESTION]\nاسم الكورس | https://devewayhub.vercel.app/ar/courses\n[/COURSE_SUGGESTION]\n' +
  'الرابط يجب أن يكون دائماً https://devewayhub.vercel.app/ar/courses'

/** Assistant text plus [COURSE_SUGGESTION]title | path[/COURSE_SUGGESTION] link chips. */
function MessageBody({ content, locale }: { content: string; locale: string }) {
  const parts = fixContent(content).split(/\[COURSE_SUGGESTION\]([\s\S]*?)\[\/COURSE_SUGGESTION\]/g)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) {
          // drop any half-written tag the model left behind
          const text = part.replace(/\[\/?COURSE_SUGGESTION[\]>]?/gi, '')
          return text.trim() ? <MessageContent key={i} content={text} /> : null
        }
        const [title, rawPath] = part.split('|').map((x) => x.trim())
        const href = suggestionHref(rawPath)
        return (
          <a
            key={i}
            href={fixLink(href)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, margin: '4px 2px',
              background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', color: 'var(--primary)',
              textDecoration: 'none', fontFamily: F, fontWeight: 300, fontSize: 13,
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

function Avatar({ size, icon }: { size: number; icon: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--primary)',
        color: 'var(--primary-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
        <circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    </div>
  )
}

// ════════════════════════════════════
// PAGE
// ════════════════════════════════════

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

const STORAGE_KEY = 'rasheed_conversations'
const ACTIVE_KEY = 'rasheed_active_conv'
const MAX_CONVERSATIONS = 30

function readConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (c): c is Conversation => c && typeof c.id === 'string' && Array.isArray(c.messages),
    )
  } catch {
    return []
  }
}

function writeConversations(list: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* storage full or blocked: the chat still works for this session */
  }
}

export default function AiChatPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const suggestions = isAr ? SUGGESTED_PROMPTS_AR : SUGGESTED_PROMPTS_EN

  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)

  // Restore saved conversations and reopen the last active one
  useEffect(() => {
    const saved = readConversations()
    setConversations(saved)
    try {
      const activeId = localStorage.getItem(ACTIVE_KEY)
      const active = activeId ? saved.find((c) => c.id === activeId) : null
      if (active) {
        setMessages(active.messages)
        setActiveConvId(active.id)
      }
    } catch {
      /* ignore */
    }
    setLoaded(true)
  }, [])

  // Persist whenever the messages change
  useEffect(() => {
    if (!loaded || messages.length === 0) return
    const id = activeConvId ?? Date.now().toString()
    const title = messages.find((m) => m.role === 'user')?.content.slice(0, 50) || (isAr ? 'محادثة' : 'Chat')
    if (!activeConvId) setActiveConvId(id)

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === id)
      const updated = exists
        ? prev.map((c) => (c.id === id ? { ...c, messages, title } : c))
        : [{ id, title, messages, createdAt: Date.now() }, ...prev].slice(0, MAX_CONVERSATIONS)
      writeConversations(updated)
      return updated
    })
    try {
      localStorage.setItem(ACTIVE_KEY, id)
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const newChat = useCallback(() => {
    setMessages([])
    setActiveConvId(null)
    setInput('')
    try {
      localStorage.removeItem(ACTIVE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const openConversation = (conv: Conversation) => {
    setMessages(conv.messages)
    setActiveConvId(conv.id)
    setSidebarOpen(false)
    try {
      localStorage.setItem(ACTIVE_KEY, conv.id)
    } catch {
      /* ignore */
    }
  }

  const deleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id)
    setConversations(updated)
    writeConversations(updated)
    if (activeConvId === id) newChat()
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || loading) return

      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content }
      const history = [...messages, userMsg]
      setMessages(history)
      setInput('')
      setLoading(true)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'

      let reply = ''
      try {
        // Same pattern as AIInterviewPage: the route accepts the cookie or a Bearer token
        const token = getToken()
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            mode: 'rasheed',
            messages: history.map((m, i) => ({
              role: m.role,
              content: i === 0 ? `${m.content}\n\n[${COURSE_LINK_INSTRUCTION}]` : m.content,
            })),
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { content?: string; message?: string; text?: string }
        reply = data.content || data.message || data.text || ''
      } catch {
        reply = ''
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: fixContent(reply) || (isAr ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مجدداً.' : 'Sorry, something went wrong. Please try again.'),
        },
      ])
      setLoading(false)
    },
    [messages, loading, isAr],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !composingRef.current) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        position: 'relative', display: 'flex', height: 'calc(100dvh - 80px)', overflow: 'hidden',
        background: 'var(--background)', color: 'var(--foreground)', fontFamily: F,
      }}
    >
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="rasheed-sidebar"
          style={{
            width: 260, flexShrink: 0, borderInlineEnd: '1px solid var(--border)', background: 'var(--card)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => { newChat(); setSidebarOpen(false) }}
              disabled={loading}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--foreground)', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: F, fontWeight: 300, fontSize: 13,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {isAr ? 'محادثة جديدة' : 'New chat'}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: F, fontWeight: 300, fontSize: 12, color: 'var(--muted-foreground)' }}>
                {isAr ? 'لا توجد محادثات سابقة' : 'No previous conversations'}
              </div>
            ) : (
              conversations.map((conv) => {
                const active = activeConvId === conv.id
                return (
                  <div key={conv.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <button
                      onClick={() => openConversation(conv)}
                      disabled={loading}
                      style={{
                        flex: 1, minWidth: 0, padding: '9px 10px', borderRadius: 8, border: 'none',
                        textAlign: isAr ? 'right' : 'left',
                        background: active ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--foreground)',
                        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: F, fontWeight: 300, fontSize: 12,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {conv.title}
                    </button>
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      disabled={loading}
                      aria-label={isAr ? 'حذف المحادثة' : 'Delete conversation'}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
                        color: 'var(--muted-foreground)', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.6,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Chat column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={isAr ? 'المحادثات' : 'Conversations'}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'color-mix(in srgb, var(--foreground) 6%, transparent)', color: 'var(--foreground)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Avatar size={36} icon={18} />
            <div>
              <h1 style={{ margin: 0, fontFamily: F, fontWeight: 900, fontSize: 15, color: 'var(--foreground)' }}>
                {isAr ? 'رشيد — مساعد DeveWay' : 'Rasheed — DeveWay assistant'}
              </h1>
              <span style={{ fontFamily: F, fontWeight: 300, fontSize: 11, color: 'var(--muted-foreground)' }}>
                {isAr ? 'متاح الآن' : 'Online'}
              </span>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={newChat}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-foreground)',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: F, fontWeight: 300, fontSize: 12,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {isAr ? 'محادثة جديدة' : 'New chat'}
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px 8px' }}>
          <div style={{ maxWidth: 768, margin: '0 auto', width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 8px' }}>
                <Avatar size={64} icon={30} />
                <h2 style={{ margin: '16px 0 6px', fontFamily: F, fontWeight: 500, fontSize: 18, color: 'var(--foreground)' }}>
                  {isAr ? 'مرحباً، أنا رشيد' : "Hi, I'm Rasheed"}
                </h2>
                <p style={{ margin: '0 0 24px', maxWidth: 420, fontFamily: F, fontWeight: 300, fontSize: 13, lineHeight: 1.8, color: 'var(--muted-foreground)' }}>
                  {isAr
                    ? 'مساعدك الذكي في DeveWay. أساعدك في اختيار الكورس المناسب، ومسارك المهني، وشرح المفاهيم التقنية.'
                    : 'Your DeveWay assistant. I help you pick courses, plan your career path and explain technical concepts.'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560 }}>
                  {suggestions.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      style={{
                        padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card)',
                        color: 'var(--foreground)', cursor: 'pointer', fontFamily: F, fontWeight: 300, fontSize: 12,
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                      {isUser ? (
                        <div
                          style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'color-mix(in srgb, var(--foreground) 10%, transparent)', color: 'var(--foreground)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      ) : (
                        <Avatar size={32} icon={14} />
                      )}
                      <div
                        style={{
                          maxWidth: '78%', padding: '12px 16px', borderRadius: 14,
                          background: isUser ? 'var(--primary-muted)' : 'var(--card)',
                          border: isUser ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                          fontFamily: F, fontWeight: 300, fontSize: 14, lineHeight: 1.7, color: 'var(--foreground)',
                        }}
                      >
                        {isUser ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span> : <MessageBody content={msg.content} locale={locale} />}
                      </div>
                    </div>
                  )
                })}

                {loading && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Avatar size={32} icon={14} />
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map((j) => (
                        <span
                          key={j}
                          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted-foreground)', animation: `rasheedBounce 1.2s ease ${j * 0.2}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input: ChatGPT style */}
        <div style={{ padding: '12px 16px 20px', flexShrink: 0, background: 'var(--background)' }}>
          <div style={{ maxWidth: 768, margin: '0 auto', position: 'relative' }}>
            <div
              style={{
                display: 'flex', alignItems: 'flex-end', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 24, paddingBlock: 10, paddingInlineStart: 16, paddingInlineEnd: 10, gap: 8,
              }}
            >
              <textarea
                className="rasheed-input"
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
                }}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { composingRef.current = true }}
                onCompositionEnd={() => { composingRef.current = false }}
                placeholder={isAr ? 'اسأل رشيد...' : 'Ask Rasheed...'}
                rows={1}
                disabled={loading}
                style={{
                  flex: 1, width: '100%', display: 'block', border: 'none', outline: 'none', background: 'none', boxShadow: 'none',
                  WebkitAppearance: 'none', resize: 'none', overflow: 'hidden',
                  fontFamily: F, fontWeight: 300, fontSize: 15, color: 'var(--foreground)', lineHeight: 1.6,
                  minHeight: 26, maxHeight: 200, padding: 0, margin: 0,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                aria-label={isAr ? 'إرسال' : 'Send'}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: canSend ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)',
                  color: canSend ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  cursor: canSend ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', alignSelf: 'flex-end',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
            <p style={{ textAlign: 'center', fontFamily: F, fontWeight: 300, fontSize: 11, color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
              {isAr ? 'Enter للإرسال · Shift+Enter لسطر جديد' : 'Enter to send · Shift+Enter for a new line'}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rasheedBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        /* globals.css gives every textarea a filled background and a focus ring with !important;
           the chat input must stay bare inside its single container. */
        textarea.rasheed-input,
        textarea.rasheed-input:focus,
        textarea.rasheed-input:focus-visible {
          background: none !important;
          background-color: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          outline: none !important;
        }
        @media (max-width: 767px) {
          .rasheed-sidebar { position: absolute; inset-block: 0; inset-inline-start: 0; z-index: 20; }
        }
      `}</style>
    </div>
  )
}
