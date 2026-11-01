'use client'

/**
 * Sentence-level TTS pipeline — drop-in replacement for useStreamingTTS.
 *
 * Strategy: split the AI response into 1–4 sentences and fire a separate
 * /api/ai/tts-v2 request for each. Two fetches run concurrently (two-worker
 * queue), but audio is scheduled in strict original order via a chain of
 * per-segment "ready to schedule" promises. First-audio latency equals the
 * time to generate the first sentence instead of the full response.
 *
 * Cancellation model:
 *   • reqGuardRef: monotonic IDs — every async callback checks isActive().
 *   • pipeline.stopAfterIdx: set to i on error, blocks all later segments.
 *   • emergencyStopRef: called by watchdog abort-stalled to abort ALL in-flight
 *     fetches and unblock every schedule-order waiter simultaneously.
 *   • cancelAll: stops Web Audio sources and aborts all fetch controllers.
 *
 * The existing useStreamingTTS is unchanged and can be restored by reverting
 * the one-line import change in useAIChat.ts.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { getToken } from '@/lib/auth'
import { classifyTtsHttpFailure, classifyTtsFetchFailure } from './tts-error-policy'
import type { TtsFailureKind } from './tts-error-policy'
import { createRequestGuard, evaluateWatchdog, hasBrowserSynthesis, shouldClearOnWorkersDone } from './tts-playback'
import { stripNonSpokenBlocks, splitIntoSentences } from './splitSentences'

export type StreamingTTSError = TtsFailureKind | null

// Identical shape to UseStreamingTTSReturn in useStreamingTTS — structural
// compatibility means no changes are needed in consumers.
export interface UseSentencePipelineReturn {
  isSpeaking:    boolean
  lastError:     StreamingTTSError
  firstChunkMs:  number | null
  totalMs:       number | null
  speak:         (text: string, gender?: 'female' | 'male') => void
  stopSpeaking:  () => void
  unlockAudio:   () => Promise<void>
  audioUnlocked: boolean
}

const PCM_SAMPLE_RATE = 24000

// Identical algorithm to useStreamingTTS.decodeL16PCM — kept inline to avoid
// modifying the stable fallback file. Both copies are pure functions.
function decodeL16PCM(bytes: Uint8Array, ctx: AudioContext): AudioBuffer {
  const sampleCount = Math.floor(bytes.length / 2)
  const buf  = ctx.createBuffer(1, sampleCount, PCM_SAMPLE_RATE)
  const data = buf.getChannelData(0)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let i = 0; i < sampleCount; i++) {
    data[i] = view.getInt16(i * 2, true) / 32768
  }
  return buf
}

const ARABIC_FEMALE_NAME_FRAGMENTS = [
  'layla', 'female', 'mona', 'zainab', 'hala', 'salma',
  'rana', 'noura', 'nora', 'fatima', 'taraneh', 'mariam', 'sara', 'lyla',
]

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

export function useSentencePipeline(): UseSentencePipelineReturn {
  const [isSpeaking,    setIsSpeaking]    = useState(false)
  const [lastError,     setLastError]     = useState<StreamingTTSError>(null)
  const [firstChunkMs,  setFirstChunkMs]  = useState<number | null>(null)
  const [totalMs,       setTotalMs]       = useState<number | null>(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  // Monotonic request guard — every async callback checks isActive(id).
  const reqGuardRef = useRef(createRequestGuard())

  const audioCtxRef         = useRef<AudioContext | null>(null)
  const sourcesRef          = useRef<AudioBufferSourceNode[]>([])
  const nextStartTimeRef    = useRef<number>(0)

  // abortRef = segment-0 controller (keeps watchdog's abort-stalled working
  // the same way as in useStreamingTTS, before emergencyStopRef is called).
  const abortRef            = useRef<AbortController | null>(null)

  // Per-segment abort controllers for the current speak() invocation.
  const abortControllersRef = useRef<(AbortController | null)[]>([])

  // Per-invocation emergency stop — set at the start of each speak() call
  // so the watchdog can abort ALL in-flight fetches, not just segment 0.
  const emergencyStopRef    = useRef<(() => void) | null>(null)

  const synthRef          = useRef<SpeechSynthesisUtterance | null>(null)
  const synthStartedAtRef = useRef(0)
  const pendingTextRef    = useRef<string>('')

  const watchdogRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamSettledRef    = useRef(true)
  const requestStartedAtRef = useRef(0)

  // ── Watchdog ─────────────────────────────────────────────────────────────

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

      const action = evaluateWatchdog({
        synthesisActive:  synth !== null,
        synthSpeaking:    s ? s.speaking : false,
        synthPending:     s ? s.pending  : false,
        synthElapsedMs:   Date.now() - synthStartedAtRef.current,
        streamSettled:    streamSettledRef.current,
        requestElapsedMs: Date.now() - requestStartedAtRef.current,
        liveSources:      sourcesRef.current.length,
        contextState:     audioCtxRef.current ? audioCtxRef.current.state : null,
      })

      if (action === 'keep') return
      if (action === 'resume-and-keep') {
        audioCtxRef.current?.resume().catch(() => { /* ignore */ })
        return
      }
      if (action === 'abort-stalled') {
        // Abort ALL in-flight segment fetches and unblock schedule waiters.
        try { emergencyStopRef.current?.() } catch { /* ignore */ }
        streamSettledRef.current = true
      }
      synthRef.current = null
      setIsSpeaking(false)
      disarmWatchdog()
    }, 1_000)
  }, [disarmWatchdog])

  // ── Browser speechSynthesis fallback ─────────────────────────────────────
  // Used only for recoverable failures on segment 0 (before any audio played).
  // Male Arabic voice only; skips entirely when no male voice is available.

  const trySynthesisFallback = useCallback((text: string, guard?: () => boolean) => {
    if (guard && !guard()) return
    streamSettledRef.current = true
    if (typeof window === 'undefined' || !hasBrowserSynthesis(window)) {
      setIsSpeaking(false)
      disarmWatchdog()
      return
    }
    const maleVoice = findMaleArabicVoice()
    if (!maleVoice) {
      console.warn('[TTS-pipeline] browser fallback: no male Arabic voice, skipping')
      setIsSpeaking(false)
      disarmWatchdog()
      return
    }
    try {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text.slice(0, 1000))
      utter.lang  = 'ar-EG'
      utter.voice = maleVoice
      utter.rate  = 0.9
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

  // ── Unmount cleanup ───────────────────────────────────────────────────────

  useEffect(() => {
    const guardRef   = reqGuardRef
    const srcRef     = sourcesRef
    const ctrlsRef   = abortControllersRef
    const abortCtRef = abortRef
    const audioRef   = audioCtxRef
    const synRef     = synthRef
    const wRef       = watchdogRef
    return () => {
      guardRef.current.cancel()
      srcRef.current.forEach(s => { try { s.stop() } catch { /* ignore */ } })
      srcRef.current = []
      ctrlsRef.current.forEach(ctrl => { try { ctrl?.abort() } catch { /* ignore */ } })
      ctrlsRef.current = []
      if (abortCtRef.current) { try { abortCtRef.current.abort() } catch { /* ignore */ } }
      if (audioRef.current)   { try { audioRef.current.close()   } catch { /* ignore */ } }
      synRef.current = null
      if (wRef.current !== null) { clearInterval(wRef.current); wRef.current = null }
      if (typeof window !== 'undefined' && hasBrowserSynthesis(window)) {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      }
    }
  }, [])

  // ── AudioContext ──────────────────────────────────────────────────────────

  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext({ sampleRate: PCM_SAMPLE_RATE })
      } catch {
        try {
          audioCtxRef.current = new AudioContext()
        } catch {
          return null
        }
      }
      console.log(
        `[TTS-pipeline] ctx sampleRate=${audioCtxRef.current.sampleRate} pcmRate=${PCM_SAMPLE_RATE} match=${audioCtxRef.current.sampleRate === PCM_SAMPLE_RATE}`,
      )
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => { /* ignore */ })
    }
    return audioCtxRef.current
  }, [])

  const unlockAudio = useCallback(async () => {
    if (typeof window === 'undefined') return
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try { await ctx.resume() } catch { /* ignore */ }
    }
    try {
      const silenceBuffer = ctx.createBuffer(1, ctx.sampleRate / 100, ctx.sampleRate)
      const src = ctx.createBufferSource()
      src.buffer = silenceBuffer
      src.connect(ctx.destination)
      src.start()
    } catch { /* ignore */ }
    setAudioUnlocked(true)
  }, [getAudioContext])

  // ── cancelAll ─────────────────────────────────────────────────────────────

  const cancelAll = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.stop() } catch { /* ignore */ } })
    sourcesRef.current = []
    abortControllersRef.current.forEach(ctrl => { try { ctrl?.abort() } catch { /* ignore */ } })
    abortControllersRef.current = []
    abortRef.current = null
    emergencyStopRef.current = null
  }, [])

  // ── stopSpeaking ──────────────────────────────────────────────────────────

  const stopSpeaking = useCallback(() => {
    reqGuardRef.current.cancel()
    cancelAll()
    cancelSynthesis()
    disarmWatchdog()
    setIsSpeaking(false)
  }, [cancelAll, cancelSynthesis, disarmWatchdog])

  // ── speak ─────────────────────────────────────────────────────────────────

  const speak = useCallback((text: string, gender: 'female' | 'male' = 'male') => {
    if (typeof window === 'undefined') return

    // Cancel any prior request — prior isActive() calls return false after begin().
    disarmWatchdog()
    cancelAll()
    cancelSynthesis()
    const reqId    = reqGuardRef.current.begin()
    const isActive = () => reqGuardRef.current.isActive(reqId)

    pendingTextRef.current = text

    const ctx = getAudioContext()
    if (!ctx) {
      setLastError('audio_context')
      trySynthesisFallback(text, isActive)
      return
    }

    // Strip structural blocks, apply 800-char total cap, split into sentences.
    // The cap preserves the historical server-side limit when sentences are split.
    const sentences = splitIntoSentences(stripNonSpokenBlocks(text).slice(0, 800))
    if (sentences.length === 0) return

    const N = sentences.length

    setIsSpeaking(true)
    setLastError(null)
    setFirstChunkMs(null)
    setTotalMs(null)
    streamSettledRef.current    = false
    requestStartedAtRef.current = Date.now()
    armWatchdog()

    sourcesRef.current          = []
    nextStartTimeRef.current    = 0
    abortControllersRef.current = new Array<AbortController | null>(N).fill(null)

    const t0 = performance.now()
    let firstChunkArrived = false

    // ── Schedule-order chain ────────────────────────────────────────────────
    // Segment i must schedule its buffer AFTER segment i-1 has done so, to
    // maintain gapless playback order even when later segments arrive first.
    // readyToSchedulePromises[0] resolves immediately; each subsequent one
    // resolves when the previous segment calls its resolver.
    const readyToScheduleResolvers = new Array<(() => void) | null>(N + 1).fill(null)
    const readyToSchedulePromises: Promise<void>[] = Array.from({ length: N }, (_, i) => {
      if (i === 0) return Promise.resolve()
      return new Promise<void>(resolve => { readyToScheduleResolvers[i] = resolve })
    })

    // Mutable pipeline state — shared across closures in this speak() call.
    const pipeline = {
      stopAfterIdx: N,  // set to i on first failure at segment i
      nextClaimIdx: 0,  // atomic claim counter for the two-worker queue
    }

    // ── Emergency stop ──────────────────────────────────────────────────────
    // Called by watchdog abort-stalled. Aborts every in-flight fetch and
    // unblocks all schedule waiters so the worker coroutines can exit.
    emergencyStopRef.current = () => {
      pipeline.stopAfterIdx = 0
      pipeline.nextClaimIdx = N
      for (const r of readyToScheduleResolvers) r?.()
      abortControllersRef.current.forEach(ctrl => { try { ctrl?.abort() } catch { /* ignore */ } })
    }

    // ── Schedule one decoded buffer ─────────────────────────────────────────
    // Gapless: uses nextStartTimeRef shared across all segments.
    // source.onended only clears isSpeaking when BOTH all sources have ended
    // AND streamSettledRef is true (all workers done), to prevent a fast-
    // finishing segment from stopping the speaking state while later segments
    // are still being fetched or scheduled.
    const scheduleBuffer = (pcmBuffer: AudioBuffer) => {
      if (!isActive()) return
      const source = ctx.createBufferSource()
      source.buffer = pcmBuffer
      source.connect(ctx.destination)

      const when = nextStartTimeRef.current === 0
        ? Math.max(ctx.currentTime + 0.03, 0)
        : Math.max(nextStartTimeRef.current, ctx.currentTime + 0.005)

      source.start(when)
      nextStartTimeRef.current = when + pcmBuffer.duration
      sourcesRef.current.push(source)

      source.onended = () => {
        if (!isActive()) return
        const idx = sourcesRef.current.indexOf(source)
        if (idx !== -1) sourcesRef.current.splice(idx, 1)
        if (sourcesRef.current.length === 0 && streamSettledRef.current && isActive()) {
          setIsSpeaking(false)
          disarmWatchdog()
        }
      }
    }

    // ── Process one segment ─────────────────────────────────────────────────
    const processSegment = async (i: number): Promise<void> => {
      if (!isActive() || i >= pipeline.stopAfterIdx) {
        readyToScheduleResolvers[i + 1]?.()
        return
      }

      const segText = sentences[i]
      const ctrl    = new AbortController()
      abortControllersRef.current[i] = ctrl
      if (i === 0) abortRef.current = ctrl  // watchdog compat

      const allChunks: Uint8Array[] = []
      let totalPCMBytes = 0

      try {
        const ttsToken = getToken()
        const res = await fetch('/api/ai/tts-v2', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(ttsToken ? { Authorization: `Bearer ${ttsToken}` } : {}),
          },
          body:   JSON.stringify({ text: segText, gender }),
          signal: ctrl.signal,
        })

        if (!isActive() || i >= pipeline.stopAfterIdx) {
          readyToScheduleResolvers[i + 1]?.()
          return
        }

        if (!res.ok) {
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
            `[TTS-pipeline] seg=${i}/${N} http=${res.status} kind=${failure.kind}`,
          )
          if (!isActive()) { readyToScheduleResolvers[i + 1]?.(); return }
          setLastError(failure.kind)
          pipeline.stopAfterIdx = Math.min(pipeline.stopAfterIdx, i)
          if (i === 0) {
            if (failure.allowBrowserFallback) {
              trySynthesisFallback(pendingTextRef.current, isActive)
            } else {
              setIsSpeaking(false)
              streamSettledRef.current = true
              disarmWatchdog()
            }
          }
          readyToScheduleResolvers[i + 1]?.()
          return
        }

        const ct = res.headers.get('content-type') ?? ''
        if (!ct.startsWith('audio/l16') && !ct.startsWith('audio/L16')) {
          if (isActive() && i < pipeline.stopAfterIdx) {
            setLastError('bad_audio')
            pipeline.stopAfterIdx = Math.min(pipeline.stopAfterIdx, i)
            if (i === 0) trySynthesisFallback(pendingTextRef.current, isActive)
          }
          readyToScheduleResolvers[i + 1]?.()
          return
        }

        // Read binary PCM stream
        const reader = res.body!.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (!isActive() || i >= pipeline.stopAfterIdx) { reader.cancel(); break }
          if (done) break
          if (value && value.length > 0) {
            if (i === 0 && !firstChunkArrived) {
              firstChunkArrived = true
              setFirstChunkMs(Math.round(performance.now() - t0))
            }
            allChunks.push(value)
            totalPCMBytes += value.length
          }
        }

        if (!isActive() || i >= pipeline.stopAfterIdx) {
          readyToScheduleResolvers[i + 1]?.()
          return
        }

        if (totalPCMBytes < 2) {
          setLastError('bad_audio')
          pipeline.stopAfterIdx = Math.min(pipeline.stopAfterIdx, i)
          if (i === 0) trySynthesisFallback(pendingTextRef.current, isActive)
          readyToScheduleResolvers[i + 1]?.()
          return
        }

        // Concatenate chunks, decode as single AudioBuffer
        const fullPCM = new Uint8Array(totalPCMBytes)
        let off = 0
        for (const c of allChunks) { fullPCM.set(c, off); off += c.length }

        let audioBuf: AudioBuffer
        try {
          audioBuf = decodeL16PCM(fullPCM, ctx)
        } catch (e) {
          console.error(`[TTS-pipeline] seg=${i}/${N} decode error:`, e)
          setLastError('bad_audio')
          pipeline.stopAfterIdx = Math.min(pipeline.stopAfterIdx, i)
          if (i === 0) trySynthesisFallback(pendingTextRef.current, isActive)
          readyToScheduleResolvers[i + 1]?.()
          return
        }

        // Wait for our turn in playback order
        await readyToSchedulePromises[i]

        if (!isActive() || i >= pipeline.stopAfterIdx) {
          readyToScheduleResolvers[i + 1]?.()
          return
        }

        // Diagnostic log (mirrors useStreamingTTS)
        const ch = audioBuf.getChannelData(0)
        let maxAmp = 0
        for (let si = 0; si < ch.length; si++) {
          const a = Math.abs(ch[si])
          if (a > maxAmp) maxAmp = a
        }
        const srvId    = res.headers.get('x-tts-request-id') ?? ''
        const srvModel = res.headers.get('x-tts-model') ?? ''
        console.log(
          `[TTS-pipeline] seg=${i}/${N} bytes=${totalPCMBytes} dur=${audioBuf.duration.toFixed(2)}s maxAmp=${maxAmp.toFixed(3)} ctxRate=${ctx.sampleRate}${srvId ? ` srv=${srvId}` : ''} model=${srvModel}`,
        )

        scheduleBuffer(audioBuf)
        readyToScheduleResolvers[i + 1]?.()  // allow next segment to schedule

      } catch (err: unknown) {
        const e = err as { name?: string; message?: string }
        if (isActive() && i < pipeline.stopAfterIdx) {
          const failure = classifyTtsFetchFailure(e?.name)
          if (i === 0) {
            if (failure.allowBrowserFallback) {
              console.error(`[TTS-pipeline] seg=0 fetch error: ${e?.message} (kind=${failure.kind})`)
              setLastError(failure.kind)
              trySynthesisFallback(pendingTextRef.current, isActive)
            } else {
              setIsSpeaking(false)
            }
          } else {
            console.warn(`[TTS-pipeline] seg=${i}/${N} fetch error: ${e?.message} — halting pipeline`)
          }
        }
        pipeline.stopAfterIdx = Math.min(pipeline.stopAfterIdx, i)
        readyToScheduleResolvers[i + 1]?.()
      }
    }

    // ── Two-worker queue ──────────────────────────────────────────────────────
    // Workers claim segments in order; JavaScript's single-threaded event loop
    // makes the read-then-increment of nextClaimIdx effectively atomic.
    const runWorker = async (): Promise<void> => {
      while (true) {
        const i = pipeline.nextClaimIdx
        if (i >= N || i >= pipeline.stopAfterIdx) break
        pipeline.nextClaimIdx++
        await processSegment(i)
      }
    }

    // When both workers finish, mark the stream settled.
    // Check whether all audio already ended during the workers' run.
    void Promise.all([runWorker(), runWorker()]).then(() => {
      if (!isActive()) return
      streamSettledRef.current = true
      setTotalMs(Math.round(performance.now() - t0))
      if (shouldClearOnWorkersDone({ liveSources: sourcesRef.current.length, synthActive: synthRef.current !== null }) && isActive()) {
        setIsSpeaking(false)
        disarmWatchdog()
      }
    })
  }, [disarmWatchdog, armWatchdog, getAudioContext, cancelAll, cancelSynthesis, trySynthesisFallback])

  return {
    isSpeaking, lastError, firstChunkMs, totalMs,
    speak, stopSpeaking, unlockAudio, audioUnlocked,
  }
}
