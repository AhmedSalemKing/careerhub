'use client'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

export function RealTimeClock({ locale = 'en' }: { locale?: string }) {
  const [time, setTime] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => {
      setTime(dayjs().format('hh:mm:ss A'))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '16px',
      background: 'rgba(0,0,0,0.8)', color: '#a78bfa',
      padding: '6px 14px', borderRadius: '20px',
      fontSize: '0.78rem', fontFamily: 'monospace',
      zIndex: 9999, backdropFilter: 'blur(8px)',
      border: '1px solid rgba(167,139,250,0.3)',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%',
        background: '#4ade80',
        boxShadow: '0 0 6px rgba(74,222,128,0.8)',
        display: 'inline-block', animation: 'pulse 2s infinite' }}/>
       {time}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
