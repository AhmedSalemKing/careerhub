'use client'
/**
 * PROTOTYPE TEST PAGE — dev only, not linked in any navigation.
 * Access: /ar/dashboard/tts-test or /en/dashboard/tts-test
 *
 * Tests the streaming TTS implementation (gemini-3.8-flash-lite-tts):
 *  ✓ Female voice (Aoede) Arabic
 *  ✓ Male voice (Fenrir) Arabic
 *  ✓ Stop/cancel mid-stream
 *  ✓ No overlap between requests
 *  ✓ 429 error display
 *  ✓ First-chunk latency measurement
 *  ✓ Comparison with production unary endpoint
 */

import { useState, useCallback, useRef } from 'react'
import { useStreamingTTS } from '@/components/ai/tts-v2/useStreamingTTS'

const TEST_TEXTS = {
  short: 'مرحباً! أنا ديفي واي.',
  medium: 'مرحباً! أنا ديفي واي، مساعدك الذكي في اكتشاف مسارك المهني. كيف أقدر أساعدك اليوم؟',
  long:   'بناءً على محادثتنا اليوم، أنصحك بالتخصص في تطوير الواجهات الأمامية. لديك مهارات قوية في التصميم والتحليل، وستجد في هذا المجال فرصاً ممتازة للنمو المهني. الخطوة التالية هي تعلم React أو Vue.js، وبناء مشاريع عملية تضيفها إلى ملفك المهني.',
}

// Quick probe of the OLD unary endpoint for comparison
async function probeUnaryLatency(text: string, gender: 'female' | 'male'): Promise<number | string> {
  const t0 = performance.now()
  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, gender }),
      signal: AbortSignal.timeout(30000),
    })
    if (res.status === 429) return '429 (quota)'
    if (!res.ok) return `${res.status}`
    const blob = await res.blob()
    if (blob.size < 500) return 'empty'
    return Math.round(performance.now() - t0)
  } catch {
    return 'error'
  }
}

