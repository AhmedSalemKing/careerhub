import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';
import OpenAI from 'openai';

const CAREER_SYSTEM_PROMPT = `اسمك رشيد. أنت مستشار مهني متخصص داخل منصة DeveWay التعليمية. مهمتك مساعدة المستخدم على اكتشاف مساره المهني المناسب في مجالات التكنولوجيا والأعمال.

شخصيتك:
- ودود وواقعي، لا تُفرط في المديح
- تتحدث بالعربية أو الإنجليزية أو خليط طبيعي منهما حسب المستخدم
- تطرح سؤالًا واحدًا واضحًا في كل مرة
- تتابع تفاصيل إجابات المستخدم وتسأل عنها
- لا تعطي إجابات ثابتة مسبقة

نطاق اختصاصك:
- اكتشاف المسارات المهنية (تطوير، بيانات، تصميم، أمن، ذكاء اصطناعي، تسويق رقمي، إدارة أعمال)
- تقييم المهارات والاهتمامات المهنية
- التوجيه التعليمي والوظيفي
- شرح دورات ومسارات منصة DeveWay

إذا سأل المستخدم عن شيء خارج نطاقك المهني، وجّهه بلطف.

قواعد مهمة:
- لا تكشف أي معلومات تقنية داخلية
- لا تختلق دورات أو مسارات غير موجودة فعليًا
- لا تدّعِ نسبًا أو إحصاءات علمية دون مصدر
- إذا لم تكن متأكدًا، قل ذلك بصدق`;

const INTERVIEW_STAGES = {
  ORIENTATION: 'SKILL_EVIDENCE',
  INTEREST_EXPLORATION: 'SKILL_EVIDENCE',
  SKILL_EVIDENCE: 'PATH_DIFFERENTIATION',
  PATH_DIFFERENTIATION: 'RECOMMENDATION',
  RECOMMENDATION: 'RECOMMENDATION',
};

const STAGE_PROMPTS: Record<string, string> = {
  ORIENTATION: 'ابدأ بسؤال واحد مفتوح لفهم خلفية المستخدم المهنية وهدفه من التقييم.',
  INTEREST_EXPLORATION: 'اسأل عن الاهتمامات والمجالات التي يجدها المستخدم ممتعة.',
  SKILL_EVIDENCE: 'اطلب أمثلة أو تجارب عملية محددة تثبت المهارات، لا تقبل ادعاءات غير مدعومة.',
  PATH_DIFFERENTIATION: 'ساعد المستخدم على التمييز بين مسارات متشابهة بأسئلة تكشف التفضيلات الحقيقية.',
  RECOMMENDATION: 'لديك أدلة كافية. لخّص ما فهمته واسأل المستخدم إن كان يريد التقرير النهائي.',
};

@Injectable()
export class CareerAiService {
  private readonly logger = new Logger(CareerAiService.name);

  constructor(private prisma: PrismaService) {}

