import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const ASSESSMENT_QUESTIONS = [
  // Technical Questions (7 questions)
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
  // Professional/General Questions (8 questions)
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

export interface AssessmentReport {
  personalityType: string;
  personalityDescription: string;
  topSpecializations: Array<{
    rank: number;
    title: string;
    titleEn: string;
    matchScore: number;
    whyMatch: string;
    requiredSkills: string[];
    currentSkills: string[];
    missingSkills: string[];
    learningPath: Array<{ month: string; focus: string; resources: string }>;
    salaryRange: { egypt: string; saudi: string };
    timeToFirstJob: string;
    jobTitles: string[];
    demandLevel: string;
  }>;
  personalityStrengths: string[];
  areasToImprove: string[];
  personalAdvice: string;
  urgentFirstStep: string;
  disclaimer: string;
}

function parseAssessmentReport(text: string): AssessmentReport {
  let report: any;

  try {
    report = JSON.parse(text);
  } catch {
    // Try to extract JSON from text that may contain markdown fences or extra content
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    report = JSON.parse(jsonMatch[0]);
  }

  // Validate required fields
  const required = ['personalityType', 'topSpecializations'];
  for (const field of required) {
    if (!report[field]) {
      throw new Error(`Report missing required field: ${field}`);
    }
  }

  return report as AssessmentReport;
}

@Injectable()
export class AiAssessmentService {
  private readonly logger = new Logger(AiAssessmentService.name);

  constructor(private prisma: PrismaService) {}

  private async callGroq(prompt: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

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

    const data = await response.json() as any;
    const text = data.choices[0].message.content as string;
    this.logger.debug('Groq API response received', { length: text.length });
    return text;
  }

  getQuestions() {
    return ASSESSMENT_QUESTIONS;
  }

  async startSession(userId: string) {
    const session = await this.prisma.assessmentSession.create({
      data: {
        userId,
        status: 'IN_PROGRESS',
        answers: [],
      },
    });
    return { sessionId: session.id };
  }

  async completeSession(
    userId: string,
    sessionId: string,
    answers: { questionId: number; answer: string }[],
  ) {
    // Validate session ownership
    const session = await this.prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Return cached report if already completed
    if (session.status === 'COMPLETED' && session.report) {
      return { report: session.report };
    }

    // Validate all 15 answers present
    if (answers.length !== 15) {
      throw new BadRequestException('All 15 answers are required');
    }

    const questionIds = answers.map((a) => a.questionId);
    for (let i = 1; i <= 15; i++) {
      if (!questionIds.includes(i)) {
        throw new BadRequestException(`Missing answer for question ${i}`);
      }
    }

    // Get user profile
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    // Build formatted answers string
    const formattedAnswers = answers.map((a) => {
      const question = ASSESSMENT_QUESTIONS.find((q) => q.id === a.questionId);
      if (!question) return '';
      const option = question.options.find((o) => o.value === a.answer);
      return `Q${a.questionId} [${question.category}]: "${question.en}" → ${a.answer}: "${option?.en ?? a.answer}"`;
    }).join('\n');

    const firstName = userProfile?.firstName ?? 'User';
    const lastName = userProfile?.lastName ?? '';
    const country = userProfile?.country ?? 'Arab region';

    const prompt = `You are a professional career advisor for DeveWay platform.
Analyze the user's assessment answers and return ONLY valid JSON with NO markdown,
NO explanation, NO preamble — just the raw JSON object.

User Profile:
- Name: ${firstName} ${lastName}
- Country: ${country}

Assessment Answers:
${formattedAnswers}

Return this exact JSON structure:
{
  "topFields": [
    {
      "fieldSlug": "one of: backend|frontend|fullstack|mobile|devops|data-science|cybersecurity|ui-ux|blockchain|cloud",
      "titleAr": "Arabic title of the field",
      "titleEn": "English title",
      "confidence": 0.85,
      "reasoning": "2-3 sentences in Arabic explaining why this field suits the user",
      "skills": ["skill1", "skill2", "skill3", "skill4"]
    }
  ],
  "summary": "2-3 sentences in Arabic summarizing the user's profile",
  "recommendedPaths": ["fieldSlug1", "fieldSlug2"]
}

Rules:
- Return 3 to 5 fields in topFields, ordered by confidence descending
- confidence must be between 0.5 and 0.99
- reasoning must be in Arabic, 1-2 sentences, specific to answers given
- skills must be specific technical skills (not generic words)
- summary must be in Arabic
- Return ONLY the JSON object, no other text
`;

    let report: any;
    try {
      const rawText = await this.callGroq(prompt);
      report = parseAssessmentReport(rawText);
      this.logger.log('Assessment report parsed successfully', { sessionId });
    } catch (err) {
      this.logger.error('AI analysis failed', {
        sessionId,
        operation: 'completeSession',
        error: (err as Error).message,
      });

      // Mark session as FAILED so the user can retry
      await this.prisma.assessmentSession.update({
        where: { id: sessionId },
        data: {
          answers: answers as any,
          status: 'FAILED',
        },
      }).catch(() => {});

      // Return graceful degraded response instead of throwing 500
      return {
        status: 'processing',
        message: 'Assessment analysis is temporarily unavailable. Please try again in a moment.',
        retryAfter: 60,
      };
    }

    // Save completed report to DB
    await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        answers: answers as any,
        report: report as any,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return { report, status: 'COMPLETED' };
  }

  async getSessionHistory(userId: string) {
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
}
