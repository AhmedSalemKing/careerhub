'use client'
/**
 * PROTOTYPE hook — isolated from useAIChat.ts.
 * Uses /api/ai/tts-v2 (streaming PCM) instead of /api/ai/tts (unary WAV).
 * Web Audio API only — no browser SpeechSynthesis fallback by design.
 *
 * Playback model:
 *   AudioContext (sampleRate: 24000) → per-chunk AudioBufferSourceNode
 *   Each source is scheduled gaplessly via nextStartTime.
 *
 * Cancellation model:
 *   reqId (monotonic counter) — every async continuation checks isActive()
 *   Abort controller cancels the server-side stream
 *   stopSpeaking() stops all queued AudioBufferSourceNodes immediately
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export type StreamingTTSError =
  | 'quota_exceeded'   // 429 — caller should inform user
  | 'no_key'           // 503 — server misconfiguration
  | 'timeout'          // server timeout
  | 'network_error'    // client-side fetch failure
  | 'audio_context'    // AudioContext unavailable (e.g., before user gesture)
  | 'bad_audio'        // stream returned no PCM data
  | null

export interface UseStreamingTTSReturn {
  isSpeaking:    boolean
  lastError:     StreamingTTSError
  firstChunkMs:  number | null     // latency to first audio, last request
  totalMs:       number | null     // total stream duration, last request
  speak:         (text: string, gender?: 'female' | 'male') => void
  stopSpeaking:  () => void
  unlockAudio:   () => Promise<void>
  audioUnlocked: boolean
}

const PCM_SAMPLE_RATE = 24000

function decodeL16PCM(bytes: Uint8Array, ctx: AudioContext): AudioBuffer {
  // Int16 LE PCM → Float32 AudioBuffer
  // Handle odd-byte count (discard incomplete final sample)
  const sampleCount = Math.floor(bytes.length / 2)
  const buf  = ctx.createBuffer(1, sampleCount, PCM_SAMPLE_RATE)
  const data = buf.getChannelData(0)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let i = 0; i < sampleCount; i++) {
    data[i] = view.getInt16(i * 2, true) / 32768
  }
  return buf
}

export function useStreamingTTS(): UseStreamingTTSReturn {
  const [isSpeaking,    setIsSpeaking]    = useState(false)
  const [lastError,     setLastError]     = useState<StreamingTTSError>(null)
  const [firstChunkMs,  setFirstChunkMs]  = useState<number | null>(null)
  const [totalMs,       setTotalMs]       = useState<number | null>(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  // Monotonic request ID — every async continuation checks isActive()
  const reqIdRef = useRef(0)

  // AudioContext — created lazily on user interaction
  const audioCtxRef = useRef<AudioContext | null>(null)

  // All scheduled sources for the active request (for cancellation)
  const sourcesRef = useRef<AudioBufferSourceNode[]>([])

  // Next scheduled start time (gapless playback)
  const nextStartTimeRef = useRef<number>(0)

  // Active fetch abort controller
  const abortRef = useRef<AbortController | null>(null)

  /* ── Unmount cleanup ──────────────────────────────────────── */
  useEffect(() => {
    return () => {
      ++reqIdRef.current
      sourcesRef.current.forEach(s => { try { s.stop() } catch { /* ignore */ } })
      sourcesRef.current = []
      if (abortRef.current) { try { abortRef.current.abort() } catch { /* ignore */ } }
      if (audioCtxRef.current) { try { audioCtxRef.current.close() } catch { /* ignore */ } }
    }
  }, [])

  /* ── Create/resume AudioContext (must be in user gesture context) ── */
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!audioCtxRef.current) {
      try {
        // Request 24000 Hz to match PCM rate — avoids resampling
        // Falls back to browser default if 24000 is unsupported
        audioCtxRef.current = new AudioContext({ sampleRate: PCM_SAMPLE_RATE })
      } catch {
        try {
          audioCtxRef.current = new AudioContext()
        } catch {
          return null
        }
      }
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => { /* ignore */ })
    }
    return audioCtxRef.current
  }, [])

  /* ── Unlock AudioContext (call in user gesture handler) ──── */
  const unlockAudio = useCallback(async () => {
    if (typeof window === 'undefined') return
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try { await ctx.resume() } catch { /* ignore */ }
    }
    // Play 10ms of silence to fully unlock
    try {
      const silenceBuffer = ctx.createBuffer(1, ctx.sampleRate / 100, ctx.sampleRate)
      const src = ctx.createBufferSource()
      src.buffer = silenceBuffer
      src.connect(ctx.destination)
      src.start()
    } catch { /* ignore */ }
    setAudioUnlocked(true)
  }, [getAudioContext])

  /* ── Cancel all active playback ─────────────────────────── */
  const cancelAll = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.stop() } catch { /* ignore */ } })
    sourcesRef.current = []
    if (abortRef.current) { try { abortRef.current.abort() } catch { /* ignore */ } }
    abortRef.current = null
  }, [])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    ++reqIdRef.current
    cancelAll()
    setIsSpeaking(false)
  }, [cancelAll])

  /* ── Speak ───────────────────────────────────────────────── */
  const speak = useCallback((text: string, gender: 'female' | 'male' = 'female') => {
    if (typeof window === 'undefined') return

    // Cancel prior request
    cancelAll()
    ++reqIdRef.current
    const reqId    = reqIdRef.current
    const isActive = () => reqIdRef.current === reqId

    const ctx = getAudioContext()
    if (!ctx) {
      setLastError('audio_context')
      return
    }

    setIsSpeaking(true)
    setLastError(null)
    setFirstChunkMs(null)
    setTotalMs(null)

    const abortCtrl = new AbortController()
    abortRef.current = abortCtrl
    sourcesRef.current = []
    nextStartTimeRef.current = 0

    // Schedule a PCM buffer for gapless playback
    const scheduleBuffer = (pcmBuffer: AudioBuffer) => {
      if (!isActive()) return
      const source = ctx.createBufferSource()
      source.buffer = pcmBuffer
      source.connect(ctx.destination)

      const when = nextStartTimeRef.current === 0
        ? Math.max(ctx.currentTime + 0.03, 0)   // 30ms warmup on first chunk
        : Math.max(nextStartTimeRef.current, ctx.currentTime + 0.005)

      source.start(when)
      nextStartTimeRef.current = when + pcmBuffer.duration
      sourcesRef.current.push(source)

      // Cleanup reference after playback ends
      source.onended = () => {
        const idx = sourcesRef.current.indexOf(source)
        if (idx !== -1) sourcesRef.current.splice(idx, 1)
        // If no more sources and stream is done → clear speaking state
        if (sourcesRef.current.length === 0 && isActive()) {
          setIsSpeaking(false)
        }
      }
    }

    // Accumulator for partial byte reads (handle chunk boundaries)
    let remainder = new Uint8Array(0)

    const processBytes = (incoming: Uint8Array) => {
      if (!isActive()) return

      // Concatenate with any leftover bytes from previous read
      let bytes: Uint8Array
      if (remainder.length > 0) {
        bytes = new Uint8Array(remainder.length + incoming.length)
        bytes.set(remainder)
        bytes.set(incoming, remainder.length)
        remainder = new Uint8Array(0)
      } else {
        bytes = incoming
      }

      // Keep at least PCM_MIN_BYTES per decode to avoid scheduling overhead
      const PCM_MIN_BYTES = 1920  // 40ms @ 24kHz 16-bit mono

      // Process complete chunks
      let offset = 0
      while (offset + PCM_MIN_BYTES <= bytes.length) {
        const chunkSize = Math.min(PCM_MIN_BYTES * 4, bytes.length - offset)
        const chunk = bytes.subarray(offset, offset + chunkSize)
        try {
          const audioBuf = decodeL16PCM(chunk, ctx)
          scheduleBuffer(audioBuf)
        } catch (e) {
          console.error('[useStreamingTTS] decode error:', e)
        }
        offset += chunkSize
      }

      // Save leftover bytes (< PCM_MIN_BYTES)
      if (offset < bytes.length) {
        remainder = bytes.slice(offset)
      }
    }

    const flushRemainder = () => {
      if (remainder.length >= 2 && isActive()) {
        try {
          const audioBuf = decodeL16PCM(remainder, ctx)
          scheduleBuffer(audioBuf)
        } catch { /* ignore tiny leftover */ }
        remainder = new Uint8Array(0)
      }
    }

    const t0 = performance.now()
    let firstChunkArrived = false
    let streamDone = false

    ;(async () => {
      try {
        const res = await fetch('/api/ai/tts-v2', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text, gender }),
          signal:  abortCtrl.signal,
        })

        if (!isActive()) return

        if (!res.ok) {
          // Parse error JSON
          let errLabel: StreamingTTSError = 'network_error'
          try {
            const errBody = await res.json() as { error?: string }
            if (errBody.error === 'quota_exceeded') errLabel = 'quota_exceeded'
            else if (errBody.error === 'no_key')    errLabel = 'no_key'
            else if (errBody.error === 'timeout')   errLabel = 'timeout'
          } catch { /* ignore */ }
          if (isActive()) {
            setLastError(errLabel)
            setIsSpeaking(false)
          }
          return
        }

        const ct = res.headers.get('content-type') ?? ''
        if (!ct.startsWith('audio/l16') && !ct.startsWith('audio/L16')) {
          if (isActive()) { setLastError('bad_audio'); setIsSpeaking(false) }
          return
        }

        // Stream binary PCM
        const reader = res.body!.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (!isActive()) { reader.cancel(); break }
          if (done) { streamDone = true; break }
          if (value && value.length > 0) {
            if (!firstChunkArrived) {
              firstChunkArrived = true
              const ms = Math.round(performance.now() - t0)
              setFirstChunkMs(ms)
            }
            processBytes(value)
          }
        }

        if (isActive()) {
          flushRemainder()
          const ms = Math.round(performance.now() - t0)
          setTotalMs(ms)

          // If nothing was scheduled at all, treat as error
          if (!firstChunkArrived) {
            setLastError('bad_audio')
            setIsSpeaking(false)
          }
          // isSpeaking will be cleared by the last source's onended
        }
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string }
        if (isActive()) {
          if (e?.name !== 'AbortError') {
            console.error('[useStreamingTTS] fetch error:', e?.message)
            setLastError('network_error')
          }
          setIsSpeaking(false)
        }
      } finally {
        if (abortRef.current === abortCtrl) abortRef.current = null
        void streamDone  // suppress unused warning
      }
    })()
  }, [getAudioContext, cancelAll])

  return {
    isSpeaking, lastError, firstChunkMs, totalMs,
    speak, stopSpeaking, unlockAudio, audioUnlocked,
  }
}
