import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const DEVEWAY_SYSTEM_PROMPT = `أنت محاور مهني ذكي من منصة DeveWay المتخصصة في التوجيه المهني التقني.
اسمك "DeveWay Career AI". شخصيتك: محترف، دافئ، فضولي، تطرح أسئلة عميقة مثل مقابلة حقيقية.

هدفك: مساعدة المستخدم على اكتشاف أنسب مسار مهني تقني بناءً على اهتماماته وخبراته وأسلوب تفكيره.

المسارات المتاحة فقط:
Backend Developer | Frontend Developer | Full Stack Developer
Data Engineer | Machine Learning Engineer | DevOps Engineer
UI/UX Designer | Product Manager | Cybersecurity Engineer | Mobile Developer

قواعد المحادثة:
1. اسأل سؤالاً واحداً فقط في كل رسالة — ركّز ولا تثقل المستخدم
2. إذا قال المستخدم "لا أعرف" أو أعطى إجابة مبهمة — اطرح خيارات ملموسة أو مثالاً عملياً
3. اربط كل سؤال بالإجابة السابقة لتعمّق الفهم
4. إذا خرج المستخدم عن موضوع التوجيه المهني التقني، اعتذر بلطف وأعده للمسار
5. تحدث بالعربية الفصحى المبسطة دائماً
6. بعد 6-8 تبادلات مترابطة، قدّم توصية مخصصة ومبررة

عند التوصية النهائية، اشرح سبب اختيارك ثم أضف الفورمات التالي مباشرةً:
[CAREER_RESULT]{"primaryPath":"...","matchScore":87,"secondaryPaths":["..."],"strengths":["...","...","..."],"nextSteps":["...","...","..."],"recommendedCourses":["..."],"timeline":"6-12 شهراً","summary":"..."}[/CAREER_RESULT]`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[AI Chat] GEMINI_API_KEY missing from env')
    return NextResponse.json(
      { error: 'API key not configured', content: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.' },
      { status: 500 }
    )
  }

  const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages', content: 'لم يتم استلام رسالة.' },
        { status: 400 }
      )
    }

    // Build valid alternating contents for Gemini (must start with 'user')
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
        contents[contents.length - 1] = { role, parts: [{ text: msg.content }] }
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

    console.log(`[AI Chat] req=${reqId} contents=${contents.length} first=${contents[0]?.role} last=${contents[contents.length - 1]?.role}`)

    // Try models in order — skip 404 (model retired), continue on 503 (try fallback)
    const models = [
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ]

    let lastError = ''

    for (const model of models) {
      try {
        console.log(`[AI Chat] req=${reqId} trying model: ${model}`)

        const baseBody = {
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
          },
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

        const ctrl  = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 25000)

        let geminiRes: Response
        try {
          geminiRes = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            signal:  ctrl.signal,
            body: JSON.stringify({
              ...baseBody,
              system_instruction: { parts: [{ text: DEVEWAY_SYSTEM_PROMPT }] },
            }),
          })
        } finally {
          clearTimeout(timer)
        }

        if (!geminiRes.ok) {
          const errText = await geminiRes.text()
          lastError = `${model} failed: ${geminiRes.status} — ${errText.slice(0, 300)}`
          console.error(`[AI Chat] ${lastError}`)

          // 429 = quota exhausted — same key, no point trying other models
          if (geminiRes.status === 429) {
            return NextResponse.json(
              { content: 'عذراً، الخدمة مشغولة الآن. حاول مجدداً بعد قليل.' },
              { status: 200 }
            )
          }

          // 404 = model retired/unavailable — skip to next
          if (geminiRes.status === 404) { continue }

          // 503 = model overloaded — try the next fallback
          if (geminiRes.status === 503) { continue }

          // Retry without system_instruction on 400 (some API versions reject it)
          if (geminiRes.status === 400 && errText.includes('system_instruction')) {
            console.log(`[AI Chat] retrying ${model} WITHOUT system_instruction`)
            const ctrl2  = new AbortController()
            const timer2 = setTimeout(() => ctrl2.abort(), 25000)
            let geminiRes2: Response
            try {
              geminiRes2 = await fetch(url, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                signal:  ctrl2.signal,
                body:    JSON.stringify(baseBody),
              })
            } finally {
              clearTimeout(timer2)
            }
            if (!geminiRes2.ok) {
              const errText2 = await geminiRes2.text()
              lastError = `${model} (no sys) failed: ${geminiRes2.status} — ${errText2.slice(0, 300)}`
              console.error(`[AI Chat] ${lastError}`)
              continue
            }
            const data2 = await geminiRes2.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
            const text2 = data2?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text2) {
              console.log(`[AI Chat] SUCCESS with ${model} (no sys). length=${text2.length}`)
              return NextResponse.json({ content: text2 })
            }
            continue
          }

          continue
        }

        const data = await geminiRes.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (text && text.trim().length > 0) {
          console.log(`[AI Chat] req=${reqId} SUCCESS model=${model} len=${text.length}`)
          return NextResponse.json({ content: text })
        }

        lastError = `${model} returned empty text`
        console.error(`[AI Chat] req=${reqId} ${lastError}`)
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string }
        lastError = e?.name === 'AbortError' ? `${model} timeout 25s` : `${model} exception: ${e?.message}`
        console.error(`[AI Chat] req=${reqId} ${lastError}`)
      }
    }

    // All models failed
    console.error(`[AI Chat] req=${reqId} ALL MODELS FAILED. Last error:`, lastError)
    return NextResponse.json(
      { content: 'عذراً، خدمة الذكاء الاصطناعي مشغولة حالياً. يرجى المحاولة بعد قليل.' },
      { status: 200 }
    )
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[AI Chat] Unexpected error:', e?.message)
    return NextResponse.json(
      { content: 'عذراً، حدث خطأ مؤقت. اكتب رسالتك مرة أخرى.' },
      { status: 200 }
    )
  }
}
