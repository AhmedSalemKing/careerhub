import { PrismaService } from '../../prisma/prisma.service';
export declare const ASSESSMENT_QUESTIONS: {
    id: number;
    category: string;
    en: string;
    options: {
        value: string;
        en: string;
    }[];
}[];
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
        learningPath: Array<{
            month: string;
            focus: string;
            resources: string;
        }>;
        salaryRange: {
            egypt: string;
            saudi: string;
        };
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
export declare class AiAssessmentService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private callGroq;
    getQuestions(): {
        id: number;
        category: string;
        en: string;
        options: {
            value: string;
            en: string;
        }[];
    }[];
    startSession(userId: string): Promise<{
        sessionId: string;
    }>;
    completeSession(userId: string, sessionId: string, answers: {
        questionId: number;
        answer: string;
    }[]): Promise<{
        report: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        status?: undefined;
        message?: undefined;
        retryAfter?: undefined;
    } | {
        status: string;
        message: string;
        retryAfter: number;
        report?: undefined;
    } | {
        report: any;
        status: string;
        message?: undefined;
        retryAfter?: undefined;
    }>;
    getSessionHistory(userId: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        completedAt: Date;
        report: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
}
