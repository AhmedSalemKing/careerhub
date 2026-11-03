import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';

const RASHEED_SYSTEM_PROMPT = `أنت رشيد، المساعد الذكي الرسمي لمنصة DeveWay العربية للتعليم والتطوير المهني.

شخصيتك:
- ذكي، دافئ، محترف، عربي بطلاقة
- مرشد مهني وتقني متخصص
- تعرف منصة DeveWay جيداً وتعتز بها

مهامك الرئيسية:
1. الإرشاد المهني والتقني للمستخدمين
2. اقتراح الكورسات المناسبة داخل المنصة
3. شرح المفاهيم البرمجية والتقنية
4. مساعدة الطلاب في مساراتهم التعليمية
5. الإجابة عن أسئلة المنصة (الكورسات، الكوتشينج، المسارات المهنية)

المنصة تحتوي على:
- كورسات في: البرمجة، تطوير الويب، أمن سيبراني، علم البيانات، تصميم، إدارة مشاريع
- خدمة كوتشينج مع مستشارين متخصصين
- مسارات مهنية مخصصة بالذكاء الاصطناعي
- شهادات معتمدة عند إتمام الكورسات

قواعد صارمة:
1. لا تجاوب على أي سؤال خارج نطاق التعليم، التقنية، والتطوير المهني
2. لو سألك أحد عن الطعام، الأفلام، السياسة، الأسعار الخارجية، أو أي موضوع غير ذي صلة:
   قل بلطف: "أنا متخصص في دعمك في رحلتك التعليمية والمهنية على DeveWay. هل يمكنني مساعدتك في شيء يخص تعلمك أو مسارك المهني؟"
3. عند اقتراح كورس، اذكر أنه متوفر على منصة DeveWay
4. تحدث بالعربية دائماً ما لم يكتب المستخدم بالإنجليزية
5. كن موجزاً ومفيداً — لا تطيل بدون فائدة
6. لو طُلب منك معلومات دقيقة عن كورس معين أو مدرب (سعر، موعد، محتوى تفصيلي)، قل أنك ستتحقق وأحله لصفحة الكورسات
7. لا تستخدم الإيموجي

عند اقتراح كورسات، استخدم هذا الفورمات:
[COURSE_SUGGESTION]
اسم الكورس | /ar/courses
[/COURSE_SUGGESTION]

اسمك رشيد — مساعد DeveWay الذكي.`;

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly groqApiKey = process.env.GROQ_API_KEY;
  private readonly model = 'llama-3.3-70b-versatile';

  constructor(private readonly prisma: PrismaService) {}

  @Get('conversations')
  async getConversations(@Request() req: any) {
    const convs = await this.prisma.conversation.findMany({
      where: { userId: req.user.sub },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        context: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, role: true },
        },
      },
    });
    return { success: true, data: convs };
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @Request() req: any) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, userId: req.user.sub },
      include: {
        messages: {
          where: { role: { not: 'system' } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return { success: true, data: conv };
  }

  @Post('conversations')
  async createConversation(
    @Request() req: any,
    @Body() body: { context?: string },
  ) {
    const conv = await this.prisma.conversation.create({
      data: {
        userId: req.user.sub,
        title: 'محادثة جديدة',
        context: body.context || 'dashboard',
      },
    });
    return { success: true, data: conv };
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Request() req: any) {
    await this.prisma.conversation.deleteMany({
      where: { id, userId: req.user.sub },
    });
    return { success: true };
  }

  @Post('chat')
  async chat(
    @Request() req: any,
    @Body() body: { conversationId: string; message: string },
    @Res() res: Response,
  ) {
    const { conversationId, message } = body;
    const userId = req.user.sub;

    if (!message?.trim()) throw new BadRequestException('Message required');
    if (!this.groqApiKey) throw new BadRequestException('AI not configured');

    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 20 },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    await this.prisma.aiMessage.create({
      data: { conversationId, role: 'user', content: message },
    });

    const context = conv.context || 'dashboard';
    const catalogue = context === 'dashboard' ? await this.loadCourseCatalogue() : '';
    const systemPrompt = this.buildSystemPrompt(user, context, catalogue);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conv.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    if (conv.messages.filter((m) => m.role === 'user').length === 0) {
      const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let fullResponse = '';

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            stream: true,
            max_tokens: 2000,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.text();
        res.write(`data: ${JSON.stringify({ error: 'AI error: ' + err })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') {
            res.write(`data: [DONE]\n\n`);
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {}
        }
      }

      if (fullResponse) {
        await this.prisma.aiMessage.create({
          data: {
            conversationId,
            role: 'assistant',
            content: fullResponse,
            tokens: fullResponse.length,
          },
        });

        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }
    } catch (error: any) {
      console.error('[AI] Stream error:', error.message);
      res.write(
        `data: ${JSON.stringify({ error: 'AI error occurred' })}\n\n`,
      );
    }

    res.end();
  }

  /** Titles and instructors of published courses, so Rasheed only recommends what exists. */
  private async loadCourseCatalogue(): Promise<string> {
    try {
      const courses = await this.prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 30,
        select: {
          titleAr: true,
          titleEn: true,
          instructor: { select: { profile: { select: { firstName: true, lastName: true } } } },
        },
      });
      return courses
        .map((c) => {
          const p = c.instructor?.profile;
          const who = [p?.firstName, p?.lastName].filter(Boolean).join(' ');
          return `- ${c.titleAr || c.titleEn}${who ? ` (المدرب: ${who})` : ''}`;
        })
        .join('\n');
    } catch {
      return '';
    }
  }

  private buildSystemPrompt(user: any, context: string, catalogue = ''): string {
    const name = user?.profile?.firstName || 'المستخدم';
    const role = user?.accountType || 'STUDENT';

    if (context === 'dashboard') {
      return `${RASHEED_SYSTEM_PROMPT}

اسم المستخدم: ${name}. دوره على المنصة: ${role}.

الكورسات المنشورة حالياً على المنصة (اقترح منها فقط، ولا تخترع كورسات غير موجودة):
${catalogue || '- (لا تتوفر قائمة الكورسات الآن؛ وجّه المستخدم لصفحة الكورسات)'}`;
    }

    const roleInstructions: Record<string, string> = {
      STUDENT: 'يتعلم ويطور مهاراته. اشرح بأسلوب بسيط وواضح ومحفز.',
      INSTRUCTOR: 'محاضر يعلم الآخرين. ساعده في بناء المحتوى التعليمي.',
      CONSULTANT: 'مستشار مهني خبير. ساعده في تقديم نصائح احترافية.',
      ADMIN: 'مدير المنصة. قدم إجابات تقنية ومتقدمة.',
    };

    const contextHints: Record<string, string> = {
      dashboard: 'المستخدم في لوحة التحكم الخاصة به.',
      coaching: 'المستخدم في قسم الكوتشينج والاستشارات.',
    };

    return `أنت مساعد ذكاء اصطناعي احترافي داخل منصة DeveWay التعليمية المهنية.

معلومات المستخدم:
- الاسم: ${name}
- الدور: ${role}
- التعليمات: ${roleInstructions[role] ?? roleInstructions.STUDENT}

السياق الحالي: ${contextHints[context] ?? 'يتصفح المنصة.'}

DeveWay هي منصة تعليمية مهنية تضم:
- كورسات تقنية وإدارة أعمال
- كوتشينج مهني مع خبراء
- اختبار تحديد المسار المهني بالذكاء الاصطناعي
- شهادات معتمدة

قواعد الرد:
1. تحدث دائماً بالعربية ما لم يتحدث المستخدم بلغة أخرى
2. كن مختصراً وعملياً — لا تطول دون داعٍ
3. استخدم markdown (bold, lists) للوضوح
4. إذا سُئلت عن كورس أو مسار → اقترح من منصة DeveWay
5. كن محفزاً وإيجابياً
6. إذا لم تعرف الإجابة → قل ذلك بصدق واقترح بديلاً`;
  }
}
