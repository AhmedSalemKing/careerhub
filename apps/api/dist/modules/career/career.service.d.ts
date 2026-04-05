import { PrismaService } from '../../prisma/prisma.service';
export declare class CareerService {
    private prisma;
    private readonly logger;
    private readonly cacheTtlMs;
    private readonly cache;
    constructor(prisma: PrismaService);
    saveUserCareerPath(userId: string, data: {
        pathId: string;
        pathTitle: string;
        pathCategory: string;
        aiRecommended?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        pathId: string;
        pathTitle: string;
        pathCategory: string;
        aiRecommended: boolean;
    }>;
    getUserCareerPath(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        pathId: string;
        pathTitle: string;
        pathCategory: string;
        aiRecommended: boolean;
    }>;
    getCareerPaths(language?: string): Promise<any>;
    getCareerPathBySlug(slug: string, language?: string): Promise<{
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
    }>;
    getCareerPathCourses(slug: string, language?: string, level?: string): Promise<{
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
    }[]>;
    getCareerPathStatistics(slug: string): Promise<{
        totalEnrollments: any;
        totalCertificates: any;
        totalAssessments: number;
        completedAssessments: number;
        averageScore: number;
        completionRate: number;
        assessmentCompletionRate: number;
    }>;
    getRecommendations(userId: string): Promise<({
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
    })[]>;
    getSkills(search?: string): Promise<any[]>;
    getMarketInsights(country?: string, careerPath?: string): Promise<{
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
    }>;
    compareCareerPaths(paths: string[], language?: string): Promise<{
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
    }>;
    getCareerPathRoadmap(slug: string, language?: string): Promise<{
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
    }>;
    private getMarketDataForCareerPath;
    private calculateAverageDuration;
    private calculateAveragePrice;
    private generateRecommendations;
    private generateComparisonInsights;
    private generateRoadmapPhases;
    private generateTimeline;
    private generateMilestones;
}
