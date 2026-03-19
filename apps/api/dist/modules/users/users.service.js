"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const AWS = __importStar(require("aws-sdk"));
let UsersService = UsersService_1 = class UsersService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(UsersService_1.name);
        // Initialize AWS S3
        this.s3 = new AWS.S3({
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            region: this.configService.get('AWS_REGION'),
        });
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                _count: {
                    select: {
                        enrollments: true,
                        certificates: true,
                        coachingSessions: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updatedProfile = await this.prisma.transaction(async (tx) => {
            // Update user profile
            const profile = await tx.userProfile.update({
                where: { userId },
                data: {
                    firstName: updateProfileDto.firstName || user.profile?.firstName,
                    lastName: updateProfileDto.lastName || user.profile?.lastName,
                    phone: updateProfileDto.phone,
                    dateOfBirth: updateProfileDto.dateOfBirth,
                    gender: updateProfileDto.gender,
                    nationality: updateProfileDto.nationality,
                    country: updateProfileDto.country,
                    city: updateProfileDto.city,
                    bio: updateProfileDto.bio,
                    linkedinUrl: updateProfileDto.linkedinUrl,
                    language: updateProfileDto.language,
                    timezone: updateProfileDto.timezone,
                },
            });
            return profile;
        });
        this.logger.log(`Profile updated for user: ${user.email}`);
        return updatedProfile;
    }
    async uploadAvatar(userId, file) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        // Upload to S3
        const fileName = `avatars/${userId}/${Date.now()}-${file.originalname}`;
        const uploadResult = await this.s3.upload({
            Bucket: this.configService.get('AWS_S3_BUCKET'),
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        }).promise();
        // Update user profile with avatar URL
        await this.prisma.userProfile.update({
            where: { userId },
            data: { avatar: uploadResult.Location },
        });
        this.logger.log(`Avatar uploaded for user: ${user.email}`);
        return uploadResult.Location;
    }
    async getDashboard(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                enrollments: {
                    include: {
                        course: true,
                    },
                    orderBy: { enrolledAt: 'desc' },
                    take: 5,
                },
                certificates: {
                    include: {
                        course: true,
                    },
                    orderBy: { issuedAt: 'desc' },
                    take: 3,
                },
                careerAssessments: {
                    include: {
                        careerPath: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 3,
                },
                coachingSessions: {
                    include: {
                        coach: {
                            include: {
                                user: {
                                    include: { profile: true },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                },
                notifications: {
                    where: { isRead: false },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        // Get user statistics
        const stats = await this.getUserStats(userId);
        // Get recent activity
        const recentActivity = await this.getRecentActivity(userId);
        // Get recommendations (mock for now)
        const recommendations = await this.getRecommendations(userId);
        return {
            user: this.sanitizeUser(user),
            stats,
            recentActivity,
            recommendations,
        };
    }
    async getEnrollments(userId, options) {
        const { page, limit, status } = options;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(status && { status: status }),
        };
        const [enrollments, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where,
                include: {
                    course: {
                        include: {
                            careerPath: true,
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.enrollment.count({ where }),
        ]);
        return {
            enrollments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getCertificates(userId, options) {
        const { page, limit } = options;
        const skip = (page - 1) * limit;
        const [certificates, total] = await Promise.all([
            this.prisma.certificate.findMany({
                where: { userId },
                include: {
                    course: {
                        include: {
                            careerPath: true,
                        },
                    },
                },
                orderBy: { issuedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.certificate.count({ where: { userId } }),
        ]);
        return {
            certificates,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getProgress(userId) {
        const enrollments = await this.prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        modules: {
                            include: {
                                lessons: true,
                            },
                        },
                    },
                },
            },
        });
        const progress = enrollments.map(enrollment => {
            const totalLessons = enrollment.course.modules.reduce((total, module) => total + module.lessons.length, 0);
            return {
                courseId: enrollment.courseId,
                courseTitle: enrollment.course.titleEn,
                progress: enrollment.progress,
                totalLessons,
                enrolledAt: enrollment.enrolledAt,
                completedAt: enrollment.completedAt,
                status: enrollment.status,
            };
        });
        return {
            overallProgress: this.calculateOverallProgress(enrollments),
            courses: progress,
        };
    }
    async getAchievements(userId) {
        // Mock achievements - in a real app, this would be based on actual user activity
        const achievements = [
            {
                id: 'first_course',
                title: 'First Course Completed',
                description: 'Completed your first course',
                icon: '🎓',
                earnedAt: new Date(),
            },
            {
                id: 'week_streak',
                title: '7-Day Streak',
                description: 'Learned for 7 consecutive days',
                icon: '🔥',
                earnedAt: new Date(),
            },
            {
                id: 'quiz_master',
                title: 'Quiz Master',
                description: 'Scored 100% on 5 quizzes',
                icon: '🏆',
                earnedAt: new Date(),
            },
        ];
        return achievements;
    }
    async getNotifications(userId, options) {
        const { page, limit, unread } = options;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(unread && { isRead: false }),
        };
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);
        return {
            notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async markNotificationsRead(userId, notificationIds) {
        await this.prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId,
            },
            data: { isRead: true },
        });
        this.logger.log(`Marked ${notificationIds.length} notifications as read for user: ${userId}`);
    }
    async getSettings(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            language: user.profile?.language || 'en',
            timezone: user.profile?.timezone || 'UTC',
            emailNotifications: true, // Default values
            pushNotifications: true,
            theme: 'light',
        };
    }
    async updateSettings(userId, settings) {
        await this.prisma.userProfile.update({
            where: { userId },
            data: {
                language: settings.language,
                timezone: settings.timezone,
            },
        });
        this.logger.log(`Settings updated for user: ${userId}`);
        return settings;
    }
    async deleteAccount(userId, password) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid password');
        }
        // Soft delete user
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });
        this.logger.log(`Account deleted for user: ${user.email}`);
    }
    async getStats(userId) {
        const [totalEnrollments, completedCourses, totalCertificates, totalLearningTime, upcomingSessions,] = await Promise.all([
            this.prisma.enrollment.count({
                where: { userId },
            }),
            this.prisma.enrollment.count({
                where: { userId, status: 'COMPLETED' },
            }),
            this.prisma.certificate.count({
                where: { userId },
            }),
            this.prisma.lessonProgress.aggregate({
                where: { userId },
                _sum: { timeSpent: true },
            }),
            this.prisma.coachingSession.count({
                where: {
                    userId,
                    status: 'SCHEDULED',
                    startTime: { gt: new Date() },
                },
            }),
        ]);
        return {
            totalEnrollments,
            completedCourses,
            totalCertificates,
            totalLearningTime: totalLearningTime._sum.timeSpent || 0,
            upcomingSessions,
            completionRate: totalEnrollments > 0 ? (completedCourses / totalEnrollments) * 100 : 0,
        };
    }
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    calculateOverallProgress(enrollments) {
        if (enrollments.length === 0)
            return 0;
        const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
        return totalProgress / enrollments.length;
    }
    async getUserStats(userId) {
        const [enrollmentsCount, certificatesCount, sessionsCount, assessmentsCount,] = await Promise.all([
            this.prisma.enrollment.count({ where: { userId } }),
            this.prisma.certificate.count({ where: { userId } }),
            this.prisma.coachingSession.count({ where: { userId } }),
            this.prisma.careerAssessment.count({ where: { userId } }),
        ]);
        return {
            enrollments: enrollmentsCount,
            certificates: certificatesCount,
            sessions: sessionsCount,
            assessments: assessmentsCount,
        };
    }
    async getRecentActivity(userId) {
        // Get recent activities across different entities
        const activities = [];
        // Recent enrollments
        const recentEnrollments = await this.prisma.enrollment.findMany({
            where: { userId },
            include: { course: true },
            orderBy: { enrolledAt: 'desc' },
            take: 3,
        });
        recentEnrollments.forEach(enrollment => {
            activities.push({
                type: 'enrollment',
                title: `Enrolled in ${enrollment.course.titleEn}`,
                timestamp: enrollment.enrolledAt,
                data: enrollment,
            });
        });
        // Recent lesson completions
        const recentProgress = await this.prisma.lessonProgress.findMany({
            where: { userId, status: 'COMPLETED' },
            include: {
                lesson: {
                    include: {
                        module: {
                            include: { course: true },
                        },
                    },
                },
            },
            orderBy: { completedAt: 'desc' },
            take: 3,
        });
        recentProgress.forEach(progress => {
            activities.push({
                type: 'lesson_completion',
                title: `Completed: ${progress.lesson.title}`,
                timestamp: progress.completedAt,
                data: progress,
            });
        });
        // Sort by timestamp
        return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
    }
    async getRecommendations(userId) {
        // Mock recommendations - in a real app, this would use AI/ML
        const recommendations = [
            {
                type: 'course',
                title: 'Advanced React Patterns',
                description: 'Take your React skills to the next level',
                imageUrl: 'https://example.com/course1.jpg',
                url: '/courses/advanced-react',
            },
            {
                type: 'career_path',
                title: 'Full Stack Development',
                description: 'Complete career path for becoming a full stack developer',
                imageUrl: 'https://example.com/career1.jpg',
                url: '/careers/full-stack',
            },
            {
                type: 'coaching',
                title: '1-on-1 Career Coaching',
                description: 'Get personalized guidance from industry experts',
                imageUrl: 'https://example.com/coaching1.jpg',
                url: '/coaching/book',
            },
        ];
        return recommendations;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UsersService);
