"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
let AiController = class AiController {
    constructor(prisma) {
        this.prisma = prisma;
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.model = 'llama-3.3-70b-versatile';
    }
    async getConversations(req) {
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
    async getConversation(id, req) {
        const conv = await this.prisma.conversation.findFirst({
            where: { id, userId: req.user.sub },
            include: {
                messages: {
                    where: { role: { not: 'system' } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        return { success: true, data: conv };
    }
    async createConversation(req, body) {
        const conv = await this.prisma.conversation.create({
            data: {
                userId: req.user.sub,
                title: 'محادثة جديدة',
                context: body.context || 'dashboard',
            },
        });
        return { success: true, data: conv };
    }
    async deleteConversation(id, req) {
        await this.prisma.conversation.deleteMany({
            where: { id, userId: req.user.sub },
        });
        return { success: true };
    }
    async chat(req, body, res) {
        var _a, _b, _c, _d;
        const { conversationId, message } = body;
        const userId = req.user.sub;
        if (!(message === null || message === void 0 ? void 0 : message.trim()))
            throw new common_1.BadRequestException('Message required');
        if (!this.groqApiKey)
            throw new common_1.BadRequestException('AI not configured');
        const conv = await this.prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: {
                messages: { orderBy: { createdAt: 'asc' }, take: 20 },
            },
        });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        await this.prisma.aiMessage.create({
            data: { conversationId, role: 'user', content: message },
        });
        const systemPrompt = this.buildSystemPrompt(user, conv.context || 'dashboard');
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
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            });
            if (!response.ok) {
                const err = await response.text();
                res.write(`data: ${JSON.stringify({ error: 'AI error: ' + err })}\n\n`);
                res.end();
                return;
            }
            const reader = (_a = response.body) === null || _a === void 0 ? void 0 : _a.getReader();
            const decoder = new TextDecoder();
            while (reader) {
                const { done, value } = await reader.read();
                if (done)
                    break;
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
                        const content = (_d = (_c = (_b = parsed.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.delta) === null || _d === void 0 ? void 0 : _d.content;
                        if (content) {
                            fullResponse += content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    }
                    catch { }
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
        }
        catch (error) {
            console.error('[AI] Stream error:', error.message);
            res.write(`data: ${JSON.stringify({ error: 'AI error occurred' })}\n\n`);
        }
        res.end();
    }
    buildSystemPrompt(user, context) {
        var _a, _b, _c;
        const name = ((_a = user === null || user === void 0 ? void 0 : user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || 'المستخدم';
        const role = (user === null || user === void 0 ? void 0 : user.accountType) || 'STUDENT';
        const roleInstructions = {
            STUDENT: 'يتعلم ويطور مهاراته. اشرح بأسلوب بسيط وواضح ومحفز.',
            INSTRUCTOR: 'محاضر يعلم الآخرين. ساعده في بناء المحتوى التعليمي.',
            CONSULTANT: 'مستشار مهني خبير. ساعده في تقديم نصائح احترافية.',
            ADMIN: 'مدير المنصة. قدم إجابات تقنية ومتقدمة.',
        };
        const contextHints = {
            dashboard: 'المستخدم في لوحة التحكم الخاصة به.',
            coaching: 'المستخدم في قسم الكوتشينج والاستشارات.',
        };
        return `أنت مساعد ذكاء اصطناعي احترافي داخل منصة DeveWay التعليمية المهنية.

معلومات المستخدم:
- الاسم: ${name}
- الدور: ${role}
- التعليمات: ${(_b = roleInstructions[role]) !== null && _b !== void 0 ? _b : roleInstructions.STUDENT}

السياق الحالي: ${(_c = contextHints[context]) !== null && _c !== void 0 ? _c : 'يتصفح المنصة.'}

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
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Post)('conversations'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Delete)('conversations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "deleteConversation", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chat", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiController);
//# sourceMappingURL=ai.controller.js.map