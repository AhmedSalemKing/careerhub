import { NextRequest, NextResponse } from 'next/server'
import { productionCb } from './circuit-breaker'
import { classify429Body } from './gemini-utils'

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

export async function POST(req: NextRequest) {
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
    const { messages } = await req.json()

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

    console.log(`[AI Chat] req=${reqId} msgs=${validMessages.length} turns=${contents.length}`)

    const models      = ['gemini-3.8-flash', 'gemini-3.5-flash-lite']
    const budgetStart = Date.now()
    let lastError     = ''

    for (let mi = 0; mi < models.length; mi++) {
      const model   = models[mi]
      const isRetry = mi > 0

      if (cbIsOpen(model)) {
        const cbState = cb.getState(model)
        console.warn(`[AI Chat] req=${reqId} cb_open model=${model} openUntil=${new Date(cbState.openUntil).toISOString()}`)
        lastError = `${model} skipped (circuit open)`
        continue
      }

      const elapsed   = Date.now() - budgetStart
      const remaining = TOTAL_BUDGET_MS - elapsed
      if (remaining <= 500) {
        console.warn(`[AI Chat] req=${reqId} budget_exhausted elapsed=${elapsed}ms`)
        break
      }
      const attemptTimeout = isRetry
        ? Math.min(remaining - 300, FALLBACK_TIMEOUT_MS)
        : Math.min(remaining - 300, PRIMARY_TIMEOUT_MS)

      const tAttempt = Date.now()
      const baseBody  = {
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
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
            system_instruction: { parts: [{ text: DEVEWAY_SYSTEM_PROMPT }] },
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
              { role: 'model', parts: [{ text: DEVEWAY_SYSTEM_PROMPT }] },
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
