'use client'
// Female voice name fragments — used to skip browser synthesis voices that are female.
// If no male Arabic voice is found, the browser fallback is skipped entirely.
const ARABIC_FEMALE_NAME_FRAGMENTS = ['layla', 'female', 'mona', 'zainab', 'hala', 'salma', 'rana', 'noura', 'nora', 'fatima', 'taraneh', 'mariam', 'sara', 'lyla']

function findMaleArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  const arabicVoices = voices.filter(v => v.lang.startsWith('ar'))
  if (arabicVoices.length === 0) return null
  return arabicVoices.find(v => {
    const lc = v.name.toLowerCase()
    return !ARABIC_FEMALE_NAME_FRAGMENTS.some(f => lc.includes(f))
  }) ?? null
}

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
import { classifyTtsHttpFailure, classifyTtsFetchFailure } from './tts-error-policy'
import type { TtsFailureKind } from './tts-error-policy'
import { createRequestGuard, evaluateWatchdog, hasBrowserSynthesis } from './tts-playback'

/**
 * Failure surface of this hook. Recoverable provider problems may be spoken by
 * browser speechSynthesis; session/request problems are surfaced instead
 * (see tts-error-policy.ts).
 */
export type StreamingTTSError = TtsFailureKind | null

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

  // Monotonic request guard — every async continuation checks isActive(id).
  // Cancelling or starting a newer request invalidates older continuations, so
  // a late response can never start audio after the user cancelled it.
  const reqGuardRef = useRef(createRequestGuard())

  // AudioContext — created lazily on user interaction
  const audioCtxRef = useRef<AudioContext | null>(null)

  // All scheduled sources for the active request (for cancellation)
  const sourcesRef = useRef<AudioBufferSourceNode[]>([])

  // Next scheduled start time (gapless playback)
  const nextStartTimeRef = useRef<number>(0)

  // Active fetch abort controller
  const abortRef = useRef<AbortController | null>(null)

  // Browser speechSynthesis fallback — active utterance for cancellation
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  // When the fallback utterance was started (watchdog grace period)
  const synthStartedAtRef = useRef(0)
  // Pending text for the fallback — set before the async fetch so fallback can use it
  const pendingTextRef = useRef<string>('')

  // Speaking-state watchdog: guarantees `isSpeaking` cannot stay stuck when the
  // browser never fires `onended` / `onend` (suspended AudioContext, background
  // tab, muted synthesis). It never cuts audio that is actually playing.
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamSettledRef = useRef(true)
  const requestStartedAtRef = useRef(0)

  const disarmWatchdog = useCallback(() => {
    if (watchdogRef.current !== null) {
      clearInterval(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  const armWatchdog = useCallback(() => {
    if (watchdogRef.current !== null) return
    watchdogRef.current = setInterval(() => {
      const synth = synthRef.current
      const s = typeof window !== 'undefined' && hasBrowserSynthesis(window)
        ? window.speechSynthesis
        : null

      // Pure decision (unit-tested in tts-playback.ts). It only returns
      // 'finish' when no source is alive, so playing audio is never cut.
      const action = evaluateWatchdog({
        synthesisActive: synth !== null,
        synthSpeaking:  s ? s.speaking : false,
        synthPending:   s ? s.pending  : false,
        synthElapsedMs: Date.now() - synthStartedAtRef.current,
        streamSettled:  streamSettledRef.current,
        requestElapsedMs: Date.now() - requestStartedAtRef.current,
        liveSources: sourcesRef.current.length,
        contextState: audioCtxRef.current ? audioCtxRef.current.state : null,
      })

      if (action === 'keep') return
      if (action === 'resume-and-keep') {
        // A suspended context is the classic "scheduled but silent" state.
        audioCtxRef.current?.resume().catch(() => { /* ignore */ })
        return
      }
      if (action === 'abort-stalled') {
        try { abortRef.current?.abort() } catch { /* ignore */ }
        streamSettledRef.current = true
      }
      // 'finish' or 'abort-stalled': the speaking flag is stale.
      synthRef.current = null
      setIsSpeaking(false)
      disarmWatchdog()
    }, 1_000)
  }, [disarmWatchdog])

  /* ── Browser speechSynthesis fallback ───────────────────── */
  // Activated only for recoverable failures (quota / timeout / 5xx / network).
  // Uses male Arabic voice only — skips entirely if no male voice is available.
  // `guard` makes sure a cancelled or superseded request never starts talking.
  const trySynthesisFallback = useCallback((text: string, guard?: () => boolean) => {
    if (guard && !guard()) return
    // From here on the HTTP stream is not the active audio source.
    streamSettledRef.current = true
    if (typeof window === 'undefined' || !hasBrowserSynthesis(window)) {
      setIsSpeaking(false)
      disarmWatchdog()
      return
    }
    const maleVoice = findMaleArabicVoice()
    if (!maleVoice) {
      // No male Arabic voice available — skip browser TTS, continue textually.
      console.warn('[TTS] browser fallback: no male Arabic voice, skipping')
      setIsSpeaking(false)
      disarmWatchdog()
      return
    }
    try {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text.slice(0, 1000))
      utter.lang = 'ar-EG'
      utter.voice = maleVoice
      utter.rate = 0.9
      synthRef.current = utter
      synthStartedAtRef.current = Date.now()
      utter.onend = () => {
        if (synthRef.current === utter) {
          synthRef.current = null
          setIsSpeaking(false)
        }
      }
      utter.onerror = () => {
        if (synthRef.current === utter) {
          synthRef.current = null
          setIsSpeaking(false)
        }
      }
      setIsSpeaking(true)
      armWatchdog()
      window.speechSynthesis.speak(utter)
    } catch {
      // speechSynthesis broken in this browser — stay silent
      synthRef.current = null
      setIsSpeaking(false)
    }
  }, [armWatchdog, disarmWatchdog])

  const cancelSynthesis = useCallback(() => {
    synthRef.current = null
    if (typeof window !== 'undefined' && hasBrowserSynthesis(window)) {
      try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    }
  }, [])

  /* ── Unmount cleanup ──────────────────────────────────────── */
  useEffect(() => {
    const guardRef   = reqGuardRef
    const srcRef     = sourcesRef
    const abortCtRef = abortRef
    const audioRef   = audioCtxRef
    const synRef     = synthRef
    return () => {
      guardRef.current.cancel()
      srcRef.current.forEach(s => { try { s.stop() } catch { /* ignore */ } })
      srcRef.current = []
      if (abortCtRef.current) { try { abortCtRef.current.abort() } catch { /* ignore */ } }
      if (audioRef.current) { try { audioRef.current.close() } catch { /* ignore */ } }
      synRef.current = null
      if (watchdogRef.current !== null) { clearInterval(watchdogRef.current); watchdogRef.current = null }
      if (typeof window !== 'undefined' && hasBrowserSynthesis(window)) {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      }
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
    // Invalidate every in-flight continuation first: a response that arrives
    // after this point must not start audio.
    reqGuardRef.current.cancel()
    cancelAll()
    cancelSynthesis()
    disarmWatchdog()
    setIsSpeaking(false)
  }, [cancelAll, cancelSynthesis, disarmWatchdog])

  /* ── Speak ───────────────────────────────────────────────── */
  const speak = useCallback((text: string, gender: 'female' | 'male' = 'male') => {
    if (typeof window === 'undefined') return

    // Cancel prior request (primary + fallback synthesis)
    disarmWatchdog()
    cancelAll()
    cancelSynthesis()
    const reqId    = reqGuardRef.current.begin()
    const isActive = () => reqGuardRef.current.isActive(reqId)

    // Store text so the fallback can access it from async continuations
    pendingTextRef.current = text

    const ctx = getAudioContext()
    if (!ctx) {
      setLastError('audio_context')
      trySynthesisFallback(text, isActive)
      return
    }

    setIsSpeaking(true)
    setLastError(null)
    setFirstChunkMs(null)
    setTotalMs(null)
    streamSettledRef.current = false
    requestStartedAtRef.current = Date.now()
    armWatchdog()

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
          disarmWatchdog()
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
          // Classify before deciding: session/request errors must not be hidden
          // behind a browser voice (see tts-error-policy.ts).
          let bodyError: string | null = null
          let bodyWasJson = true
          try {
            const errBody = await res.json() as { error?: unknown }
            bodyError = typeof errBody?.error === 'string' ? errBody.error : null
          } catch {
            bodyWasJson = false
          }
          const failure = classifyTtsHttpFailure(
            res.status,
            bodyWasJson ? bodyError : 'invalid_json',
          )
          console.error(
            `[useStreamingTTS] tts_failed http=${res.status} kind=${failure.kind} fallback=${failure.allowBrowserFallback}${bodyError ? ` body=${bodyError}` : ''}`,
          )
          if (!isActive()) return
          setLastError(failure.kind)
          if (failure.allowBrowserFallback) {
            // Recoverable: let the browser read the answer instead.
            trySynthesisFallback(pendingTextRef.current, isActive)
          } else {
            // Not recoverable: keep the text on screen, stop the speaking state.
            setIsSpeaking(false)
            streamSettledRef.current = true
            disarmWatchdog()
          }
          return
        }

        const ct    = res.headers.get('content-type') ?? ''
        const srvId = res.headers.get('x-tts-request-id') ?? ''
        const srvModel = res.headers.get('x-tts-model') ?? ''
        if (srvId) console.log(`[useStreamingTTS] server_req=${srvId} model=${srvModel}`)

        if (!ct.startsWith('audio/l16') && !ct.startsWith('audio/L16')) {
          if (isActive()) {
            setLastError('bad_audio')
            trySynthesisFallback(pendingTextRef.current, isActive)
          }
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

          // If nothing was scheduled at all, activate fallback
          if (!firstChunkArrived) {
            setLastError('bad_audio')
            trySynthesisFallback(pendingTextRef.current, isActive)
          }
          // isSpeaking will be cleared by the last source's onended
        }
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string }
        if (isActive()) {
          const failure = classifyTtsFetchFailure(e?.name)
          if (failure.allowBrowserFallback) {
            console.error(`[useStreamingTTS] fetch error: ${e?.message} (kind=${failure.kind})`)
            setLastError(failure.kind)
            // Transient failure: activate synthesis fallback
            trySynthesisFallback(pendingTextRef.current, isActive)
          } else {
            // User-initiated abort: no fallback, just stop
            setIsSpeaking(false)
          }
        }
      } finally {
        streamSettledRef.current = true
        if (abortRef.current === abortCtrl) abortRef.current = null
        void streamDone  // suppress unused warning
      }
    })()
  }, [disarmWatchdog, armWatchdog, getAudioContext, cancelAll, cancelSynthesis, trySynthesisFallback])

  return {
    isSpeaking, lastError, firstChunkMs, totalMs,
    speak, stopSpeaking, unlockAudio, audioUnlocked,
  }
}
