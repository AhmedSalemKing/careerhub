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
var CareerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CareerService = CareerService_1 = class CareerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CareerService_1.name);
        this.cacheTtlMs = 30_000;
        this.cache = new Map();
    }
    async saveUserCareerPath(userId, data) {
        return this.prisma.userCareerPath.upsert({
            where: { userId },
            create: {
                userId,
                pathId: data.pathId,
                pathTitle: data.pathTitle,
                pathCategory: data.pathCategory,
                aiRecommended: data.aiRecommended ?? false,
            },
            update: {
                pathId: data.pathId,
                pathTitle: data.pathTitle,
                pathCategory: data.pathCategory,
                aiRecommended: data.aiRecommended ?? false,
            },
        });
    }
    async getUserCareerPath(userId) {
        return this.prisma.userCareerPath.findUnique({ where: { userId } });
    }
    async getCareerPaths(language = 'en') {
        const cacheKey = `career_paths:${language}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        const careerPaths = await this.prisma.careerPath.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                slug: true,
                titleEn: true,
                titleAr: true,
                icon: true,
                color: true,
                demandLevel: true,
            },
        });
        // Transform based on language
        const data = careerPaths.map(path => ({
            id: path.id,
            slug: path.slug,
            title: language === 'ar' ? path.titleAr : path.titleEn,
            demandLevel: path.demandLevel,
            icon: path.icon,
            color: path.color,
        }));
        this.cache.set(cacheKey, {
            expiresAt: Date.now() + this.cacheTtlMs,
            data,
        });
        return data;
    }
    async getCareerPathBySlug(slug, language = 'en') {
        const careerPath = await this.prisma.careerPath.findUnique({
            where: { slug, isActive: true },
            include: {
                courses: {
                    where: { status: 'PUBLISHED' },
                    include: {
                        modules: {
                            include: {
                                _count: {
                                    select: {
                                        lessons: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                enrollments: true,
                                certificates: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        courses: true,
                        careerAssessments: true,
                    },
                },
            },
        });
        if (!careerPath) {
            throw new common_1.NotFoundException('Career path not found');
        }
        // Get market data
        const marketData = await this.getMarketDataForCareerPath(careerPath.id);
        return {
            id: careerPath.id,
            slug: careerPath.slug,
            title: language === 'ar' ? careerPath.titleAr : careerPath.titleEn,
            description: language === 'ar' ? careerPath.descriptionAr : careerPath.descriptionEn,
            skills: careerPath.skills,
            salaryRange: JSON.parse(language === 'ar' ? careerPath.salaryRangeAr : careerPath.salaryRangeEn),
            jobTitles: careerPath.jobTitlesEn,
            demandLevel: careerPath.demandLevel,
            icon: careerPath.icon,
            color: careerPath.color,
            courses: careerPath.courses.map(course => ({
                id: course.id,
                slug: course.slug,
                title: language === 'ar' ? course.titleAr : course.titleEn,
                description: language === 'ar' ? course.descriptionAr : course.descriptionEn,
                thumbnail: course.thumbnail,
                price: course.price,
                currency: course.currency,
                duration: course.duration,
                level: course.level,
                isFeatured: course.isFeatured,
                modulesCount: course.modules.reduce((sum, module) => sum + module._count.lessons, 0),
                enrollments: course._count?.enrollments,
                certificates: course._count?.certificates,
            })),
            stats: {
                totalCourses: 0,
                totalAssessments: 0,
                averageDuration: this.calculateAverageDuration(careerPath.courses),
                averagePrice: this.calculateAveragePrice(careerPath.courses),
            },
            marketData,
        };
    }
    async getCareerPathCourses(slug, language = 'en', level) {
        const careerPath = await this.prisma.careerPath.findUnique({
            where: { slug, isActive: true },
        });
        if (!careerPath) {
            throw new common_1.NotFoundException('Career path not found');
        }
        const where = {
            careerPathId: careerPath.id,
            status: 'PUBLISHED',
            ...(level && { level }),
        };
        const courses = await this.prisma.course.findMany({
            where,
            include: {
                modules: {
                    include: {
                        _count: {
                            select: {
                                lessons: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        certificates: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return courses.map(course => ({
            id: course.id,
            slug: course.slug,
            title: language === 'ar' ? course.titleAr : course.titleEn,
            description: language === 'ar' ? course.descriptionAr : course.descriptionEn,
            thumbnail: course.thumbnail,
            price: course.price,
            currency: course.currency,
            duration: course.duration,
            level: course.level,
            isFeatured: course.isFeatured,
            modulesCount: course.modules.reduce((sum, module) => sum + module._count.lessons, 0),
            enrollments: course._count?.enrollments,
            certificates: course._count?.certificates,
        }));
    }
    async getCareerPathStatistics(slug) {
        const careerPath = await this.prisma.careerPath.findUnique({
            where: { slug, isActive: true },
            include: {
                courses: {
                    include: {
                        enrollments: true,
                        certificates: true,
                    },
                },
                careerAssessments: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!careerPath) {
            throw new common_1.NotFoundException('Career path not found');
        }
        const totalEnrollments = careerPath.courses.reduce((sum, course) => sum + course._count?.enrollments, 0);
        const totalCertificates = careerPath.courses.reduce((sum, course) => sum + course._count?.certificates, 0);
        const completedAssessments = careerPath.careerAssessments.filter(assessment => assessment.status === 'COMPLETED').length;
        const averageScore = careerPath.careerAssessments
            .filter(assessment => assessment.score !== null)
            .reduce((sum, assessment) => sum + assessment.score, 0) /
            careerPath.careerAssessments.filter(assessment => assessment.score !== null).length || 0;
        return {
            totalEnrollments,
            totalCertificates,
            totalAssessments: careerPath.careerAssessments.length,
            completedAssessments,
            averageScore: Math.round(averageScore),
            completionRate: totalEnrollments > 0 ? (totalCertificates / totalEnrollments) * 100 : 0,
            assessmentCompletionRate: careerPath.careerAssessments.length > 0
                ? (completedAssessments / careerPath.careerAssessments.length) * 100
                : 0,
        };
    }
    async getRecommendations(userId) {
        // Get user's completed assessments
        const userAssessments = await this.prisma.careerAssessment.findMany({
            where: {
                userId,
                status: 'COMPLETED',
                score: { not: null },
            },
            include: {
                careerPath: true,
            },
            orderBy: { completedAt: 'desc' },
        });
        // Get user's enrollments
        const userEnrollments = await this.prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        careerPath: true,
                    },
                },
            },
        });
        // Get user's profile for demographic-based recommendations
        const userProfile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });
        // Generate recommendations based on assessment results, current enrollments, and profile
        const recommendations = await this.generateRecommendations(userAssessments, userEnrollments, userProfile);
        return recommendations;
    }
    async getSkills(search) {
        const where = search
            ? { isActive: true }
            : { isActive: true };
        const careerPaths = await this.prisma.careerPath.findMany({
            where,
            select: { skills: true },
        });
        // Extract and deduplicate all skills
        const allSkills = careerPaths.flatMap(path => path.skills);
        const uniqueSkills = [...new Set(allSkills)];
        // Filter by search term if provided
        const filteredSkills = search
            ? uniqueSkills.filter(skill => skill.toLowerCase().includes(search.toLowerCase()))
            : uniqueSkills;
        return filteredSkills.sort();
    }
    async getMarketInsights(country, careerPath) {
        // Mock market insights - in a real app, this would come from external APIs or analytics
        const insights = {
            trends: [
                {
                    skill: 'Artificial Intelligence',
                    growth: '+45%',
                    demand: 'HIGH',
                    description: 'AI skills are in high demand across all industries',
                },
                {
                    skill: 'Cloud Computing',
                    growth: '+38%',
                    demand: 'HIGH',
                    description: 'Cloud expertise continues to be crucial for digital transformation',
                },
                {
                    skill: 'Cybersecurity',
                    growth: '+52%',
                    demand: 'VERY_HIGH',
                    description: 'Security professionals are needed more than ever',
                },
            ],
            salaryRanges: {
                'Software Engineering': {
                    egypt: { min: 15000, max: 45000, currency: 'EGP' },
                    saudi: { min: 2500, max: 8000, currency: 'SAR' },
                },
                'Data Science': {
                    egypt: { min: 18000, max: 55000, currency: 'EGP' },
                    saudi: { min: 3000, max: 9500, currency: 'SAR' },
                },
                'Cybersecurity': {
                    egypt: { min: 20000, max: 60000, currency: 'EGP' },
                    saudi: { min: 3500, max: 10000, currency: 'SAR' },
                },
            },
            jobMarket: {
                totalOpenings: 15420,
                growthRate: '+12%',
                topIndustries: [
                    'Technology',
                    'Finance',
                    'Healthcare',
                    'E-commerce',
                    'Telecommunications',
                ],
            },
        };
        return insights;
    }
    async compareCareerPaths(paths, language = 'en') {
        const careerPaths = await this.prisma.careerPath.findMany({
            where: {
                slug: { in: paths },
                isActive: true,
            },
            include: {
                courses: {
                    include: {
                        _count: {
                            select: {
                                enrollments: true,
                                certificates: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        courses: true,
                        careerAssessments: true,
                    },
                },
            },
        });
        if (careerPaths.length !== paths.length) {
            throw new common_1.NotFoundException('One or more career paths not found');
        }
        const comparison = careerPaths.map(path => ({
            id: path.id,
            slug: path.slug,
            title: language === 'ar' ? path.titleAr : path.titleEn,
            skills: path.skills,
            salaryRange: JSON.parse(language === 'ar' ? path.salaryRangeAr : path.salaryRangeEn),
            jobTitles: path.jobTitlesEn,
            demandLevel: path.demandLevel,
            stats: {
                totalCourses: path._count.courses,
                totalEnrollments: path.courses.reduce((sum, course) => sum + course._count?.enrollments, 0),
                totalCertificates: path.courses.reduce((sum, course) => sum + course._count?.certificates, 0),
                averagePrice: this.calculateAveragePrice(path.courses),
                averageDuration: this.calculateAverageDuration(path.courses),
            },
        }));
        return {
            paths: comparison,
            insights: this.generateComparisonInsights(comparison),
        };
    }
    async getCareerPathRoadmap(slug, language = 'en') {
        const careerPath = await this.prisma.careerPath.findUnique({
            where: { slug, isActive: true },
            include: {
                courses: {
                    where: { status: 'PUBLISHED' },
                    include: {
                        modules: {
                            include: {
                                lessons: {
                                    orderBy: { createdAt: 'asc' },
                                },
                            },
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!careerPath) {
            throw new common_1.NotFoundException('Career path not found');
        }
        const roadmap = {
            careerPath: {
                id: careerPath.id,
                title: language === 'ar' ? careerPath.titleAr : careerPath.titleEn,
                description: language === 'ar' ? careerPath.descriptionAr : careerPath.descriptionEn,
            },
            phases: this.generateRoadmapPhases(careerPath.courses, language),
            timeline: this.generateTimeline(careerPath.courses),
            milestones: this.generateMilestones(careerPath.courses, language),
        };
        return roadmap;
    }
    async getMarketDataForCareerPath(careerPathId) {
        // Mock market data - in a real app, this would come from external APIs
        return {
            demandLevel: 'HIGH',
            growthRate: '+15%',
            averageSalary: {
                egypt: { min: 15000, max: 45000, currency: 'EGP' },
                saudi: { min: 2500, max: 8000, currency: 'SAR' },
            },
            topCompanies: [
                'Microsoft',
                'Google',
                'Amazon',
                'IBM',
                'Oracle',
            ],
            requiredSkills: [
                'Problem Solving',
                'Communication',
                'Teamwork',
                'Adaptability',
                'Leadership',
            ],
        };
    }
    calculateAverageDuration(courses) {
        if (courses.length === 0)
            return 0;
        const totalDuration = courses.reduce((sum, course) => sum + course.duration, 0);
        return Math.round(totalDuration / courses.length);
    }
    calculateAveragePrice(courses) {
        if (courses.length === 0)
            return 0;
        const totalPrice = courses.reduce((sum, course) => sum + course.price, 0);
        return Math.round((totalPrice / courses.length) * 100) / 100;
    }
    async generateRecommendations(assessments, enrollments, profile) {
        // Mock recommendation logic - in a real app, this would use AI/ML
        const recommendations = [
            {
                type: 'career_path',
                title: 'Software Engineering',
                description: 'Based on your assessment results and current progress',
                matchScore: 85,
                reasons: [
                    'Strong analytical skills demonstrated',
                    'Completed relevant courses',
                    'High interest in technology',
                ],
                nextSteps: [
                    'Complete advanced JavaScript course',
                    'Build portfolio projects',
                    'Get certified in cloud technologies',
                ],
            },
            {
                type: 'skill_gap',
                title: 'Cloud Computing Skills',
                description: 'Important skills to develop for your career growth',
                matchScore: 75,
                skills: [
                    { name: 'AWS', level: 'BEGINNER' },
                    { name: 'Docker', level: 'BEGINNER' },
                    { name: 'Kubernetes', level: 'INTERMEDIATE' },
                ],
                recommendedCourses: [
                    'AWS Fundamentals',
                    'Docker Essentials',
                    'Kubernetes for Beginners',
                ],
            },
        ];
        return recommendations;
    }
    generateComparisonInsights(comparison) {
        // Generate insights based on the comparison
        const insights = [
            {
                type: 'salary',
                title: 'Highest Earning Potential',
                description: `${comparison[0].title} offers the highest salary range`,
                data: {
                    best: comparison[0].title,
                    salaryRange: comparison[0].salaryRange,
                },
            },
            {
                type: 'demand',
                title: 'Most In-Demand',
                description: `Current market demand analysis`,
                data: {
                    highest: comparison.reduce((prev, current) => prev.demandLevel > current.demandLevel ? prev : current).title,
                },
            },
        ];
        return insights;
    }
    generateRoadmapPhases(courses, language) {
        // Group courses into phases based on difficulty and prerequisites
        const phases = [
            {
                id: 'foundation',
                title: language === 'ar' ? 'Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ§Øª' : 'Foundation',
                description: language === 'ar' ? 'Ø§Ø¨Ø¯Ø£ Ø¨Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ§Øª' : 'Start with the fundamentals',
                courses: courses.filter(course => course.level === 'BEGINNER').map(course => ({
                    id: course.id,
                    title: language === 'ar' ? course.titleAr : course.titleEn,
                    duration: course.duration,
                    modules: course.modules.length,
                })),
                estimatedDuration: courses
                    .filter(course => course.level === 'BEGINNER')
                    .reduce((sum, course) => sum + course.duration, 0),
            },
            {
                id: 'intermediate',
                title: language === 'ar' ? 'Ø§Ù„Ù…ØªÙˆØ³Ø·' : 'Intermediate',
                description: language === 'ar' ? 'ØªØ·ÙˆÙŠØ± Ù…Ù‡Ø§Ø±Ø§ØªÙƒ' : 'Build your skills',
                courses: courses.filter(course => course.level === 'INTERMEDIATE').map(course => ({
                    id: course.id,
                    title: language === 'ar' ? course.titleAr : course.titleEn,
                    duration: course.duration,
                    modules: course.modules.length,
                })),
                estimatedDuration: courses
                    .filter(course => course.level === 'INTERMEDIATE')
                    .reduce((sum, course) => sum + course.duration, 0),
            },
            {
                id: 'advanced',
                title: language === 'ar' ? 'Ø§Ù„Ù…ØªÙ‚Ø¯Ù…' : 'Advanced',
                description: language === 'ar' ? 'Ø¥ØªÙ‚Ø§Ù† Ø§Ù„Ù…Ø¬Ø§Ù„' : 'Master the field',
                courses: courses.filter(course => course.level === 'ADVANCED').map(course => ({
                    id: course.id,
                    title: language === 'ar' ? course.titleAr : course.titleEn,
                    duration: course.duration,
                    modules: course.modules.length,
                })),
                estimatedDuration: courses
                    .filter(course => course.level === 'ADVANCED')
                    .reduce((sum, course) => sum + course.duration, 0),
            },
        ];
        return phases.filter(phase => phase.courses.length > 0);
    }
    generateTimeline(courses) {
        const totalDuration = courses.reduce((sum, course) => sum + course.duration, 0);
        const weeksNeeded = Math.ceil(totalDuration / (10 * 60)); // Assuming 10 hours per week
        return {
            totalDuration,
            estimatedWeeks: weeksNeeded,
            estimatedMonths: Math.ceil(weeksNeeded / 4),
            recommendedPace: '10 hours per week',
        };
    }
    generateMilestones(courses, language) {
        return [
            {
                id: 'first_course',
                title: language === 'ar' ? 'Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø¯ÙˆØ±Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰' : 'Complete First Course',
                description: language === 'ar' ? 'Ø£ÙƒÙ…Ù„ Ø¯ÙˆØ±ØªÙƒ Ø§Ù„Ø£ÙˆÙ„Ù‰' : 'Finish your first course',
                estimatedTime: '2-4 weeks',
                icon: 'ðŸŽ¯',
            },
            {
                id: 'foundation_complete',
                title: language === 'ar' ? 'Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©' : 'Foundation Complete',
                description: language === 'ar' ? 'Ø£ÙƒÙ…Ù„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¯ÙˆØ±Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©' : 'Complete all beginner courses',
                estimatedTime: '8-12 weeks',
                icon: 'ðŸ—ï¸',
            },
            {
                id: 'first_project',
                title: language === 'ar' ? 'Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ø£ÙˆÙ„' : 'First Project',
                description: language === 'ar' ? 'Ø£Ù†Ø´Ø¦ Ø£ÙˆÙ„ Ù…Ø´Ø±ÙˆØ¹ Ù„Ùƒ' : 'Build your first project',
                estimatedTime: '12-16 weeks',
                icon: 'ðŸ’»',
            },
            {
                id: 'intermediate_complete',
                title: language === 'ar' ? 'Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù…ØªÙˆØ³Ø·' : 'Intermediate Level',
                description: language === 'ar' ? 'ØµÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù…ØªÙˆØ³Ø·' : 'Reach intermediate level',
                estimatedTime: '20-24 weeks',
                icon: 'ðŸ“ˆ',
            },
            {
                id: 'job_ready',
                title: language === 'ar' ? 'Ø¬Ø§Ù‡Ø² Ù„Ù„Ø¹Ù…Ù„' : 'Job Ready',
                description: language === 'ar' ? 'ÙƒÙ† Ø¬Ø§Ù‡Ø²Ø§Ù‹ Ù„Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„' : 'Ready for the job market',
                estimatedTime: '30-40 weeks',
                icon: 'ðŸ’¼',
            },
        ];
    }
};
exports.CareerService = CareerService;
exports.CareerService = CareerService = CareerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CareerService);
