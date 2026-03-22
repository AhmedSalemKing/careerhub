'use client'

import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useLocale, useTranslations } from 'next-intl'
import { SOCKET_URL } from '../../lib/constants'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export type ChatMessage = {
  id: string
  sender: 'user' | 'coach'
  text: string
  createdAt: string
}

function formatArabicTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit' }).format(d)
}

export function ChatInterface({
  sessionId,
  initialMessages,
}: {
  sessionId: string
  initialMessages?: ChatMessage[]
}) {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('chat')
  const c = useTranslations('common')

  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages ?? [])
  const [text, setText] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    const token = typeof window === 'undefined' ? null : window.localStorage.getItem('careerhub_token')
    // Connect Socket.IO (if server exists). If not, keep UI usable in "disconnected" mode.
    const socket = io(String(SOCKET_URL), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: token ? { token } : undefined,
    })
    socketRef.current = socket

    const onConnect = () => {
      setConnected(true)
      // Try common room-join patterns (backend may ignore unknown events safely).
      socket.emit('join', { room: `session:${sessionId}`, sessionId })
      socket.emit('chat:join', { sessionId })
    }
    const onDisconnect = () => setConnected(false)

    const onIncoming = (payload: any) => {
      const msg: ChatMessage | null =
        payload && typeof payload === 'object'
          ? {
              id: String(payload.id ?? Date.now()),
              sender: payload.sender === 'coach' ? 'coach' : 'user',
              text: String(payload.text ?? payload.message ?? ''),
              createdAt: String(payload.createdAt ?? new Date().toISOString()),
            }
          : null
      if (msg && msg.text) setMessages((prev) => [...prev, msg])
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onIncoming)
    socket.on('chat:message', onIncoming)
    socket.on('session:message', onIncoming)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onIncoming)
      socket.off('chat:message', onIncoming)
      socket.off('session:message', onIncoming)
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId])

  const send = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const msg: ChatMessage = {
      id: `${Date.now()}`,
      sender: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    setText('')

    // Emit on multiple common event names; server can pick what it supports.
    const socket = socketRef.current
    socket?.emit('message', { sessionId, ...msg })
    socket?.emit('chat:message', { sessionId, ...msg })
    socket?.emit('session:message', { sessionId, ...msg })
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] p-4">
        <div className="text-sm font-extrabold text-foreground">{t('title')}</div>
        <div className="text-xs font-semibold text-[color:var(--muted)]">
          {connected ? t('connected') : t('disconnected')}
        </div>
      </div>

      <div className="h-[55vh] overflow-auto p-4">
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((m) => {
              const isUser = m.sender === 'user'
              return (
                <div
                  key={m.id}
                  className={isUser ? 'flex justify-end' : 'flex justify-start'}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div
                    className={
                      isUser
                        ? 'max-w-[82%] rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white'
                        : 'max-w-[82%] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-sm font-semibold text-foreground'
                    }
                  >
                    <div className="whitespace-pre-wrap leading-6">{m.text}</div>
                    <div className={isUser ? 'mt-2 text-[11px] text-white/75' : 'mt-2 text-[11px] text-[color:var(--muted)]'}>
                      {locale === 'ar' ? formatArabicTime(m.createdAt) : new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">{t('empty')}</div>
        )}
      </div>

      <div className="flex gap-2 border-t border-[color:var(--border)] p-4">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
        />
        <Button type="button" onClick={send} disabled={!text.trim()}>
          {c('confirm')}
        </Button>
      </div>
    </div>
  )
}
