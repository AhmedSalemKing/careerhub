import { NextRequest, NextResponse } from 'next/server'
import { productionCb } from './circuit-breaker'
import { classify429Body } from './gemini-utils'
import { verifyRequest } from '../_auth'
import { RASHEED_SYSTEM_PROMPT } from './rasheed-prompt'

export const runtime = 'nodejs'
export const maxDuration = 30

const DEVEWAY_SYSTEM_PROMPT = `أنت محاور مهني ذكي من منصة DeveWay المتخصصة في التوجيه المهني التقني.
اسمك "DeveWay Career AI". بتتكلم بالعامية المصرية المبسطة — دافئ، فضولي، زي مقابلة حقيقية.

هدفك: تساعد المستخدم يكتشف أنسب مسار مهني تقني بناءً على اهتماماته وخبرته وطريقة تفكيره.

المسارات المتاحة فقط:
Backend Developer | Frontend Developer | Full Stack Developer
Data Engineer | Machine Learning Engineer | DevOps Engineer
UI/UX Designer | Product Manager | Cybersecurity Engineer | Mobile Developer

تصنيف النوايا (مهم جداً):
- لو المستخدم قال حاجة زي "إنت سامعني؟" أو "إيه رأيك؟" أو "هل فاهم؟" أو "تمام؟" — ده سؤال عن التواصل مش إجابة مهنية. رد بشكل طبيعي قصير زي "أيوه سامعك، كمّل!" أو "أيوه معاك، قلي أكتر" وبعدين رجّع سؤالك.
- لو المستخدم طلب وقفة أو قال "استنى" أو "لحظة" — رد بـ"خد وقتك!" وانتظر.
- لو المستخدم طلب توضيح زي "ممكن تشرح تاني؟" أو "مش فاهم" — اشرح بمثال عملي بسيط.
- لو المستخدم قال "مش عارف" أو "مش متأكد" — لا تتجاوز! اسأل سؤال أبسط أو قدّم خيارات ملموسة.
- لو الإجابة خارج التوجيه المهني التقني — اعتذر بلطف وارجع للموضوع.

قواعد المحادثة:
1. سؤال واحد بس في كل رسالة — ركّز ومتثقّلش
2. اربط كل سؤال بالإجابة اللي قبلها عشان تعمّق الفهم
3. لا تفترض معلومات مش اتقالتلك — اسأل لو محتاج
4. لو المستخدم بيكتب بالإنجليزي أو مزيط — رد بنفس اللغة اللي بيستخدمها
5. المصطلحات التقنية تتقال بالإنجليزي (Frontend، Backend، API...) حتى في الردود العربية
6. قدّم التوصية لما تكون جمعت معلومات كافية (عادةً 6-10 تبادلات) مش بعد عدد ثابت

عند التوصية النهائية، اشرح سبب اختيارك بالعامية ثم أضف الفورمات ده مباشرةً:
[CAREER_RESULT]{"primaryPath":"...","matchScore":87,"secondaryPaths":["..."],"strengths":["...","...","..."],"nextSteps":["...","...","..."],"recommendedCourses":["..."],"timeline":"6-12 شهراً","summary":"..."}[/CAREER_RESULT]`

// ── Timeouts ────────────────────────────────────────────────────────────────
// Each deadline covers fetch() AND response-body consumption for that attempt.
// The abort signal passed to fetch() propagates to the response body stream,
// so text()/json() will throw AbortError if the deadline fires during body read.
//
// Primary fails fast (7s) so the fallback can start promptly.
// Fallback timeout is capped separately but the shared TOTAL_BUDGET_MS is the
// hard ceiling — prevents a 7s primary + 18s fallback = 25s combined wait.
const PRIMARY_TIMEOUT_MS  = 7_000
const FALLBACK_TIMEOUT_MS = 14_000
const TOTAL_BUDGET_MS     = 24_000  // shared across all attempts; maxDuration = 30s

