'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('deveway_token')
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    const socket = io(String(SOCKET_URL), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: token ? { token } : undefined,
    })
    socketRef.current = socket

    const onConnect = () => {
      setConnected(true)
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
  }, [sessionId, token])

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

    const socket = socketRef.current
    socket?.emit('message', { sessionId, ...msg })
    socket?.emit('chat:message', { sessionId, ...msg })
    socket?.emit('session:message', { sessionId, ...msg })
  }

  return (
    <div 
      className="rounded-2xl shadow-lg"
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between gap-3 p-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-sm font-extrabold" style={{ color: '#ffffff' }}>
          {t('title')}
        </div>
        <div className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
          {connected ? (
            <span style={{ color: '#34D399' }}>{t('connected')}</span>
          ) : (
            <span style={{ color: '#F87171' }}>{t('disconnected')}</span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-[55vh] overflow-auto p-4" style={{ background: 'transparent' }}>
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
                    className="max-w-[82%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm"
                    style={{
                      background: isUser ? '#5120c8' : '#0A0A0A', // Coach message is darker than container
                      border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      color: isUser ? '#ffffff' : '#E6E6E6',
                    }}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    <div 
                      className="mt-2 text-[11px]"
                      style={{ color: isUser ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}
                    >
                      {locale === 'ar' ? formatArabicTime(m.createdAt) : new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="text-sm text-center" style={{ color: '#9CA3AF' }}>{t('empty')}</div>
        )}
      </div>

      {/* Input Area */}
      <div 
        className="flex gap-2 p-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
          // Override Input style for Glossy Theme if necessary, 
          // assuming Input component supports className/style or relies on global theme
          style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#E6E6E6' }}
        />
        <Button 
          type="button" 
          onClick={send} 
          disabled={!text.trim()}
          style={{ background: '#5120c8' }} // Ensure button color
        >
          {c('confirm')}
        </Button>
      </div>
    </div>
  )
}