'use client'
import { useEffect, useRef } from 'react'

interface VoiceOrbProps {
  isListening: boolean
  isSpeaking: boolean
  isThinking: boolean
  onClick?: () => void
  size?: number
}

export function VoiceOrb({ isListening, isSpeaking, isThinking, onClick, size = 220 }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number | undefined>(undefined)
  const tRef      = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    const dpr = 2
    canvas.width  = size * dpr
    canvas.height = size * dpr
    canvas.style.width  = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r  = size * 0.32

    function draw() {
      tRef.current += 0.022
      const t = tRef.current
      ctx.clearRect(0, 0, size, size)

      // Outer glow rings
      const rings = isListening ? 4 : isSpeaking ? 3 : isThinking ? 2 : 1
      for (let i = rings; i >= 1; i--) {
        const pulse = Math.sin(t * 1.8 + i * 0.7) * (isListening ? 8 : 4)
        const rr    = r + i * 20 + pulse
        const alpha = (isListening ? 0.13 : 0.06) / i
        const g     = ctx.createRadialGradient(cx, cy, rr - 6, cx, cy, rr + 6)
        g.addColorStop(0, `rgba(139,92,246,${alpha * 2})`)
        g.addColorStop(0.5, `rgba(99,102,241,${alpha})`)
        g.addColorStop(1, `rgba(59,130,246,0)`)
        ctx.beginPath()
        ctx.arc(cx, cy, rr, 0, Math.PI * 2)
        ctx.strokeStyle = g
        ctx.lineWidth   = 10
        ctx.stroke()
      }

      // Wave lines (listening/speaking)
      if (isListening || isSpeaking) {
        const n = 12
        for (let i = 0; i < n; i++) {
          const angle = (i / n) * Math.PI * 2
          const amp   = (isSpeaking ? 14 : 8) + Math.sin(t * 3.5 + i * 0.9) * 7
          const x1    = cx + Math.cos(angle) * (r + 6)
          const y1    = cy + Math.sin(angle) * (r + 6)
          const x2    = cx + Math.cos(angle) * (r + 6 + amp)
          const y2    = cy + Math.sin(angle) * (r + 6 + amp)
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = `rgba(167,139,250,${0.35 + Math.sin(t * 2.5 + i) * 0.2})`
          ctx.lineWidth   = 2.5
          ctx.lineCap     = 'round'
          ctx.stroke()
        }
      }

      // Main orb
      const og = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx, cy, r)
      if (isListening) {
        og.addColorStop(0, '#c4b5fd')
        og.addColorStop(0.35, '#7c3aed')
        og.addColorStop(0.75, '#4c1d95')
        og.addColorStop(1, '#1e1b4b')
      } else if (isSpeaking) {
        og.addColorStop(0, '#93c5fd')
        og.addColorStop(0.35, '#4f46e5')
        og.addColorStop(0.75, '#3730a3')
        og.addColorStop(1, '#1e1b4b')
      } else if (isThinking) {
        const hue = 260 + Math.sin(t * 0.8) * 25
        og.addColorStop(0, '#c4b5fd')
        og.addColorStop(0.5, `hsl(${hue},70%,38%)`)
        og.addColorStop(1, '#1e1b4b')
      } else {
        og.addColorStop(0, '#8b5cf6')
        og.addColorStop(0.5, '#5b21b6')
        og.addColorStop(1, '#1e1b4b')
      }
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = og
      ctx.fill()

      // Highlight
      const hg = ctx.createRadialGradient(cx - r * 0.22, cy - r * 0.28, 0, cx, cy, r * 0.7)
      hg.addColorStop(0, 'rgba(255,255,255,0.28)')
      hg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = hg
      ctx.fill()

      // Sound bars inside orb
      if (isSpeaking || isListening) {
        const bars    = 5
        const bw      = r * 0.11
        const spacing = r * 0.17
        const totalW  = (bars - 1) * spacing
        for (let i = 0; i < bars; i++) {
          const bx = cx - totalW / 2 + i * spacing
          const bh = r * 0.28 + Math.sin(t * 4.5 + i * 1.3) * r * 0.22
          ctx.beginPath()
          ctx.roundRect(bx - bw / 2, cy - bh / 2, bw, bh, bw / 2)
          ctx.fillStyle = 'rgba(255,255,255,0.88)'
          ctx.fill()
        }
      }

      // Thinking dots
      if (isThinking && !isSpeaking) {
        for (let i = 0; i < 3; i++) {
          const bx = cx - 14 + i * 14
          const by = cy + Math.sin(t * 3 + i * 1.1) * 5
          ctx.beginPath()
          ctx.arc(bx, by, 4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(t * 3 + i) * 0.3})`
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { if (animRef.current !== undefined) cancelAnimationFrame(animRef.current) }
  }, [isListening, isSpeaking, isThinking, size])

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      style={{ display: 'block', cursor: onClick ? 'pointer' : 'default', borderRadius: '50%' }}
    />
  )
}
