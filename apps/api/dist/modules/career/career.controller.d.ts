import { CareerService } from './career.service';
import { AssessmentService } from './assessment.service';
import { AiAssessmentService } from './ai-assessment.service';
import { User } from '@prisma/client';
export declare class CareerController {
    private readonly careerService;
    private readonly assessmentService;
    private readonly aiAssessmentService;
    constructor(careerService: CareerService, assessmentService: AssessmentService, aiAssessmentService: AiAssessmentService);
    saveMyPath(user: User, body: {
        pathId: string;
        pathTitle: string;
        pathCategory: string;
        aiRecommended?: boolean;
    }): Promise<{
        success: boolean;
        data: {
            path: {
                id: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                pathId: string;
                pathTitle: string;
                pathCategory: string;
                aiRecommended: boolean;
            };
        };
    }>;
    getMyPath(user: User): Promise<{
        success: boolean;
        data: {
            path: {
                id: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                pathId: string;
                pathTitle: string;
                pathCategory: string;
                aiRecommended: boolean;
            };
        };
    }>;
    getCareerPaths(language?: string): Promise<{
        success: boolean;
        data: {
            careerPaths: any;
        };
    }>;
    getCareerPathBySlug(slug: string, language?: string): Promise<{
        success: boolean;
        data: {
            careerPath: {
                id: string;
                slug: string;
                title: string;
                description: string;
                skills: any;
                salaryRange: any;
                jobTitles: any;
                demandLevel: string;
                icon: string;
                color: string;
                courses: any;
                stats: {
                    totalCourses: number;
                    totalAssessments: number;
                    averageDuration: number;
                    averagePrice: number;
                };
                marketData: {
                    demandLevel: string;
                    growthRate: string;
                    averageSalary: {
                        egypt: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                        saudi: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                    };
                    topCompanies: string[];
                    requiredSkills: string[];
                };
            };
        };
    }>;
    getAiQuestions(): Promise<{
        success: boolean;
        data: {
            questions: {
                id: number;
                category: string;
                en: string;
                options: {
                    value: string;
                    en: string;
                }[];
            }[];
        };
    }>;
    startAiSession(user: User): Promise<{
        success: boolean;
        data: {
            sessionId: string;
        };
    }>;
    completeAiSession(user: User, sessionId: string, answers: {
        questionId: number;
        answer: string;
    }[]): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getAiSessionHistory(user: User): Promise<{
        success: boolean;
        data: {
            sessions: {
                id: string;
                createdAt: Date;
                status: string;
                completedAt: Date;
                report: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
    }>;
    startAssessment(user: User, careerPathId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            assessment: {
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
            };
        };
    }>;
    getNextQuestion(user: User, assessmentId: string, answer?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    completeAssessment(user: User, assessmentId: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getAssessment(user: User, assessmentId: string): Promise<{
        success: boolean;
        data: {
            assessment: {
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
            };
        };
    }>;
    getAssessmentHistory(user: User, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getCareerPathCourses(slug: string, language?: string, level?: string): Promise<{
        success: boolean;
        data: {
            courses: {
                id: string;
                slug: string;
                title: string;
                description: string;
                thumbnail: string;
                price: number;
                currency: string;
                duration: number;
                level: string;
                isFeatured: boolean;
                modulesCount: any;
                enrollments: any;
                certificates: any;
            }[];
        };
    }>;
    getCareerPathStatistics(slug: string): Promise<{
        success: boolean;
        data: {
            statistics: {
                totalEnrollments: any;
                totalCertificates: any;
                totalAssessments: number;
                completedAssessments: number;
                averageScore: number;
                completionRate: number;
                assessmentCompletionRate: number;
            };
        };
    }>;
    getRecommendations(user: User): Promise<{
        success: boolean;
        data: {
            recommendations: ({
                type: string;
                title: string;
                description: string;
                matchScore: number;
                reasons: string[];
                nextSteps: string[];
                skills?: undefined;
                recommendedCourses?: undefined;
            } | {
                type: string;
                title: string;
                description: string;
                matchScore: number;
                skills: {
                    name: string;
                    level: string;
                }[];
                recommendedCourses: string[];
                reasons?: undefined;
                nextSteps?: undefined;
            })[];
        };
    }>;
    getSkills(search?: string): Promise<{
        success: boolean;
        data: {
            skills: any[];
        };
    }>;
    getMarketInsights(country?: string, careerPath?: string): Promise<{
        success: boolean;
        data: {
            insights: {
                trends: {
                    skill: string;
                    growth: string;
                    demand: string;
                    description: string;
                }[];
                salaryRanges: {
                    'Software Engineering': {
                        egypt: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                        saudi: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                    };
                    'Data Science': {
                        egypt: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                        saudi: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                    };
                    Cybersecurity: {
                        egypt: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                        saudi: {
                            min: number;
                            max: number;
                            currency: string;
                        };
                    };
                };
                jobMarket: {
                    totalOpenings: number;
                    growthRate: string;
                    topIndustries: string[];
                };
            };
        };
    }>;
    compareCareerPaths(paths: string[], language?: string): Promise<{
        success: boolean;
        data: {
            comparison: {
                paths: {
                    id: string;
                    slug: string;
                    title: string;
                    skills: any;
                    salaryRange: any;
                    jobTitles: any;
                    demandLevel: string;
                    stats: {
                        totalCourses: any;
                        totalEnrollments: any;
                        totalCertificates: any;
                        averagePrice: number;
                        averageDuration: number;
                    };
                }[];
                insights: ({
                    type: string;
                    title: string;
                    description: string;
                    data: {
                        best: any;
                        salaryRange: any;
                        highest?: undefined;
                    };
                } | {
                    type: string;
                    title: string;
                    description: string;
                    data: {
                        highest: any;
                        best?: undefined;
                        salaryRange?: undefined;
                    };
                })[];
            };
        };
    }>;
    getCareerPathRoadmap(slug: string, language?: string): Promise<{
        success: boolean;
        data: {
            roadmap: {
                careerPath: {
                    id: string;
                    title: string;
                    description: string;
                };
                phases: {
                    id: string;
                    title: string;
                    description: string;
                    courses: {
                        id: any;
                        title: any;
                        duration: any;
                        modules: any;
                    }[];
                    estimatedDuration: any;
                }[];
                timeline: {
                    totalDuration: any;
                    estimatedWeeks: number;
                    estimatedMonths: number;
                    recommendedPace: string;
                };
                milestones: {
                    id: string;
                    title: string;
                    description: string;
                    estimatedTime: string;
                    icon: string;
                }[];
            };
        };
    }>;
}
