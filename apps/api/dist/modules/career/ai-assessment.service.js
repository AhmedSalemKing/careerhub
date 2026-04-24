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
var AiAssessmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAssessmentService = exports.ASSESSMENT_QUESTIONS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
exports.ASSESSMENT_QUESTIONS = [
    {
        id: 1,
        category: 'technical',
        en: 'How comfortable are you with writing code or programming logic?',
        options: [
            { value: 'A', en: 'Never tried it, seems intimidating' },
            { value: 'B', en: 'Tried basics (HTML, simple scripts)' },
            { value: 'C', en: 'Comfortable with one language' },
            { value: 'D', en: 'Proficient in multiple languages' },
        ],
    },
    {
        id: 2,
        category: 'technical',
        en: 'When you see a dataset or numbers, what\'s your first instinct?',
        options: [
            { value: 'A', en: 'I avoid working with data' },
            { value: 'B', en: 'I can do basic Excel work' },
            { value: 'C', en: 'I enjoy finding patterns in data' },
            { value: 'D', en: 'I think about statistical models and insights' },
        ],
    },
    {
        id: 3,
        category: 'technical',
        en: 'How do you approach a broken system or technical problem?',
        options: [
            { value: 'A', en: 'I ask someone else to fix it' },
            { value: 'B', en: 'I Google solutions and follow guides' },
            { value: 'C', en: 'I systematically debug step by step' },
            { value: 'D', en: 'I enjoy the challenge and find creative solutions' },
        ],
    },
    {
        id: 4,
        category: 'technical',
        en: 'Which of these sounds most interesting to work on?',
        options: [
            { value: 'A', en: 'Building and designing websites/apps' },
            { value: 'B', en: 'Analyzing data to find business insights' },
            { value: 'C', en: 'Managing servers and cloud infrastructure' },
            { value: 'D', en: 'Creating AI/ML models and algorithms' },
        ],
    },
    {
        id: 5,
        category: 'technical',
        en: 'What is your current experience with technology tools?',
        options: [
            { value: 'A', en: 'Basic (Office, email, social media)' },
            { value: 'B', en: 'Intermediate (Design tools, basic coding)' },
            { value: 'C', en: 'Advanced (Multiple programming languages)' },
            { value: 'D', en: 'Expert (Deployed projects, professional experience)' },
        ],
    },
    {
        id: 6,
        category: 'technical',
        en: 'How do you feel about learning new technical skills?',
        options: [
            { value: 'A', en: "It's difficult and I prefer non-technical work" },
            { value: 'B', en: 'I can learn if guided step by step' },
            { value: 'C', en: 'I enjoy learning and pick up quickly' },
            { value: 'D', en: 'I actively seek new technical knowledge' },
        ],
    },
    {
        id: 7,
        category: 'technical',
        en: 'Which best describes your relationship with digital design?',
        options: [
            { value: 'A', en: 'I have no interest in visual design' },
            { value: 'B', en: "I appreciate good design but can't create it" },
            { value: 'C', en: 'I can create basic designs using tools' },
            { value: 'D', en: 'I have a strong eye for UX/UI and branding' },
        ],
    },
    {
        id: 8,
        category: 'professional',
        en: 'In a team project, what role do you naturally take?',
        options: [
            { value: 'A', en: 'The executor — I follow tasks and deliver' },
            { value: 'B', en: 'The analyst — I research and provide insights' },
            { value: 'C', en: 'The coordinator — I organize and connect people' },
            { value: 'D', en: 'The leader — I set direction and make decisions' },
        ],
    },
    {
        id: 9,
        category: 'professional',
        en: 'What drives you most in your career?',
        options: [
            { value: 'A', en: 'Financial security and stable income' },
            { value: 'B', en: 'Creative expression and innovation' },
            { value: 'C', en: 'Impact and helping others' },
            { value: 'D', en: 'Building something significant' },
        ],
    },
    {
        id: 10,
        category: 'professional',
        en: 'How do you prefer to work?',
        options: [
            { value: 'A', en: 'Alone with deep focus on complex tasks' },
            { value: 'B', en: 'Small team with clear responsibilities' },
            { value: 'C', en: 'Collaborating with diverse people' },
            { value: 'D', en: 'Leading and delegating to others' },
        ],
    },
    {
        id: 11,
        category: 'professional',
        en: 'When facing a big decision, you tend to:',
        options: [
            { value: 'A', en: 'Gather all data before deciding' },
            { value: 'B', en: 'Consult trusted people for advice' },
            { value: 'C', en: 'Trust your gut and move fast' },
            { value: 'D', en: 'Create a structured plan and evaluate options' },
        ],
    },
    {
        id: 12,
        category: 'professional',
        en: 'What is your highest priority in your next job?',
        options: [
            { value: 'A', en: 'High salary and financial growth' },
            { value: 'B', en: 'Learning and skill development' },
            { value: 'C', en: 'Work-life balance and flexibility' },
            { value: 'D', en: 'Title, leadership, and career progression' },
        ],
    },
    {
        id: 13,
        category: 'professional',
        en: 'What industry excites you most?',
        options: [
            { value: 'A', en: 'Technology and Software' },
            { value: 'B', en: 'Business, Finance and Consulting' },
            { value: 'C', en: 'Healthcare and Education' },
            { value: 'D', en: 'Creative industries (Media, Marketing, Design)' },
        ],
    },
    {
        id: 14,
        category: 'professional',
        en: 'How would you describe your communication style?',
        options: [
            { value: 'A', en: 'Analytical — I present data and logic' },
            { value: 'B', en: 'Storyteller — I use narratives and examples' },
            { value: 'C', en: 'Direct — I get to the point quickly' },
            { value: 'D', en: 'Empathetic — I connect with people emotionally' },
        ],
    },
    {
        id: 15,
        category: 'professional',
        en: 'Where do you see yourself in 3 years?',
        options: [
            { value: 'A', en: 'Technical expert or specialist in my field' },
            { value: 'B', en: 'Team lead or manager' },
            { value: 'C', en: 'Entrepreneur or freelancer' },
            { value: 'D', en: 'Still exploring and growing' },
        ],
    },
];
function parseAssessmentReport(text) {
    let report;
    try {
        report = JSON.parse(text);
    }
    catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }
        report = JSON.parse(jsonMatch[0]);
    }
    const required = ['personalityType', 'topSpecializations'];
    for (const field of required) {
        if (!report[field]) {
            throw new Error(`Report missing required field: ${field}`);
        }
    }
    return report;
}
let AiAssessmentService = AiAssessmentService_1 = class AiAssessmentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AiAssessmentService_1.name);
    }
    async callGroq(prompt) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey)
            throw new Error('GROQ_API_KEY not set in .env');
        this.logger.debug('Sending Groq API request');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional career advisor. Always respond with valid JSON only, no markdown, no explanation.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: { type: 'json_object' },
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API ${response.status}: ${error}`);
        }
        const data = await response.json();
        const text = data.choices[0].message.content;
        this.logger.debug('Groq API response received', { length: text.length });
        return text;
    }
    getQuestions() {
        return exports.ASSESSMENT_QUESTIONS;
    }
    async startSession(userId) {
        const session = await this.prisma.assessmentSession.create({
            data: {
                userId,
                status: 'IN_PROGRESS',
                answers: [],
            },
        });
        return { sessionId: session.id };
    }
    async completeSession(userId, sessionId, answers) {
        var _a, _b, _c;
        const session = await this.prisma.assessmentSession.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.BadRequestException('Session not found');
        }
        if (session.status === 'COMPLETED' && session.report) {
            return { report: session.report };
        }
        if (answers.length !== 15) {
            throw new common_1.BadRequestException('All 15 answers are required');
        }
        const questionIds = answers.map((a) => a.questionId);
        for (let i = 1; i <= 15; i++) {
            if (!questionIds.includes(i)) {
                throw new common_1.BadRequestException(`Missing answer for question ${i}`);
            }
        }
        const userProfile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });
        const formattedAnswers = answers.map((a) => {
            var _a;
            const question = exports.ASSESSMENT_QUESTIONS.find((q) => q.id === a.questionId);
            if (!question)
                return '';
            const option = question.options.find((o) => o.value === a.answer);
            return `Q${a.questionId} [${question.category}]: "${question.en}" → ${a.answer}: "${(_a = option === null || option === void 0 ? void 0 : option.en) !== null && _a !== void 0 ? _a : a.answer}"`;
        }).join('\n');
        const firstName = (_a = userProfile === null || userProfile === void 0 ? void 0 : userProfile.firstName) !== null && _a !== void 0 ? _a : 'User';
        const lastName = (_b = userProfile === null || userProfile === void 0 ? void 0 : userProfile.lastName) !== null && _b !== void 0 ? _b : '';
        const country = (_c = userProfile === null || userProfile === void 0 ? void 0 : userProfile.country) !== null && _c !== void 0 ? _c : 'Arab region';
        const prompt = `You are a professional career advisor specializing in the Arab tech market (Saudi Arabia and Egypt).