const cb = productionCb
const cbIsOpen         = (m: string)                    => cb.isOpen(m)
const cbRecordSuccess  = (m: string)                    => cb.recordSuccess(m)
const cbRecordFailure  = (m: string, q: boolean)        => cb.recordFailure(m, q)

// ── Streaming (SSE) ─────────────────────────────────────────────────────────
// Opt-in: only used when the request sends `Accept: text/event-stream` or
// `stream: true`. Other callers (assessment, interview) keep the JSON response.
//
// Wire format, one event per Gemini chunk:  data: {"text":"..."}\n\n
// Terminated by `data: [DONE]` on success or `data: [ERROR]` on failure.
//
// Fallback to the next model only happens before the first byte arrives: once
// text has been sent to the client it cannot be taken back.
const STREAM_TOTAL_MS = 26_000  // whole stream incl. body; maxDuration = 30s

type GeminiContent = { role: string; parts: { text: string }[] }

function streamChat(opts: {
  apiKey: string
  models: string[]
  contents: GeminiContent[]
  systemPrompt: string
  reqId: string
  tStart: number
}): Response {
  const { apiKey, models, contents, systemPrompt, reqId, tStart } = opts
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const ctrl    = new AbortController()   // client cancel or overall deadline
  let closed    = false

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: string) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(`data: ${payload}\n\n`)) } catch { closed = true }
      }
      const close = () => {
        if (closed) return
        closed = true
        try { controller.close() } catch { /* already closed */ }
      }
      const overall = setTimeout(() => ctrl.abort(), STREAM_TOTAL_MS)
      let activeModel = ''
      let sent = 0

      try {
        let upstream: Response | null = null
        let lastError = ''

        for (let mi = 0; mi < models.length; mi++) {
          const model = models[mi]
          if (cbIsOpen(model)) { lastError = `${model} skipped (circuit open)`; continue }

          // Deadline for response HEADERS only; cleared once the stream starts.
          const attempt  = new AbortController()
          const onAbort  = () => attempt.abort()
          ctrl.signal.addEventListener('abort', onAbort, { once: true })
          const hdrTimer = setTimeout(() => attempt.abort(), mi === 0 ? PRIMARY_TIMEOUT_MS : FALLBACK_TIMEOUT_MS)

          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
              {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                signal:  attempt.signal,
                body:    JSON.stringify({
                  contents,
                  system_instruction: { parts: [{ text: systemPrompt }] },
                  generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 800,
                  },
                }),
              },
            )
            clearTimeout(hdrTimer)

            if (!res.ok) {
              const errText = await res.text()
              lastError = `${model} http=${res.status}`
              console.error(`[AI Chat] req=${reqId} stream ${lastError} body=${errText.slice(0, 120)}`)
              // Quota / auth errors affect the shared key — the fallback model would fail too.
              if ((res.status === 429 && classify429Body(errText) === 'account_quota') || res.status === 401 || res.status === 403) {
                cbRecordFailure(model, false)
                break
              }
              cbRecordFailure(model, true)
              continue
            }
            if (!res.body) { lastError = `${model} no body`; cbRecordFailure(model, true); continue }
            upstream    = res
            activeModel = model
            break
          } catch (err: unknown) {
            clearTimeout(hdrTimer)
            const e = err as { name?: string; message?: string }
            lastError = e?.name === 'AbortError' ? `${model} header timeout` : `${model} exception: ${e?.message}`
            console.error(`[AI Chat] req=${reqId} stream ${lastError}`)
            cbRecordFailure(model, e?.name === 'AbortError')
          }
        }

        if (!upstream || !upstream.body) {
          console.error(`[AI Chat] req=${reqId} STREAM_ALL_MODELS_FAILED last=${lastError} totalMs=${Date.now() - tStart}`)
          send('[ERROR]')
          return
        }

        const handleLine = (line: string) => {
          if (!line.startsWith('data:')) return
          const json = line.slice(5).trim()
          if (!json) return
          try {
            const data  = JSON.parse(json) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] }
            const parts = data?.candidates?.[0]?.content?.parts
            const text  = Array.isArray(parts) ? parts.filter(p => !p.thought).map(p => p.text ?? '').join('') : ''
            if (text) { sent += text.length; send(JSON.stringify({ text })) }
          } catch { /* partial or non-JSON line — ignore */ }
        }

        // Network chunks can split an SSE line in half, so buffer until a newline.
        const reader = upstream.body.getReader()
        let buf = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          let nl: number
          while ((nl = buf.indexOf('\n')) >= 0) {
            handleLine(buf.slice(0, nl).replace(/\r$/, ''))
            buf = buf.slice(nl + 1)
          }
        }
        if (buf) handleLine(buf.replace(/\r$/, ''))

        if (sent === 0) {
          console.error(`[AI Chat] req=${reqId} stream ${activeModel} empty response`)
          cbRecordFailure(activeModel, true)
          send('[ERROR]')
        } else {
          cbRecordSuccess(activeModel)
          console.log(`[AI Chat] req=${reqId} STREAM_SUCCESS model=${activeModel} len=${sent} totalMs=${Date.now() - tStart}`)
          send('[DONE]')
        }
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string }
        console.error(`[AI Chat] req=${reqId} stream error model=${activeModel} ${e?.name === 'AbortError' ? 'aborted' : e?.message}`)
        if (activeModel && !closed) cbRecordFailure(activeModel, e?.name === 'AbortError')
        send('[ERROR]')
      } finally {
        clearTimeout(overall)
        close()
      }
    },
    cancel() {
      // Client navigated away / aborted: stop the upstream request too.
      closed = true
      ctrl.abort()
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type':      'text/event-stream; charset=utf-8',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function POST(req: NextRequest) {
  // ── Authentication ────────────────────────────────────────────────────────────
  const authUser = await verifyRequest(req)
  if (!authUser) {
    return NextResponse.json(
      { error: 'Unauthorized', content: 'يرجى تسجيل الدخول لاستخدام هذه الخدمة.' },
      { status: 401 }
    )
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[AI Chat] GEMINI_API_KEY missing from env')
    return NextResponse.json(
      { error: 'API key not configured', content: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.' },
      { status: 500 }
    )
  }

  const reqId  = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const tStart = Date.now()

  try {
    // userName is derived server-side from the verified JWT — never trusted from client body.
    // memoryContext may still come from the client: an authenticated user passing their own
    // memory context only affects their own session; prompt injection risk is low and bounded.
    const { messages, memoryContext, mode, stream } = await req.json() as { messages: unknown; memoryContext?: string; mode?: string; stream?: boolean }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages', content: 'لم يتم استلام رسالة.' },
        { status: 400 }
      )
    }

    const validMessages = (messages as { role: string; content: string }[]).filter(
      (m) => m.content && typeof m.content === 'string' && m.content.trim().length > 0
    )

    if (validMessages.length === 0) {
      return NextResponse.json(
        { error: 'Empty messages', content: 'لم يتم استلام رسالة صالحة.' },
        { status: 400 }
      )
    }

    const contents: { role: string; parts: { text: string }[] }[] = []
    let lastRole = ''
    for (const msg of validMessages) {
      const role = msg.role === 'assistant' ? 'model' : 'user'
      if (role === lastRole) {
        const prev = contents[contents.length - 1]
        prev.parts = [{ text: prev.parts.map(p => p.text).join('\n') + '\n' + msg.content }]
      } else {
        contents.push({ role, parts: [{ text: msg.content }] })
        lastRole = role
      }
    }

    if (contents.length > 0 && contents[0].role === 'model') {
      contents.unshift({ role: 'user', parts: [{ text: 'مرحبا' }] })
    }
    if (contents[contents.length - 1].role === 'model') {
      contents.push({ role: 'user', parts: [{ text: 'أكمل' }] })
    }

    // Use server-verified first name; ignore any userName supplied in the request body.
    const safeUserName = authUser.firstName && authUser.firstName.trim().length > 0
      ? authUser.firstName.trim().slice(0, 50)
      : null
    const safeMemory = typeof memoryContext === 'string' && memoryContext.trim().length > 0
      ? memoryContext.trim().slice(0, 500)
      : null
    let systemPrompt = mode === 'rasheed' ? RASHEED_SYSTEM_PROMPT : DEVEWAY_SYSTEM_PROMPT
    if (safeUserName) systemPrompt += `\n\nاسم المستخدم: ${safeUserName}. خاطبه باسمه بشكل طبيعي في المحادثة.`
    // Memory is sandboxed in a labeled data block — the block markers prevent client-
    // supplied text from being mistaken for system instructions by the model.
    if (safeMemory)   systemPrompt += `\n\n[بيانات جلسات سابقة — للاستشارة فقط]\n${safeMemory}\n[/بيانات جلسات سابقة]`

    console.log(`[AI Chat] req=${reqId} uid=${authUser.id} msgs=${validMessages.length} turns=${contents.length}${safeUserName ? ` user=${safeUserName}` : ''}`)

    const models      = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']

    // Streaming is opt-in; every other caller keeps the JSON response below.
    const wantsStream = (req.headers.get('accept') ?? '').includes('text/event-stream') || stream === true
    if (wantsStream) {
      return streamChat({ apiKey, models, contents, systemPrompt, reqId, tStart })
    }

    const budgetStart = Date.now()
    let lastError     = ''

    for (let mi = 0; mi < models.length; mi++) {
      const model   = models[mi]
      const isRetry = mi > 0

      // Check the shared budget BEFORE claiming a half-open probe slot, so an
      // exhausted budget can never strand the circuit breaker in probing state.
      const elapsed   = Date.now() - budgetStart
      const remaining = TOTAL_BUDGET_MS - elapsed
      if (remaining <= 500) {
        console.warn(`[AI Chat] req=${reqId} budget_exhausted elapsed=${elapsed}ms`)
        break
      }

      if (cbIsOpen(model)) {
        const cbState = cb.getState(model)
        console.warn(`[AI Chat] req=${reqId} cb_open model=${model} openUntil=${new Date(cbState.openUntil).toISOString()}`)
        lastError = `${model} skipped (circuit open)`
        continue
      }

      const attemptTimeout = Math.max(
        250,
        isRetry
          ? Math.min(remaining - 300, FALLBACK_TIMEOUT_MS)
          : Math.min(remaining - 300, PRIMARY_TIMEOUT_MS)
      )

      const tAttempt = Date.now()
      const generationConfig = {
        temperature: 0.8,
        maxOutputTokens: 800,
      }
      const baseBody = {
        contents,
        generationConfig,
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      console.log(`[AI Chat] req=${reqId} model=${model} timeout=${attemptTimeout}ms${isRetry ? ' (fallback)' : ''}`)

      // The abort controller deadline covers fetch() AND body consumption.
      // ctrl.signal is passed to fetch(); the response body stream inherits it,
      // so text()/json() will throw AbortError if the deadline fires mid-read.
      const ctrl  = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), attemptTimeout)

      try {
        const geminiRes = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          signal:  ctrl.signal,
          body:    JSON.stringify({
            ...baseBody,
            system_instruction: { parts: [{ text: systemPrompt }] },
          }),
        })

        const attemptMs = Date.now() - tAttempt

        if (!geminiRes.ok) {
          // Body read is still under ctrl.signal — times out if the deadline fires.
          const errText = await geminiRes.text()
          lastError = `${model} http=${geminiRes.status} ms=${attemptMs}`
          console.error(`[AI Chat] req=${reqId} ${lastError} body=${errText.slice(0, 120)}`)

          if (geminiRes.status === 429) {
            const quotaType = classify429Body(errText)
            if (quotaType === 'account_quota') {
              // Daily / free-tier quota — fallback model will also fail with the same key.
              cbRecordFailure(model, false)
              return NextResponse.json(
                { content: 'عذراً، خدمة الذكاء الاصطناعي مشغولة حالياً. يرجى المحاولة بعد قليل.', isError: true },
                { status: 200 }
              )
            }
            // model_rate_limit or unknown → try fallback (unknown: conservative, preserves fallback benefit)
            cbRecordFailure(model, true)
            continue
          }
          if (geminiRes.status === 401 || geminiRes.status === 403) {
            // Auth error — same key on fallback; no point retrying.
            // Does NOT count as a qualifying circuit-breaker failure (key issue, not model issue).
            cbRecordFailure(model, false)
            return NextResponse.json(
              { content: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.', isError: true },
              { status: 200 }
            )
          }
          if (geminiRes.status === 404) { cbRecordFailure(model, true); continue }
          if (geminiRes.status === 503) { cbRecordFailure(model, true); continue }

          // On 400 with system_instruction rejection: retry without it via synthetic exchange.
          if (geminiRes.status === 400 && errText.includes('system_instruction')) {
            console.log(`[AI Chat] req=${reqId} retrying ${model} without system_instruction (synthetic exchange)`)
            const syntheticPrefix = [
              { role: 'user',  parts: [{ text: 'أنت من؟ وما دورك؟' }] },
              { role: 'model', parts: [{ text: systemPrompt }] },
            ]
            const contentsWithPrefix = [...syntheticPrefix, ...contents]

            const rem2    = TOTAL_BUDGET_MS - (Date.now() - budgetStart)
            const ctrl2   = new AbortController()
            const timer2  = setTimeout(() => ctrl2.abort(), Math.min(rem2 - 300, FALLBACK_TIMEOUT_MS))
            try {
              const geminiRes2 = await fetch(url, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                signal:  ctrl2.signal,
                body:    JSON.stringify({ ...baseBody, contents: contentsWithPrefix }),
              })
              if (!geminiRes2.ok) {
                const errText2 = await geminiRes2.text()
                lastError = `${model}(nosys) http=${geminiRes2.status}`
                console.error(`[AI Chat] req=${reqId} ${lastError} — ${errText2.slice(0, 200)}`)
                cbRecordFailure(model, true)
                continue
              }
              const data2 = await geminiRes2.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
              const text2 = data2?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text2) {
                cbRecordSuccess(model)
                console.log(`[AI Chat] req=${reqId} SUCCESS model=${model}(nosys) len=${text2.length} totalMs=${Date.now()-tStart}`)
                return NextResponse.json({ content: text2 })
              }
              cbRecordFailure(model, true)
              continue
            } finally {
              clearTimeout(timer2)
            }
          }

          cbRecordFailure(model, true)
          continue
        }

        // Body read is still under ctrl.signal.
        const data = await geminiRes.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (text && text.trim().length > 0) {
          cbRecordSuccess(model)
          console.log(`[AI Chat] req=${reqId} SUCCESS model=${model} attemptMs=${attemptMs} totalMs=${Date.now()-tStart} turns=${contents.length}${isRetry ? ' (fallback)' : ''}`)
          return NextResponse.json({ content: text })
        }

        lastError = `${model} empty response`
        console.error(`[AI Chat] req=${reqId} ${lastError}`)
        cbRecordFailure(model, true)

      } catch (err: unknown) {
        const e       = err as { name?: string; message?: string }
        const isAbort = e?.name === 'AbortError'
        lastError     = isAbort ? `${model} timeout ${attemptTimeout}ms` : `${model} exception: ${e?.message}`
        console.error(`[AI Chat] req=${reqId} ${lastError}`)
        cbRecordFailure(model, isAbort)
      } finally {
        // Clear AFTER all body reads complete (or after an exception/abort).
        clearTimeout(timer)
      }
    }

    console.error(`[AI Chat] req=${reqId} ALL_MODELS_FAILED last=${lastError} totalMs=${Date.now()-tStart}`)
    return NextResponse.json(
      { content: 'عذراً، خدمة الذكاء الاصطناعي مشغولة حالياً. يرجى المحاولة بعد قليل.', isError: true },
      { status: 200 }
    )
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[AI Chat] Unexpected error:', e?.message)
    return NextResponse.json(
      { content: 'عذراً، حدث خطأ مؤقت. اكتب رسالتك مرة أخرى.', isError: true },
      { status: 200 }
    )
  }
}
