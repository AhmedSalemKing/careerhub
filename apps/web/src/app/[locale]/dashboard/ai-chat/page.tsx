'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { get, post, del } from '../../../../lib/api'
import {
  Send, Plus, Trash2, User, Loader2,
  Sparkles, MessageSquare, Target, Lightbulb,
  X, Menu, GraduationCap, BrainCircuit, Code2, BarChart3,
} from 'lucide-react'
import { notify } from '../../../../lib/notify'

// ── Interfaces ────────────────────────────────────
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

// ── Markdown Renderer ─────────────────────────────
function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="font-bold text-base mt-3 mb-1 text-blue-400">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="font-bold text-lg mt-4 mb-2 text-white">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mr-2 mb-1">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
          <span
            dangerouslySetInnerHTML={{
              __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
            }}
          />
        </li>
      )
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      elements.push(
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mr-2 mb-1">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
            {num}
          </span>
          <span
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/^\d+\. /, '')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
            }}
          />
        </li>
      )
    } else if (line.trim()) {
      elements.push(
        <p
          key={i}
          className="text-sm leading-relaxed mb-1"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="text-white font-semibold">$1</strong>'
              )
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(
                /`(.*?)`/g,
                '<code class="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-blue-400">$1</code>'
              ),
          }}
        />
      )
    } else if (i > 0) {
      elements.push(<div key={i} className="h-2" />)
    }
  })

  return <div className="space-y-0.5">{elements}</div>
}

// ── Suggestion Data ───────────────────────────────
const SUGGESTIONS = [
  { icon: Target, text: 'اقترح لي مسار مهني في البرمجة', color: 'blue' },
  { icon: GraduationCap, text: 'كيف أبدأ في تعلم الذكاء الاصطناعي؟', color: 'purple' },
  { icon: Code2, text: 'ما الفرق بين Frontend و Backend؟', color: 'cyan' },
  { icon: BarChart3, text: 'أهم المهارات في سوق العمل السعودي', color: 'green' },
  { icon: BrainCircuit, text: 'كيف أحضّر لمقابلة عمل تقنية؟', color: 'amber' },
  { icon: Lightbulb, text: 'ساعدني في تحسين سيرتي الذاتية', color: 'pink' },
]

// Color classes for the suggestion cards
const colorMap: Record<string, string> = {
  blue:   'border-blue-500/20 text-blue-400 hover:border-blue-500/40',
  purple: 'border-purple-500/20 text-purple-400 hover:border-purple-500/40',
  cyan:   'border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40',
  green:  'border-green-500/20 text-green-400 hover:border-green-500/40',
  amber:  'border-amber-500/20 text-amber-400 hover:border-amber-500/40',
  pink:   'border-pink-500/20 text-pink-400 hover:border-pink-500/40',
}