export default function TTSTestPage() {
  const {
    isSpeaking, lastError, firstChunkMs, totalMs,
    speak, stopSpeaking, unlockAudio, audioUnlocked,
  } = useStreamingTTS()

  const [selectedText,  setSelectedText]  = useState<keyof typeof TEST_TEXTS>('medium')
  const [gender,        setGender]        = useState<'female' | 'male'>('female')
  const [log,           setLog]           = useState<string[]>([])
  const [unaryMs,       setUnaryMs]       = useState<string | null>(null)
  const [comparing,     setComparing]     = useState(false)
  const logRef = useRef<string[]>([])

  const addLog = useCallback((msg: string) => {
    logRef.current = [`${new Date().toISOString().slice(11, 23)} ${msg}`, ...logRef.current.slice(0, 49)]
    setLog([...logRef.current])
  }, [])

  const handleUnlock = useCallback(async () => {
    await unlockAudio()
    addLog('Audio context unlocked')
  }, [unlockAudio, addLog])

  const handleSpeak = useCallback(() => {
    addLog(`speak() called — text="${TEST_TEXTS[selectedText].slice(0, 30)}…" gender=${gender}`)
    speak(TEST_TEXTS[selectedText], gender)
  }, [speak, selectedText, gender, addLog])

  const handleStop = useCallback(() => {
    stopSpeaking()
    addLog('stopSpeaking() called')
  }, [stopSpeaking, addLog])

  const handleCompare = useCallback(async () => {
    if (comparing) return
    setComparing(true)
    setUnaryMs(null)
    addLog('Comparing with production unary endpoint…')
    const result = await probeUnaryLatency(TEST_TEXTS[selectedText], gender)
    const label = typeof result === 'number' ? `${result}ms (full WAV)` : String(result)
    setUnaryMs(label)
    addLog(`Unary result: ${label}`)
    setComparing(false)
  }, [comparing, selectedText, gender, addLog])

  // Log state changes
  const prevSpeaking = useRef(false)
  const prevError    = useRef<string | null>(null)
  if (prevSpeaking.current !== isSpeaking) {
    prevSpeaking.current = isSpeaking
    if (isSpeaking && firstChunkMs !== null) addLog(`▶ Speaking — first chunk: ${firstChunkMs}ms`)
    if (!isSpeaking && totalMs !== null)     addLog(`■ Done — stream total: ${totalMs}ms`)
  }
  if (prevError.current !== lastError) {
    prevError.current = lastError
    if (lastError) addLog(`⚠ Error: ${lastError}`)
  }

  const statusColor = lastError
    ? '#ef4444'
    : isSpeaking
    ? '#22c55e'
    : audioUnlocked
    ? '#8b5cf6'
    : '#6b7280'

  const statusLabel = lastError
    ? `Error: ${lastError}`
    : isSpeaking
    ? `Speaking${firstChunkMs !== null ? ` (first chunk: ${firstChunkMs}ms)` : '…'}`
    : audioUnlocked
    ? 'Ready'
    : 'Audio locked'

  return (
    <div dir="rtl" style={{ padding: 24, maxWidth: 760, margin: '0 auto', fontFamily: 'PingAR, sans-serif', color: 'var(--foreground)' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'inline-block', background: '#ef4444', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, marginBottom: 8, fontFamily: 'monospace' }}>
          PROTOTYPE — dev only — not for production
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Streaming TTS Prototype</h1>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
          Model: gemini-3.8-flash-lite-tts · SSE streaming · Web Audio API
        </p>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0,
          boxShadow: isSpeaking ? `0 0 8px ${statusColor}` : undefined,
          animation: isSpeaking ? 'pulse 1s ease infinite' : undefined,
        }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{statusLabel}</span>
        {firstChunkMs !== null && !isSpeaking && totalMs !== null && (
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginRight: 'auto' }}>
            {firstChunkMs}ms first · {totalMs}ms stream
          </span>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Unlock */}
      {!audioUnlocked && (
        <button onClick={handleUnlock} style={{
          display: 'block', width: '100%', padding: '13px', marginBottom: 16,
          borderRadius: 10, border: '2px dashed var(--primary)', background: 'transparent',
          color: 'var(--primary)', fontFamily: 'inherit', fontWeight: 500, fontSize: 14, cursor: 'pointer',
        }}>
          تفعيل الصوت (ضروري قبل التشغيل)
        </button>
      )}

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

        {/* Text selector */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 8 }}>النص</div>
          {(Object.keys(TEST_TEXTS) as (keyof typeof TEST_TEXTS)[]).map(k => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}>
              <input type="radio" name="text" checked={selectedText === k} onChange={() => setSelectedText(k)} />
              <span style={{ fontWeight: selectedText === k ? 500 : 300 }}>
                {k === 'short' ? 'قصير' : k === 'medium' ? 'متوسط' : 'طويل'}
                <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}> ({TEST_TEXTS[k].length} حرف)</span>
              </span>
            </label>
          ))}
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--background)', borderRadius: 6, fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            {TEST_TEXTS[selectedText]}
          </div>
        </div>

        {/* Gender selector + actions */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 8 }}>الصوت</div>
          {(['female', 'male'] as const).map(g => (
            <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}>
              <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} />
              <span style={{ fontWeight: gender === g ? 500 : 300 }}>
                {g === 'female' ? 'أنثى (Aoede)' : 'ذكر (Fenrir)'}
              </span>
            </label>
          ))}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={handleSpeak}
              disabled={!audioUnlocked}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: audioUnlocked ? 'var(--primary)' : 'var(--border)',
                color: audioUnlocked ? '#fff' : 'var(--muted-foreground)',
                cursor: audioUnlocked ? 'pointer' : 'default', fontFamily: 'inherit', fontWeight: 500, fontSize: 13 }}
            >
              {isSpeaking ? '▶ يتحدث' : '▶ تشغيل'}
            </button>
            <button
              onClick={handleStop}
              disabled={!isSpeaking}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: isSpeaking ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: isSpeaking ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 13 }}
            >
              ■ إيقاف
            </button>
          </div>
        </div>
      </div>

      {/* Overlap test */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 8 }}>اختبار التداخل — اضغط مرتين متتاليتين</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSpeak} disabled={!audioUnlocked}
            style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: audioUnlocked ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 13 }}>
            تشغيل ← سيلغي أي تشغيل سابق
          </button>
          <button
            onClick={() => { speak(TEST_TEXTS.short, 'female'); setTimeout(() => speak(TEST_TEXTS.medium, 'male'), 100) }}
            disabled={!audioUnlocked}
            style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: audioUnlocked ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 13 }}>
            100ms تشغيل مزدوج بعد
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6 }}>
          في الاختبار الأول: يجب أن تسمع صوتاً واحداً فقط (الطلب الثاني يلغي الأول).
          في الاختبار الثاني: يجب أن تسمع فقط الصوت الذكري (الطلب الأول ملغى بعد 100ms).
        </div>
      </div>

      {/* Latency comparison */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 10 }}>مقارنة الأداء</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--background)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>النقطة الجديدة (streaming)</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: firstChunkMs !== null ? '#22c55e' : 'var(--muted-foreground)' }}>
              {firstChunkMs !== null ? `${firstChunkMs}ms` : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>أول صوت</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--background)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>النقطة القديمة (unary WAV)</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: unaryMs ? '#f97316' : 'var(--muted-foreground)' }}>
              {unaryMs ?? '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>ملف WAV كامل</div>
          </div>
        </div>
        <button onClick={handleCompare} disabled={comparing}
          style={{ marginTop: 10, width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--foreground)', cursor: comparing ? 'default' : 'pointer',
            fontFamily: 'inherit', fontSize: 13 }}>
          {comparing ? 'جاري القياس…' : 'قياس وقت النقطة القديمة (لا يشغل صوتاً)'}
        </button>
      </div>

      {/* Event log */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 8 }}>سجل الأحداث</div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>
          {log.length === 0
            ? <span style={{ color: 'var(--muted-foreground)' }}>لا أحداث بعد…</span>
            : log.map((entry, i) => (
              <div key={i} style={{ color: entry.includes('Error') ? '#ef4444' : entry.includes('Done') ? '#22c55e' : 'var(--foreground)' }}>
                {entry}
              </div>
            ))
          }
        </div>
      </div>

      {/* Audio context info */}
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center' }}>
        Prototype · gemini-3.8-flash-lite-tts · first-chunk target: &lt;500ms · no browser TTS fallback
      </div>
    </div>
  )
}
