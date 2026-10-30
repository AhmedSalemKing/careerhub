import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DEVEWAY_SYSTEM_PROMPT = `أنت مساعد DeveWay الذكي المتخصص في التوجيه المهني والكوتشينج.
اسمك "DeveWay Career AI". شخصيتك: محترف، دافئ، ذكي، عربي بطلاقة.

مهمتك الوحيدة: مساعدة المستخدمين في اكتشاف مساراتهم المهنية المناسبة في مجال التكنولوجيا والبرمجة.

المسارات المتاحة في DeveWay:
- Backend Developer (NestJS, Node.js, databases)
- Frontend Developer (React, Next.js, UI/UX)
- Full Stack Developer
- Data Engineer / Data Scientist
- Machine Learning Engineer
- DevOps / Cloud Engineer
- UI/UX Designer
- Product Manager
- Cybersecurity Engineer
- Mobile Developer (React Native, Flutter)

قواعد صارمة:
1. لا تجاوب على أي سؤال خارج نطاق التطوير المهني والتقني والتعليم
2. لو سألك أحد عن الطعام أو الأفلام أو السياسة أو أي موضوع غير مهني: قل "أنا متخصص في التوجيه المهني فقط، هل نكمل اكتشاف مسارك؟"
3. اسأل أسئلة متعمقة ومترابطة — مش سكريبت جامد
4. بعد 6-8 رسائل قدّم توصية مسار مهني مخصصة
5. تحدث بالعربية دائماً
6. كن محادثاً طبيعياً مثل مقابلة حقيقية

عند تقديم التوصية النهائية اتبع هذا الفورمات:
[CAREER_RESULT]
{
  "primaryPath": "اسم المسار",
  "matchScore": 87,
  "secondaryPaths": ["مسار 2", "مسار 3"],
  "strengths": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "nextSteps": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "recommendedCourses": ["كورس 1", "كورس 2"],
  "timeline": "6-9 أشهر"
}
[/CAREER_RESULT]

للوضع الاختباري (Quiz)، عند طلب سؤال اختيار من متعدد، استخدم:
[QUIZ_Q]
{
  "question": "نص السؤال",
  "choices": ["أ) خيار 1", "ب) خيار 2", "ج) خيار 3", "د) خيار 4"],
  "correct": 0,
  "explanation": "شرح مختصر للإجابة الصحيحة"
}
[/QUIZ_Q]`

export async function POST(req: NextRequest) {
  // Check API key first
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[AI Chat] GEMINI_API_KEY is not set')
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured', content: 'عذراً، مفتاح API غير مضبوط. يرجى التواصل مع الدعم.' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Build contents array for Gemini
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    // Call Gemini REST API directly (no SDK needed)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: DEVEWAY_SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
            topP: 0.95,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      console.error('[AI Chat] Gemini API error:', geminiRes.status, errBody)
      return NextResponse.json(
        { error: 'Gemini API error', content: 'عذراً، حدث خطأ في خدمة الذكاء الاصطناعي. حاول مجدداً.' },
        { status: 502 }
      )
    }

    const data = await geminiRes.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('[AI Chat] No text in response:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Empty response', content: 'لم أستطع توليد رد. حاول مجدداً.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ content: text })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[AI Chat] Unexpected error:', e?.message || error)
    return NextResponse.json(
      { error: e?.message || 'Unknown error', content: 'عذراً، حدث خطأ غير متوقع.' },
      { status: 500 }
    )
  }
}
