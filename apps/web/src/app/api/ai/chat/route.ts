import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// NOTE: Set GEMINI_API_KEY in apps/web/.env.local
// Get your key from https://makersuite.google.com/app/apikey
const GEMINI_KEY = process.env.GEMINI_API_KEY
const GROQ_KEY = process.env.GROQ_API_KEY

const CAREER_SYSTEM_PROMPT = `أنت مساعد DeveWay الذكي المتخصص في التوجيه المهني والكوتشينج.
اسمك "DeveWay Career AI". شخصيتك: محترف، دافئ، ذكي، عربي بطلاقة.

مهمتك الوحيدة: مساعدة المستخدمين في اكتشاف مساراتهم المهنية المناسبة.

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
1. لا تجاوب على أي سؤال خارج نطاق التطوير المهني والتقني والتعليم والكوتشينج
2. لو سألك أحد عن الطعام، الأفلام، الرياضة، السياسة أو أي موضوع غير مهني: قل بلطف "أنا متخصص في التوجيه المهني فقط، هل تريد أن نكمل اكتشاف مسارك؟"
3. اسأل أسئلة متعمقة ومترابطة — مش سكريبت جامد
4. بعد 6-8 رسائل من المحادثة، قدّم توصية مسار مهني مخصصة بناءً على ما فهمته
5. تحدث بالعربية دائماً ما لم يبدأ المستخدم بالإنجليزية
6. كن محادثاً طبيعياً مثل مقابلة عمل حقيقية، ليس استبياناً

عند تقديم التوصية النهائية، اتبع هذا الفورمات بالضبط:
[CAREER_RESULT]
{
  "primaryPath": "اسم المسار الأساسي",
  "matchScore": 87,
  "secondaryPaths": ["مسار ثانوي 1", "مسار ثانوي 2"],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "nextSteps": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "recommendedCourses": ["كورس 1", "كورس 2"],
  "timeline": "6-9 أشهر"
}
[/CAREER_RESULT]`

const QUIZ_SYSTEM_PROMPT = `${CAREER_SYSTEM_PROMPT}

وضع الاختبار التفاعلي:
عند توليد الأسئلة، استخدم هذا الفورمات بالضبط:
[QUIZ_Q]
{
  "question": "نص السؤال",
  "choices": ["أ) ...", "ب) ...", "ج) ...", "د) ..."],
  "correct": 0,
  "explanation": "شرح قصير للإجابة الصحيحة"
}
[/QUIZ_Q]

ولّد سؤالاً واحداً في كل مرة. بعد 8 أسئلة، قدّم التوصية النهائية بفورمات [CAREER_RESULT].`

async function callGemini(messages: any[], mode: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(GEMINI_KEY)
  const systemPrompt = mode === 'quiz' ? QUIZ_SYSTEM_PROMPT : CAREER_SYSTEM_PROMPT

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
  })

  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMessage.content)
  return result.response.text()
}

async function callGroq(messages: any[], mode: string): Promise<string> {
  if (!GROQ_KEY) throw new Error('Neither GEMINI_API_KEY nor GROQ_API_KEY is set')

  const systemPrompt = mode === 'quiz' ? QUIZ_SYSTEM_PROMPT : CAREER_SYSTEM_PROMPT
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      ],
      max_tokens: 1200,
      temperature: 0.8,
    }),
  })
  if (!resp.ok) throw new Error('Groq API error: ' + resp.status)
  const data = await resp.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode = 'interview' } = await req.json()
    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    let content: string
    if (GEMINI_KEY) {
      content = await callGemini(messages, mode)
    } else {
      content = await callGroq(messages, mode)
    }

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('[AI chat route]', error?.message)
    return NextResponse.json({ error: 'AI service error', details: error?.message }, { status: 500 })
  }
}
