import { PrismaService } from '../../prisma/prisma.service';
export declare class AssessmentService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    startAssessment(userId: string, careerPathId: string): Promise<{
        assessment: {
            id: string;
            createdAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            updatedAt: Date;
            expiresAt: Date;
            completedAt: Date | null;
            careerPathId: string;
            score: number | null;
            results: import("@prisma/client/runtime/library").JsonValue | null;
            startedAt: Date;
        };
        question: {
            id: string;
            questionText: string;
            questionTextAr: string;
            questionType: string;
            options: any;
            points: number;
            order: number;
        };
    }>;
    getNextQuestion(userId: string, assessmentId: string, answer?: string): Promise<{
        assessment: {
            id: string;
            createdAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            updatedAt: Date;
            expiresAt: Date;
            completedAt: Date | null;
            careerPathId: string;
            score: number | null;
            results: import("@prisma/client/runtime/library").JsonValue | null;
            startedAt: Date;
        };
        results: {
            score: number;
            level: string;
            strengths: string[];
            improvements: string[];
            fitScore: number;
            nextSteps: string[];
            recommendedCourses: {
                id: string;
                title: string;
                description: string;
                level: string;
                duration: number;
            }[];
        };
        recommendations: {
            careerPath: {
                suitable: boolean;
                confidence: number;
                message: string;
            };
            learning: {
                recommendedPace: string;
                estimatedDuration: string;
                focusAreas: string[];
            };
            nextAction: string;
        };
    } | {
        question: {
            id: string;
            questionText: string;
            questionTextAr: string;
            questionType: string;
            options: any;
            points: number;
            order: number;
        };
        progress: {
            total: number;
            answered: number;
            percentage: number;
        };
    }>;
    completeAssessment(userId: string, assessmentId: string): Promise<{
        assessment: {
            id: string;
            createdAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            updatedAt: Date;
            expiresAt: Date;
            completedAt: Date | null;
            careerPathId: string;
            score: number | null;
            results: import("@prisma/client/runtime/library").JsonValue | null;
            startedAt: Date;
        };
        results: {
            score: number;
            level: string;
            strengths: string[];
            improvements: string[];
            fitScore: number;
            nextSteps: string[];
            recommendedCourses: {
                id: string;
                title: string;
                description: string;
                level: string;
                duration: number;
            }[];
        };
        recommendations: {
            careerPath: {
                suitable: boolean;
                confidence: number;
                message: string;
            };
            learning: {
                recommendedPace: string;
                estimatedDuration: string;
                focusAreas: string[];
            };
            nextAction: string;
        };
    }>;
    getAssessment(userId: string, assessmentId: string): Promise<{
        assessment: {
            careerPath: {
                id: string;
                createdAt: Date;
                isActive: boolean;
                updatedAt: Date;
                titleEn: string;
                titleAr: string;
                slug: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                skills: string[];
                salaryRangeEn: string;
                salaryRangeAr: string;
                jobTitlesEn: string[];
                jobTitlesAr: string[];
                demandLevel: string;
                icon: string | null;
                color: string | null;
            };
            questions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                options: import("@prisma/client/runtime/library").JsonValue | null;
                order: number;
                assessmentId: string;
                questionTextEn: string;
                questionTextAr: string;
                questionType: string;
                correctAnswer: string | null;
                userAnswer: string | null;
                points: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            updatedAt: Date;
            expiresAt: Date;
            completedAt: Date | null;
            careerPathId: string;
            score: number | null;
            results: import("@prisma/client/runtime/library").JsonValue | null;
            startedAt: Date;
        };
        progress: {
            total: number;
            answered: number;
            percentage: number;
        };
    }>;
    getAssessmentHistory(userId: string, options: {
        page: number;
        limit: number;
    }): Promise<{
        assessments: ({
            careerPath: {
                id: string;
                createdAt: Date;
                isActive: boolean;
                updatedAt: Date;
                titleEn: string;
                titleAr: string;
                slug: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                skills: string[];
                salaryRangeEn: string;
                salaryRangeAr: string;
                jobTitlesEn: string[];
                jobTitlesAr: string[];
                demandLevel: string;
                icon: string | null;
                color: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.AssessmentStatus;
            updatedAt: Date;
            expiresAt: Date;
            completedAt: Date | null;
            careerPathId: string;
            score: number | null;
            results: import("@prisma/client/runtime/library").JsonValue | null;
            startedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    private generateAssessmentQuestions;
    private getQuestionTemplates;
    private getNextQuestionData;
    private saveAnswer;
    private getAssessmentProgress;
    private calculateAssessmentScore;
    private generateAssessmentResults;
    private getProficiencyLevel;
    private identifyStrengths;
    private identifyImprovements;
    private getNextSteps;
    private getRecommendedCourses;
    private generateRecommendations;
    private getFocusAreas;
}