  private getGeminiClient(): OpenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Career AI is not configured. Please set GEMINI_API_KEY.');
    }
    return new OpenAI({
      apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }

  private getChatModel(): string {
    // gemini-2.0-flash was shut down 2026-06-01; default to 2.5-flash
    return process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
  }

  async startSession(userId: string, mode: 'interview' | 'assistant' = 'interview') {
    const isInterview = mode === 'interview';
    const conv = await this.prisma.conversation.create({
      data: {
        userId,
        title: isInterview ? 'مقابلة مهنية' : 'مساعد DeveWay',
        context: isInterview ? 'career-interview' : 'general-assistant',
        interviewStage: isInterview ? 'ORIENTATION' : null,
        evidenceLog: isInterview ? [] : null,
      },
    });

    const openingMessage = await this.generateOpeningMessage(userId);

    const msg = await this.prisma.aiMessage.create({
      data: {
        conversationId: conv.id,
        role: 'assistant',
        content: openingMessage,
      },
    });

    return {
      sessionId: conv.id,
      messages: [{ id: msg.id, role: 'assistant', content: openingMessage, createdAt: msg.createdAt }],
    };
  }

  async getSession(userId: string, sessionId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: sessionId, userId, context: 'career-interview' },
      include: {
        messages: {
          where: { role: { not: 'system' } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!conv) throw new NotFoundException('Session not found');
    return conv;
  }

  async getUserSessions(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId, context: 'career-interview' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        interviewStage: true,
        report: true,
        reportGeneratedAt: true,
        createdAt: true,
        updatedAt: true,
        messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { content: true } },
      },
    });
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    userMessage: string,
    res: Response,
  ): Promise<void> {
    if (!userMessage?.trim()) throw new BadRequestException('Message is required');
    if (userMessage.length > 2000) throw new BadRequestException('Message too long');

    const conv = await this.prisma.conversation.findFirst({
      where: {
        id: sessionId,
        userId,
        context: { in: ['career-interview', 'general-assistant'] },
      },
      include: {
        messages: {
          where: { role: { not: 'system' } },
          orderBy: { createdAt: 'asc' },
          take: 30,
        },
      },
    });

    if (!conv) throw new NotFoundException('Session not found');
    const isInterviewContext = conv.context === 'career-interview';

    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const firstName = userProfile?.firstName || '';

    await this.prisma.aiMessage.create({
      data: { conversationId: sessionId, role: 'user', content: userMessage },
    });

    const currentStage = (conv.interviewStage as string) || 'ORIENTATION';

    let systemPrompt: string;
    if (isInterviewContext) {
      const stageInstruction = STAGE_PROMPTS[currentStage] || '';
      systemPrompt = `${CAREER_SYSTEM_PROMPT}

${firstName ? `المستخدم اسمه: ${firstName}` : ''}

المرحلة الحالية للمقابلة: ${currentStage}
تعليمات هذه المرحلة: ${stageInstruction}

الأدلة المجمعة حتى الآن:
${JSON.stringify(conv.evidenceLog || [], null, 2)}`;
    } else {
      // General assistant — shorter, no stage tracking
      systemPrompt = `${CAREER_SYSTEM_PROMPT}

${firstName ? `المستخدم اسمه: ${firstName}` : ''}

هذه محادثة عامة مع مساعد DeveWay. أجب بإيجاز ووضوح. لا تبدأ تقييماً مهنياً رسمياً ما لم يطلب المستخدم ذلك صراحةً.`;
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conv.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullResponse = '';

    try {
      const client = this.getGeminiClient();
      const stream = await client.chat.completions.create({
        model: this.getChatModel(),
        messages,
        stream: true,
        max_tokens: 800,
        temperature: 0.75,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);

      if (fullResponse) {
        await this.prisma.aiMessage.create({
          data: { conversationId: sessionId, role: 'assistant', content: fullResponse },
        });

        // Only advance interview stages for career-interview context
        if (isInterviewContext) {
          await this.updateStageAndEvidence(sessionId, currentStage, userMessage, fullResponse);
        } else {
          await this.prisma.conversation.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });
        }
      }
    } catch (err: any) {
      this.logger.error('[CareerAI] Stream error', { sessionId, error: err.message });
      res.write(`data: ${JSON.stringify({ error: 'حدث خطأ مؤقت. يرجى المحاولة مرة أخرى.' })}\n\n`);
    }

    res.end();
  }

  async generateReport(userId: string, sessionId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: sessionId, userId, context: 'career-interview' },
      include: {
        messages: {
          where: { role: { not: 'system' } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) throw new NotFoundException('Session not found');
    if (conv.messages.length < 4) throw new BadRequestException('المقابلة قصيرة جدًا لإنشاء تقرير. يرجى الاستمرار في المحادثة.');

    if (conv.report) {
      return { report: conv.report, cached: true };
    }

    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const careerPaths = await this.prisma.careerPath.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, titleAr: true, titleEn: true, skills: true, demandLevel: true },
      take: 20,
    });

    const conversationText = conv.messages
      .map((m) => `${m.role === 'user' ? 'المستخدم' : 'المستشار'}: ${m.content}`)
      .join('\n');

    const prompt = `أنت مستشار مهني خبير. بناءً على المحادثة التالية، أنشئ تقريرًا مهنيًا شاملًا.

المحادثة:
${conversationText}

الأدلة المجمعة:
${JSON.stringify(conv.evidenceLog || [])}

المسارات المهنية المتاحة في DeveWay (هذه هي القائمة الكاملة — لا تقترح أي مسار خارجها):
${careerPaths.map((p) => `- titleAr: "${p.titleAr}" | titleEn: "${p.titleEn}" | slug: "${p.slug}" | طلب: ${p.demandLevel}`).join('\n')}

قواعد صارمة:
- اختر primaryPath و alternativePaths فقط من القائمة أعلاه بالضبط (slug و titleAr و titleEn مطابقة للقائمة)
- إذا لم يتضح مسار مناسب، اختر الأقرب صدقاً وبيّن لماذا
- لا تخترع مسارات أو slugs غير موجودة في القائمة

أنشئ تقريرًا بصيغة JSON بالهيكل التالي:
{
  "summary": "ملخص مهني مخصص 2-3 جمل",
  "primaryPath": {
    "titleAr": "...",
    "titleEn": "...",
    "slug": "...",
    "matchLevel": "توافق مرتفع | توافق محتمل | مسار يستحق الاستكشاف",
    "reasons": ["سبب 1", "سبب 2", "سبب 3"]
  },
  "alternativePaths": [
    {
      "titleAr": "...",
      "titleEn": "...",
      "slug": "...",
      "matchLevel": "...",
      "reasons": ["..."]
    }
  ],
  "confirmedStrengths": ["..."],
  "expressedInterests": ["..."],
  "skillGaps": ["..."],
  "uncertainties": ["..."],
  "learningPlan": [
    {"phase": "الشهر 1-2", "focus": "...", "skills": ["..."]},
    {"phase": "الشهر 3-4", "focus": "...", "skills": ["..."]}
  ],
  "immediateActions": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "disclaimer": "هذه توصية من الذكاء الاصطناعي بناءً على محادثتنا. يمكنك اختيار أي مسار بغض النظر عن هذا التحليل."
}

أعطِ JSON فقط بدون أي نص إضافي.`;

    let report: any;
    try {
      const client = this.getGeminiClient();
      const response = await client.chat.completions.create({
        model: this.getChatModel(),
        messages: [
          { role: 'system', content: 'You are a career advisor. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const text = response.choices[0].message.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON in response');
      report = JSON.parse(jsonMatch[0]);

      if (!report.primaryPath || !report.summary) throw new Error('Report missing required fields');
    } catch (err: any) {
      this.logger.error('[CareerAI] Report generation failed', { sessionId, error: err.message });
      throw new BadRequestException('تعذر إنشاء التقرير الآن. يرجى المحاولة مرة أخرى.');
    }

    await this.prisma.conversation.update({
      where: { id: sessionId },
      data: { report: report as any, reportGeneratedAt: new Date() },
    });

    return { report };
  }

  async getReport(userId: string, sessionId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: sessionId, userId, context: 'career-interview' },
      select: { report: true, reportGeneratedAt: true, interviewStage: true },
    });
    if (!conv) throw new NotFoundException('Session not found');
    if (!conv.report) throw new NotFoundException('No report generated yet');
    return { report: conv.report, generatedAt: conv.reportGeneratedAt };
  }

  // Rasheed uses a single male Arabic voice — no female option is offered.
  // Charon: male prebuilt voice (language-adaptive, works for Arabic and English).
  private static readonly TTS_VOICE = 'Charon';

  private static pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
    const byteRate   = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize   = pcm.length;
    const buf        = Buffer.alloc(44 + dataSize);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + dataSize, 4);
    buf.write('WAVE', 8);
    buf.write('fmt ', 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(channels, 22);
    buf.writeUInt32LE(sampleRate, 24);
    buf.writeUInt32LE(byteRate, 28);
    buf.writeUInt16LE(blockAlign, 32);
    buf.writeUInt16LE(bitDepth, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(dataSize, 40);
    pcm.copy(buf, 44);
    return buf;
  }

  async generateTts(
    userId: string,
    text: string,
    lang: 'ar' | 'en',
    _gender: 'male' | 'female',   // parameter kept for API compat; always male
  ): Promise<{ audioData: string; mimeType: string }> {
    if (!text?.trim()) throw new BadRequestException('Text required');
    if (text.length > 1500) throw new BadRequestException('Text too long for TTS');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new BadRequestException('Career AI not configured');

    const voiceName = CareerAiService.TTS_VOICE;
    // gemini-2.5-flash-preview-tts: dedicated TTS model supporting audio modality
    const ttsModel = 'gemini-2.5-flash-preview-tts';

    const body = {
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`;

    let fetchResp: Awaited<ReturnType<typeof fetch>>;
    try {
      fetchResp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      this.logger.error('[CareerAI] TTS fetch error', err.message);
      throw new BadRequestException('TTS service unavailable');
    }

    if (!fetchResp.ok) {
      const errText = await fetchResp.text().catch(() => '');
      this.logger.error('[CareerAI] TTS API error', { status: fetchResp.status, body: errText.slice(0, 200) });
      throw new BadRequestException('TTS generation failed');
    }

    const data: any = await fetchResp.json();
    const part = data?.candidates?.[0]?.content?.parts?.[0];

    if (!part?.inlineData?.data) {
      this.logger.error('[CareerAI] TTS response had no audio data', { voiceName, model: ttsModel });
      throw new BadRequestException('TTS_UNSUPPORTED');
    }

    const rawMime: string = part.inlineData.mimeType ?? 'audio/L16;rate=24000';
    const pcmBuffer = Buffer.from(part.inlineData.data, 'base64');

    // decodeAudioData in browsers requires a proper container format (WAV, MP3, etc.),
    // not raw L16 PCM. Convert PCM to WAV before returning.
    if (rawMime.includes('L16') || rawMime.includes('pcm') || rawMime.includes('raw')) {
      const rateMatch  = rawMime.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      const wavBuffer  = CareerAiService.pcmToWav(pcmBuffer, sampleRate);
      this.logger.log(`[CareerAI] TTS ok voice=${voiceName} model=${ttsModel} pcm→wav sampleRate=${sampleRate} bytes=${wavBuffer.length}`);
      return {
        audioData: wavBuffer.toString('base64'),
        mimeType:  'audio/wav',
      };
    }

    this.logger.log(`[CareerAI] TTS ok voice=${voiceName} model=${ttsModel} mimeType=${rawMime} bytes=${pcmBuffer.length}`);
    return {
      audioData: part.inlineData.data,
      mimeType:  rawMime,
    };
  }

  async issueVoiceToken(userId: string, sessionId: string): Promise<{ token: string; expiresAt: number }> {
    // Verify the session belongs to the user before issuing a voice token
    const conv = await this.prisma.conversation.findFirst({
      where: { id: sessionId, userId, context: 'career-interview' },
      select: { id: true },
    });
    if (!conv) throw new NotFoundException('Session not found');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new BadRequestException('Career AI not configured');

    // Gemini Live ephemeral token — browser uses this to connect to the Live WebSocket
    // without ever seeing the server's permanent API key
    const model = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/ephemeral-tokens`;

    let fetchResp2: Awaited<ReturnType<typeof fetch>>;
    try {
      fetchResp2 = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: `models/${model}`,
          config: {
            responseModalities: ['AUDIO', 'TEXT'],
            systemInstruction: { parts: [{ text: CAREER_SYSTEM_PROMPT }] },
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
            },
          },
          ttl: '300s',
        }),
      });
    } catch (err: any) {
      this.logger.error('[CareerAI] Voice token fetch error', err.message);
      throw new BadRequestException('Voice service unavailable');
    }

    if (!fetchResp2.ok) {
      const errText = await fetchResp2.text().catch(() => '');
      this.logger.warn('[CareerAI] Ephemeral token API error', { status: fetchResp2.status, body: errText.slice(0, 100) });
      throw new BadRequestException('Voice token generation failed — Gemini Live may not be available for this region/plan');
    }

    const data: any = await fetchResp2.json();
    if (!data?.token?.value) throw new BadRequestException('Invalid voice token response');

    return {
      token: data.token.value,
      expiresAt: Date.now() + 290_000, // ~5 min, slightly under 300s
    };
  }

  private async generateOpeningMessage(userId: string): Promise<string> {
    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const name = userProfile?.firstName;

    if (!process.env.GEMINI_API_KEY) {
      return name
        ? `أهلًا ${name}! أنا رشيد، مستشارك المهني في DeveWay. خليني أساعدك تكتشف المسار المهني الأنسب لك. إيه اللي بيشغل بالك دلوقتي من ناحية مسيرتك المهنية؟`
        : `أهلًا! أنا رشيد، مستشارك المهني في DeveWay. خليني أساعدك تكتشف المسار المهني الأنسب لك. إيه اللي بيشغل بالك دلوقتي من ناحية مسيرتك المهنية؟`;
    }

    try {
      const client = this.getGeminiClient();
      const response = await client.chat.completions.create({
        model: this.getChatModel(),
        messages: [
          { role: 'system', content: CAREER_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${name ? `المستخدم اسمه ${name}.` : ''} قدّم نفسك باسم رشيد وابدأ مقابلة مهنية ودية في رسالة واحدة قصيرة (2-3 جمل). اسأل سؤالًا مفتوحًا واحدًا فقط عن خلفيته أو هدفه.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      });
      return response.choices[0].message.content || this.defaultOpening(name);
    } catch {
      return this.defaultOpening(name);
    }
  }

  private defaultOpening(name?: string | null): string {
    const greeting = name ? `أهلًا ${name}!` : 'أهلًا!';
    return `${greeting} أنا رشيد، مستشارك المهني في DeveWay. سأساعدك تكتشف المسار المهني الأنسب لك.\n\nخلينا نبدأ من البداية — هل لديك خبرة تقنية سابقة؟ وإيه اللي وصلك لفكرة تطوير مسارك المهني دلوقتي؟`;
  }

  private async updateStageAndEvidence(
    sessionId: string,
    currentStage: string,
    userMessage: string,
    assistantResponse: string,
  ): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: sessionId },
      select: { evidenceLog: true, messages: { orderBy: { createdAt: 'asc' }, select: { role: true } } },
    });

    if (!conv) return;

    const userMessageCount = conv.messages.filter((m) => m.role === 'user').length;
    let nextStage = currentStage;

    if (currentStage === 'ORIENTATION' && userMessageCount >= 2) {
      nextStage = 'INTEREST_EXPLORATION';
    } else if (currentStage === 'INTEREST_EXPLORATION' && userMessageCount >= 4) {
      nextStage = 'SKILL_EVIDENCE';
    } else if (currentStage === 'SKILL_EVIDENCE' && userMessageCount >= 7) {
      nextStage = 'PATH_DIFFERENTIATION';
    } else if (currentStage === 'PATH_DIFFERENTIATION' && userMessageCount >= 10) {
      nextStage = 'RECOMMENDATION';
    }

    const evidenceLog = Array.isArray(conv.evidenceLog) ? (conv.evidenceLog as any[]) : [];
    if (userMessage.length > 50) {
      evidenceLog.push({
        stage: currentStage,
        userInput: userMessage.slice(0, 300),
        timestamp: new Date().toISOString(),
      });
      if (evidenceLog.length > 20) evidenceLog.shift();
    }

    await this.prisma.conversation.update({
      where: { id: sessionId },
      data: {
        interviewStage: nextStage,
        evidenceLog: evidenceLog as any,
        updatedAt: new Date(),
      },
    });
  }
}