A user has completed a career assessment. Analyze their answers and provide a comprehensive, realistic career report.

User Profile:
- Name: ${firstName} ${lastName}
- Country: ${country}

Assessment Answers:
${formattedAnswers}

Provide a detailed career report. Be specific, realistic, and actionable. Focus on Technology, Business, and Computer Science fields only.

Return ONLY valid JSON in this exact structure:
{
  "personalityType": "string (e.g. Analytical Builder, Creative Technologist)",
  "personalityDescription": "2-3 sentences describing their professional personality",
  "topSpecializations": [
    {
      "rank": 1,
      "title": "Arabic title",
      "titleEn": "English title (e.g. Data Analyst, Frontend Developer)",
      "matchScore": 87,
      "whyMatch": "2 sentences explaining why this fits them",
      "requiredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "currentSkills": ["skills they likely already have based on answers"],
      "missingSkills": ["skills they need to develop"],
      "learningPath": [
        {"month": "Month 1-2", "focus": "what to learn", "resources": "specific course/tool"},
        {"month": "Month 3-4", "focus": "what to learn", "resources": "specific course/tool"},
        {"month": "Month 5-6", "focus": "what to learn", "resources": "specific course/tool"}
      ],
      "salaryRange": {
        "egypt": "8,000 - 15,000 EGP",
        "saudi": "8,000 - 15,000 SAR"
      },
      "timeToFirstJob": "4-6 months",
      "jobTitles": ["Junior Data Analyst", "Business Intelligence Analyst"],
      "demandLevel": "Very High"
    },
    { "rank": 2, "title": "...", "titleEn": "...", "matchScore": 82, "whyMatch": "...", "requiredSkills": [], "currentSkills": [], "missingSkills": [], "learningPath": [], "salaryRange": {"egypt": "...", "saudi": "..."}, "timeToFirstJob": "...", "jobTitles": [], "demandLevel": "..." },
    { "rank": 3, "title": "...", "titleEn": "...", "matchScore": 75, "whyMatch": "...", "requiredSkills": [], "currentSkills": [], "missingSkills": [], "learningPath": [], "salaryRange": {"egypt": "...", "saudi": "..."}, "timeToFirstJob": "...", "jobTitles": [], "demandLevel": "..." }
  ],
  "personalityStrengths": ["strength1", "strength2", "strength3"],
  "areasToImprove": ["area1", "area2"],
  "personalAdvice": "Direct, personal advice in 2-3 sentences",
  "urgentFirstStep": "One specific action they should take this week",
  "disclaimer": "This is an AI recommendation. You can choose any path regardless of this analysis."
}`;
        let report;
        try {
            const rawText = await this.callGroq(prompt);
            report = parseAssessmentReport(rawText);
            this.logger.log('Assessment report parsed successfully', { sessionId });
        }
        catch (err) {
            this.logger.error('AI analysis failed', {
                sessionId,
                operation: 'completeSession',
                error: err.message,
            });
            await this.prisma.assessmentSession.update({
                where: { id: sessionId },
                data: {
                    answers: answers,
                    status: 'FAILED',
                },
            }).catch(() => { });
            return {
                status: 'processing',
                message: 'Assessment analysis is temporarily unavailable. Please try again in a moment.',
                retryAfter: 60,
            };
        }
        await this.prisma.assessmentSession.update({
            where: { id: sessionId },
            data: {
                answers: answers,
                report: report,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
        return { report, status: 'COMPLETED' };
    }
    async getSessionHistory(userId) {
        const sessions = await this.prisma.assessmentSession.findMany({
            where: { userId, status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            select: {
                id: true,
                status: true,
                createdAt: true,
                completedAt: true,
                report: true,
            },
        });
        return sessions;
    }
};
exports.AiAssessmentService = AiAssessmentService;
exports.AiAssessmentService = AiAssessmentService = AiAssessmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiAssessmentService);
//# sourceMappingURL=ai-assessment.service.js.map