'use client'
import { useEffect, useRef } from 'react'

interface VoiceOrbProps {
  isListening: boolean
  isSpeaking: boolean
  isThinking: boolean
  size?: number
  onClick?: () => void
}

export function VoiceOrb({ isListening, isSpeaking, isThinking, size = 200, onClick }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return
    canvas.width = size * 2
    canvas.height = size * 2
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(2, 2)

    const cx = size / 2
    const cy = size / 2
    const r = size * 0.35

    function draw() {
      timeRef.current += 0.02
      const t = timeRef.current
      ctx.clearRect(0, 0, size, size)

      // Outer glow rings
      const numRings = isListening ? 3 : isSpeaking ? 4 : 2
      for (let i = numRings; i >= 1; i--) {
        const ringR = r + i * (isListening ? 18 + Math.sin(t * 2 + i) * 6 : 14)
        const alpha = (isListening ? 0.12 : 0.07) / i
        const grad = ctx.createRadialGradient(cx, cy, ringR - 4, cx, cy, ringR + 4)
        grad.addColorStop(0, `rgba(139, 92, 246, ${alpha})`)
        grad.addColorStop(0.5, `rgba(99, 102, 241, ${alpha * 1.5})`)
        grad.addColorStop(1, `rgba(59, 130, 246, 0)`)
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = grad
        ctx.lineWidth = 8
        ctx.stroke()
      }

      // Wave spikes around orb when speaking or listening
      if (isSpeaking || isListening) {
        const numWaves = 8
        for (let i = 0; i < numWaves; i++) {
          const angle = (i / numWaves) * Math.PI * 2
          const amplitude = isSpeaking
            ? 12 + Math.sin(t * 3 + i * 0.8) * 8
            : 6 + Math.sin(t * 2 + i) * 4
          const x1 = cx + Math.cos(angle) * (r + 8)
          const y1 = cy + Math.sin(angle) * (r + 8)
          const x2 = cx + Math.cos(angle) * (r + 8 + amplitude)
          const y2 = cy + Math.sin(angle) * (r + 8 + amplitude)
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.4 + Math.sin(t * 2 + i) * 0.2})`
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.stroke()
        }
      }

      // Main orb gradient
      const orbGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
      if (isListening) {
        orbGrad.addColorStop(0, '#a78bfa')
        orbGrad.addColorStop(0.4, '#7c3aed')
        orbGrad.addColorStop(0.8, '#4c1d95')
        orbGrad.addColorStop(1, '#2e1065')
      } else if (isSpeaking) {
        orbGrad.addColorStop(0, '#93c5fd')
        orbGrad.addColorStop(0.4, '#6366f1')
        orbGrad.addColorStop(0.8, '#4338ca')
        orbGrad.addColorStop(1, '#1e1b4b')
      } else if (isThinking) {
        orbGrad.addColorStop(0, '#c4b5fd')
        orbGrad.addColorStop(0.5, `hsl(${260 + Math.sin(t) * 20}, 70%, 40%)`)
        orbGrad.addColorStop(1, '#1e1b4b')
      } else {
        orbGrad.addColorStop(0, '#7c3aed')
        orbGrad.addColorStop(0.5, '#4c1d95')
        orbGrad.addColorStop(1, '#1e1b4b')
      }
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = orbGrad
      ctx.fill()

      // Inner highlight
      const hlGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 0, cx - r * 0.1, cy - r * 0.1, r * 0.6)
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.25)')
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = hlGrad
      ctx.fill()

      // Animated sound bars inside orb when speaking or listening
      if (isSpeaking || isListening) {
        const bars = 5
        const barW = r * 0.12
        const spacing = r * 0.18
        const totalW = bars * spacing
        for (let i = 0; i < bars; i++) {
          const bx = cx - totalW / 2 + i * spacing + spacing / 2
          const bh = r * 0.3 + Math.sin(t * 4 + i * 1.2) * r * 0.25
          ctx.beginPath()
          ctx.roundRect(bx - barW / 2, cy - bh / 2, barW, bh, barW / 2)
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isListening, isSpeaking, isThinking, size])

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      style={{ display: 'block', cursor: onClick ? 'pointer' : 'default' }}
    />
  )
}
