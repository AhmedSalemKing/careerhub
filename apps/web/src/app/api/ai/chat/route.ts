import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const DEVEWAY_SYSTEM_PROMPT = `أنت مساعد DeveWay الذكي المتخصص في التوجيه المهني.
اسمك "DeveWay Career AI". شخصيتك: محترف، دافئ، ذكي، عربي بطلاقة.

مهمتك: مساعدة المستخدمين في اكتشاف مساراتهم المهنية في مجال التكنولوجيا.

المسارات المتاحة:
- Backend Developer
- Frontend Developer
- Full Stack Developer
- Data Engineer
- Machine Learning Engineer
- DevOps Engineer
- UI/UX Designer
- Product Manager
- Cybersecurity Engineer
- Mobile Developer

قواعد:
1. لا تجاوب على أسئلة خارج التوجيه المهني والتقني
2. اسأل أسئلة مترابطة ومتعمقة
3. بعد 6-8 رسائل قدم توصية مسار مخصصة
4. تحدث بالعربية دائماً
5. كن طبيعياً مثل مقابلة حقيقية

عند التوصية النهائية اتبع هذا الفورمات:
[CAREER_RESULT]{"primaryPath":"...","matchScore":87,"secondaryPaths":[],"strengths":[],"nextSteps":[],"recommendedCourses":[],"timeline":"..."}[/CAREER_RESULT]`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[AI Chat] GEMINI_API_KEY missing from env')
    return NextResponse.json(
      { error: 'API key not configured', content: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.' },
      { status: 500 }
    )
  }

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

    console.log('[AI Chat] contents count:', contents.length, '| first:', contents[0]?.role, '| last:', contents[contents.length - 1]?.role)

    // Try multiple models in order — latest first
    const models = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
    ]

    let lastError = ''

    for (const model of models) {
      try {
        console.log(`[AI Chat] trying model: ${model}`)

        const baseBody = {
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
          },
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...baseBody,
            system_instruction: {
              parts: [{ text: DEVEWAY_SYSTEM_PROMPT }],
            },
          }),
        })

        if (!geminiRes.ok) {
          const errText = await geminiRes.text()
          lastError = `${model} failed: ${geminiRes.status} — ${errText.slice(0, 300)}`
          console.error(`[AI Chat] ${lastError}`)

          // 429 = quota exhausted — no point trying other models with the same key
          if (geminiRes.status === 429) {
            return NextResponse.json(
              { content: 'عذراً، الخدمة مشغولة الآن. حاول مجدداً بعد لحظة.' },
              { status: 200 }
            )
          }

          // 503 = overloaded — return friendly message immediately
          if (geminiRes.status === 503) {
            return NextResponse.json(
              { content: 'الخدمة تواجه ضغطاً الآن. حاول مجدداً.' },
              { status: 200 }
            )
          }

          // Retry without system_instruction on 400 (some API versions reject it)
          if (geminiRes.status === 400 && errText.includes('system_instruction')) {
            console.log(`[AI Chat] retrying ${model} WITHOUT system_instruction`)
            const geminiRes2 = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(baseBody),
            })
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
          console.log(`[AI Chat] SUCCESS with ${model}. length=${text.length}`)
          return NextResponse.json({ content: text })
        }

        lastError = `${model} returned empty text`
        console.error(`[AI Chat] ${lastError}`)
      } catch (err: unknown) {
        const e = err as { message?: string }
        lastError = `${model} exception: ${e?.message}`
        console.error(`[AI Chat] ${lastError}`)
      }
    }

    // All models failed
    console.error('[AI Chat] ALL MODELS FAILED. Last error:', lastError)
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
