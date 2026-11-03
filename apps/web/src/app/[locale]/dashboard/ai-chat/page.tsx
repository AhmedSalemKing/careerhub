'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'

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
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*/g
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

/** Assistant text plus [COURSE_SUGGESTION]title | path[/COURSE_SUGGESTION] link chips. */
function MessageBody({ content, locale }: { content: string; locale: string }) {
  const parts = content.split(/\[COURSE_SUGGESTION\]([\s\S]*?)\[\/COURSE_SUGGESTION\]/g)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part.trim() ? <MessageContent key={i} content={part} /> : null
        const [title, rawPath] = part.split('|').map((x) => x.trim())
        const href = rawPath && rawPath.startsWith('/') && !rawPath.startsWith('//') ? rawPath : `/${locale}/courses`
        return (
          <a
            key={i}
            href={href}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, margin: '4px 0',
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

export default function AiChatPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const suggestions = isAr ? SUGGESTED_PROMPTS_AR : SUGGESTED_PROMPTS_EN

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

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
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'rasheed',
            messages: history.map((m) => ({ role: m.role, content: m.content })),
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
          content: reply || (isAr ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مجدداً.' : 'Sorry, something went wrong. Please try again.'),
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

  const hasInput = input.trim().length > 0
  const canSend = hasInput && !loading

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 80px)', overflow: 'hidden',
        background: 'var(--background)', color: 'var(--foreground)', fontFamily: F,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            onClick={() => { setMessages([]); setInput('') }}
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
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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

      {/* Input: one bordered container */}
      <div style={{ padding: '12px 20px 16px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
        <div
          style={{
            display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px', borderRadius: 16,
            border: '1.5px solid var(--border)', background: 'var(--card)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { composingRef.current = true }}
            onCompositionEnd={() => { composingRef.current = false }}
            placeholder={isAr ? 'اسأل رشيد...' : 'Ask Rasheed...'}
            disabled={loading}
            rows={1}
            style={{
              flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none', overflow: 'hidden',
              fontFamily: F, fontWeight: 300, fontSize: 14, color: 'var(--foreground)', lineHeight: 1.65,
              minHeight: 22, maxHeight: 120, paddingTop: 1,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!canSend}
            aria-label={isAr ? 'إرسال' : 'Send'}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
              background: canSend ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 8%, transparent)',
              color: canSend ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              cursor: canSend ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAr ? 'scaleX(-1)' : 'none' }}>
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p style={{ margin: '6px 0 0', textAlign: 'center', fontFamily: F, fontWeight: 300, fontSize: 11, color: 'var(--muted-foreground)' }}>
          {isAr ? 'Enter للإرسال · Shift+Enter لسطر جديد' : 'Enter to send · Shift+Enter for a new line'}
        </p>
      </div>

      <style>{`
        @keyframes rasheedBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
