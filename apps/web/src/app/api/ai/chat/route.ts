import { NextRequest, NextResponse } from 'next/server'

const DEVEWAY_SYSTEM = `أنت "DeveWay Career AI" — مساعد التوجيه المهني الذكي لمنصة DeveWay.
شخصيتك: خبير مهني دافئ، محترف، ذكي، يتحدث بالعربية العامية المصرية بشكل طبيعي.
أنت لست روبوت — أنت مثل صديق خبير يجري مقابلة حقيقية.

هدفك الوحيد: مساعدة المستخدمين في اكتشاف مساراتهم المهنية التقنية.

المسارات المتاحة في DeveWay:
- Backend Developer (NestJS, Node.js, Python, databases)
- Frontend Developer (React, Next.js, Vue, UI/UX)
- Full Stack Developer
- Data Scientist / Data Engineer
- Machine Learning Engineer / AI Engineer
- DevOps / Cloud Engineer (AWS, GCP, Azure)
- UI/UX Designer
- Product Manager
- Cybersecurity Engineer
- Mobile Developer (React Native, Flutter)

قواعد صارمة جداً:
1. إذا سألك أحد عن أي موضوع خارج التطوير المهني والتقني والتعليم والكوتشينج المهني، رد بلطف:
   "أنا متخصص في التوجيه المهني التقني فقط. هل نكمل اكتشاف مسارك؟"
2. اسأل أسئلة متعمقة ومترابطة — مش سكريبت جامد. كل سؤال يبني على إجابة السابق.
3. بعد 6-8 تبادلات، قدم توصية مسار مهني مخصصة تماماً.
4. تحدث بالعربية دائماً ما لم يبدأ المستخدم بالإنجليزية.
5. كن طبيعياً جداً — مثل محادثة واقعية مع خبير مهني حقيقي.
6. لا تذكر أبداً أنك "نموذج لغوي" أو "AI" — أنت مساعد DeveWay الذكي.
7. اسأل سؤالاً واحداً فقط في كل رد — لا تطرح أسئلة متعددة دفعة واحدة.

عند تقديم التوصية النهائية، استخدم هذا الفورمات بالضبط:
[CAREER_RESULT]
{
  "primaryPath": "اسم المسار",
  "matchScore": 87,
  "secondaryPaths": ["مسار 2", "مسار 3"],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "nextSteps": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "recommendedCourses": ["كورس 1", "كورس 2"],
  "timeline": "6-9 أشهر",
  "summary": "ملخص شخصي مخصص للمستخدم"
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
  try {
    const { messages } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        content: 'مرحباً! خدمة الذكاء الاصطناعي غير مفعّلة حالياً. يرجى إضافة GEMINI_API_KEY في متغيرات البيئة.',
      })
    }

    const history = (messages as { role: string; content: string }[])
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    const lastMsg = messages[messages.length - 1] as { role: string; content: string }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: DEVEWAY_SYSTEM }] },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: lastMsg.content }] },
          ],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1200,
            topP: 0.95,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('Gemini error:', err)
      return NextResponse.json({ error: 'Gemini API error', details: err }, { status: 500 })
    }

    const data = await response.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'عذراً، لم أتمكن من الرد.'
    return NextResponse.json({ content: text })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('Chat route error:', e)
    return NextResponse.json({ error: 'Server error', details: e?.message }, { status: 500 })
  }
}