// ── Main Component ────────────────────────────────
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

  // suppress unused locale warning
  void locale

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const res = await get('/ai/conversations')
      return (res?.data as any)?.data ?? []
    },
  })

  const loadConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId)
    setMessages([])
    setSidebarOpen(false)
    try {
      const res = await get(`/ai/conversations/${convId}`)
      const data = (res?.data as any)?.data
      setMessages(data?.messages ?? [])
    } catch {}
  }, [])

  const createConv = useMutation({
    mutationFn: async () => {
      const res = await post('/ai/conversations', { context: 'dashboard' })
      return (res?.data as any)?.data
    },
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['ai-conversations'] })
      setActiveConvId(conv.id)
      setMessages([])
      setSidebarOpen(false)
    },
  })

  const deleteConv = useMutation({
    mutationFn: async (id: string) => {
      await del(`/ai/conversations/${id}`)
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['ai-conversations'] })
      if (activeConvId === id) {
        setActiveConvId(null)
        setMessages([])
      }
    },
  })

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return

      let convId = activeConvId
      if (!convId) {
        const res = await post('/ai/conversations', { context: 'dashboard' })
        convId = (res?.data as any)?.data?.id
        if (!convId) return
        setActiveConvId(convId)
        qc.invalidateQueries({ queryKey: ['ai-conversations'] })
      }

      const userMsg: Message = {
        id: `tmp-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsStreaming(true)
      setStreamingContent('')

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      try {
        const token =
          localStorage.getItem('deveway_token') ||
          document.cookie.match(/deveway_token=([^;]+)/)?.[1]

        const API = process.env.NEXT_PUBLIC_API_URL || ''
        const response = await fetch(`${API}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId: convId, message: text }),
        })

        if (!response.ok) throw new Error('AI request failed')

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

          for (const line of lines) {
            const data = line.replace('data: ', '').trim()
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullContent += parsed.content
                setStreamingContent(fullContent)
              }
              if (parsed.error) throw new Error(parsed.error)
            } catch {}
          }
        }

        if (fullContent) {
          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, aiMsg])
        }
      } catch {
        notify.error('حدث خطأ في الاتصال بالذكاء الاصطناعي')
      } finally {
        setIsStreaming(false)
        setStreamingContent('')
        qc.invalidateQueries({ queryKey: ['ai-conversations'] })
      }
    },
    [activeConvId, isStreaming, qc]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden"
      dir="rtl"
      // ═══ Glossy Black Background (Exact Request) ═══
      style={{
        background: '#0D0D0D',
        backgroundImage: 
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 60%), ' +
          'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.02), transparent 60%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        color: '#E6E6E6'
      }}
    >
      {/* ── Ambient Glows (Subtle color accents) ─────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-[#5120c8] opacity-[0.03] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-blue-600 opacity-[0.02] blur-[100px]" />
      </div>

      {/* ── Top Bar (Glassy) ───────────────────────────── */}
      <div 
        className="relative z-20 flex items-center justify-between px-4 py-3 backdrop-blur-md transition-all duration-300"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,13,13,0.5)' }}
      >
        {/* Right: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#141414] border border-white/10 shadow-sm">
            <BrainCircuit className="h-5 w-5 text-[#5120c8]" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none" style={{ color: '#ffffff' }}>
              DeveWay AI
            </h1>
            <p className="mt-0.5 text-xs" style={{ color: '#9CA3AF' }}>
              مدعوم بـ Llama 3.3
            </p>
          </div>
        </div>

        {/* Center: Status */}
        <div className="hidden items-center gap-2 rounded-full border px-3 py-1 sm:flex"
             style={{ borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.08)' }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: '#34D399' }} />
          <span className="text-xs font-medium" style={{ color: '#34D399' }}>
            متصل
          </span>
        </div>

        {/* Left: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => createConv.mutate()}
            disabled={createConv.isPending}
            className="flex items-center gap-1.5 rounded-xl border bg-[#141414] px-3 py-1.5 text-xs font-semibold transition-all hover:bg-[#1F1F1F]"
            style={{ borderColor: 'rgba(81,32,200,0.3)', color: '#818CF8' }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[#141414] transition hover:bg-[#1F1F1F] hover:text-white"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────── */}
      <div className="relative flex-1 overflow-y-auto">
        {isEmpty ? (
          /* ── Welcome Screen ──────────────────────── */
          <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
            {/* Hero */}
            <div className="mb-10 text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border bg-[#141414] shadow-2xl"
                   style={{ borderColor: 'rgba(81,32,200,0.2)', boxShadow: '0 0 20px rgba(81,32,200,0.1)' }}>
                <Sparkles className="h-12 w-12 text-[#5120c8]" />
              </div>
              <h2 className="mb-3 font-bold text-4xl" style={{ color: '#ffffff' }}>
                مرحباً، كيف يمكنني مساعدتك؟
              </h2>
              <p className="max-w-lg text-base" style={{ color: '#9CA3AF' }}>
                مساعدك الذكي للتعلم والنمو المهني — اسألني عن أي شيء
              </p>
            </div>

            {/* Suggestion grid (Flat Glossy Style) */}
            <div className="mb-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  // FIX: Moved colorMap from style to className
                  className={`group flex items-start gap-3 rounded-2xl bg-[#141414] border p-4 text-right transition-all duration-200 hover:scale-[1.02] hover:bg-[#1F1F1F] hover:shadow-lg ${colorMap[s.color]}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm leading-snug transition-colors group-hover:text-white"
                        style={{ color: '#E6E6E6' }}>
                    {s.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick action chips */}
            <div className="flex max-w-2xl flex-wrap justify-center gap-2">
              {['تلخيص نص', 'شرح مفهوم', 'خطة تعلم', 'تحليل مهارات', 'نصائح مهنية'].map(
                (chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="rounded-full border bg-[#141414] px-4 py-1.5 text-xs transition hover:bg-[#1F1F1F] hover:border-[#5120c8]/30 hover:text-[#818CF8]"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
                  >
                    {chip}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          /* ── Messages ────────────────────────────── */
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-32">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border ${
                    msg.role === 'user'
                      ? 'bg-[#5120c8] border-[#5120c8] shadow-lg shadow-blue-900/20'
                      : 'border border-white/10 bg-[#141414]'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <BrainCircuit className="h-4 w-4 text-[#A78BFA]" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`relative max-w-[78%] rounded-2xl px-4 py-3 shadow-md ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-[#5120c8] text-white'
                      : 'rounded-tl-sm border border-white/10 bg-[#141414] text-[#E6E6E6]'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  ) : (
                    <MessageContent content={msg.content} />
                  )}
                </div>
              </div>
            ))}

            {/* Streaming bubble */}
            {isStreaming && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] shadow-md">
                  <BrainCircuit className="h-4 w-4 text-[#A78BFA]" />
                </div>
                <div className="relative max-w-[78%] rounded-2xl rounded-tl-sm border border-white/10 bg-[#141414] px-4 py-3 text-[#E6E6E6]">
                  {streamingContent ? (
                    <>
                      <MessageContent content={streamingContent} />
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#818CF8] align-middle" />
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-2 w-2 animate-bounce rounded-full bg-[#818CF8]/70"
                          style={{ animationDelay: `${i * 0.12}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Area (Floating) ──────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Gradient fade to blend input into background */}
        <div 
          className="pointer-events-none h-16 bg-gradient-to-t to-transparent" 
          style={{ background: 'linear-gradient(to top, #0D0D0D, transparent)' }}
        />

        <div className="px-4 pb-5 pt-2">
          <div className="mx-auto max-w-3xl">
            {/* Quick actions row */}
            {!isEmpty && (
              <div className="mb-3 flex justify-end gap-2 overflow-x-auto pb-1">
                {['تلخيص', 'شرح', 'مثال', 'خطة'].map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="shrink-0 rounded-full border bg-[#141414] px-3 py-1 text-xs transition hover:bg-[#1F1F1F] hover:border-[#5120c8]/30 hover:text-[#818CF8]"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {/* Main input */}
            <div
              className={`flex items-end gap-3 rounded-2xl border bg-[#141414] p-3 shadow-xl backdrop-blur-md transition-all duration-200 ${
                isStreaming
                  ? 'border-white/10'
                  : input.trim()
                  ? 'border-[#5120c8]/50 shadow-[#5120c8]/10'
                  : 'border-white/10 focus-within:border-white/20'
              }`}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا... (Enter للإرسال)"
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm placeholder:text-gray-600 focus:outline-none disabled:opacity-50"
                style={{ color: '#E6E6E6', maxHeight: '140px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                  input.trim() && !isStreaming
                    ? 'bg-[#5120c8] text-white shadow-lg hover:bg-[#4318a8]'
                    : 'cursor-not-allowed bg-[#1F1F1F] text-[#6B7280]'
                }`}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
              DeveWay AI · Llama 3.3 · المعلومات المهمة تحتاج تحقق مستقل
            </p>
          </div>
        </div>
      </div>

      {/* ── Conversations Sidebar Drawer ──────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r shadow-2xl"
            dir="rtl"
            style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-white">المحادثات</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-1.5 transition hover:bg-white/5"
                style={{ color: '#9CA3AF' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => createConv.mutate()}
                disabled={createConv.isPending}
                className="flex w-full items-center gap-2 rounded-xl border bg-[#0A0A0A] px-3 py-2.5 text-sm font-semibold transition hover:bg-[#1F1F1F]"
                style={{ borderColor: 'rgba(81,32,200,0.3)', color: '#818CF8' }}
              >
                <Plus className="h-4 w-4" />
                محادثة جديدة
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <div className="py-10 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  لا توجد محادثات بعد
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition ${
                      activeConvId === conv.id
                        ? 'border bg-[#1F1F1F]'
                        : 'hover:bg-[#1F1F1F]'
                    }`}
                    style={{ borderColor: activeConvId === conv.id ? 'rgba(81,32,200,0.3)' : 'transparent' }}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <MessageSquare
                      className={`h-4 w-4 shrink-0 ${
                        activeConvId === conv.id ? 'text-[#5120c8]' : 'text-[#6B7280]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm" style={{ color: '#E6E6E6' }}>{conv.title}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(conv.updatedAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConv.mutate(conv.id)
                      }}
                      className="hidden h-6 w-6 items-center justify-center rounded-lg text-red-400/70 hover:bg-red-500/15 hover:text-red-400 group-hover:flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}