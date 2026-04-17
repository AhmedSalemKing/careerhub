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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const activity_service_1 = require("./activity.service");
const activity_gateway_1 = require("./activity.gateway");
function resolveAction(method, url) {
    var _a, _b;
    const path = url.split('?')[0];
    const lower = path.toLowerCase();
    if (lower.includes('/auth/login'))
        return { action: 'user.login' };
    if (lower.includes('/auth/logout'))
        return { action: 'user.logout' };
    if (lower.includes('/auth/register'))
        return { action: 'user.register' };
    if (lower.includes('/auth/refresh'))
        return { action: 'user.token_refresh' };
    if (lower.includes('/auth/forgot-password'))
        return { action: 'user.forgot_password' };
    if (lower.includes('/auth/reset-password'))
        return { action: 'user.password_reset' };
    if (lower.includes('/payment') && method === 'POST')
        return { action: 'payment.created', entity: 'Payment' };
    if (lower.includes('/payment') && lower.includes('/webhook'))
        return { action: 'payment.webhook', entity: 'Payment' };
    if (lower.includes('/courses') && method === 'POST')
        return { action: 'course.created', entity: 'Course' };
    if (lower.includes('/courses') && method === 'PATCH')
        return { action: 'course.updated', entity: 'Course' };
    if (lower.includes('/courses') && method === 'DELETE')
        return { action: 'course.deleted', entity: 'Course' };
    if (lower.includes('/enroll') && method === 'POST')
        return { action: 'course.enrolled', entity: 'Enrollment' };
    if (lower.includes('/lessons') && method === 'POST')
        return { action: 'lesson.created', entity: 'Lesson' };
    if (lower.includes('/progress') && method === 'POST')
        return { action: 'lesson.progress_updated', entity: 'LessonProgress' };
    if (lower.includes('/upload') && method === 'POST')
        return { action: 'file.uploaded', entity: 'File' };
    if (lower.includes('/sessions') && method === 'POST')
        return { action: 'session.created', entity: 'Session' };
    if (lower.includes('/sessions') && method === 'PATCH')
        return { action: 'session.updated', entity: 'Session' };
    if (lower.includes('/coaching') && method === 'POST')
        return { action: 'coaching.booked', entity: 'CoachingSession' };
    if (lower.includes('/certificates') && method === 'GET')
        return { action: 'certificate.viewed', entity: 'Certificate' };
    if (lower.includes('/super-admin/users') && method === 'POST')
        return { action: 'admin.user_created', entity: 'User' };
    if (lower.includes('/super-admin/users') && lower.includes('/role'))
        return { action: 'admin.role_changed', entity: 'User' };
    if (lower.includes('/super-admin/courses') && method === 'POST')
        return { action: 'admin.course_created', entity: 'Course' };
    if (lower.includes('/admin') && method !== 'GET') {
        const verb = method === 'POST'
            ? 'created'
            : method === 'PATCH' || method === 'PUT'
                ? 'updated'
                : 'deleted';
        return { action: `admin.${verb}` };
    }
    if (lower.includes('/ai') && method === 'POST')
        return { action: 'ai.message_sent', entity: 'AiMessage' };
    if (lower.includes('/ratings') && method === 'POST')
        return { action: 'rating.submitted', entity: 'Rating' };
    if (method === 'GET')
        return { action: '' };
    const segments = path.split('/').filter((s) => s && s !== 'api');
    const resource = (_a = segments[0]) !== null && _a !== void 0 ? _a : 'api';
    const verbMap = {
        POST: 'created',
        PUT: 'updated',
        PATCH: 'updated',
        DELETE: 'deleted',
    };
    return {
        action: `${resource}.${(_b = verbMap[method]) !== null && _b !== void 0 ? _b : method.toLowerCase()}`,
        entity: resource.charAt(0).toUpperCase() + resource.slice(1),
    };
}
const SKIP_ACTIONS = new Set(['', 'user.token_refresh']);
let ActivityInterceptor = class ActivityInterceptor {
    constructor(activityService, activityGateway) {
        this.activityService = activityService;
        this.activityGateway = activityGateway;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        return next.handle().pipe((0, rxjs_1.tap)(async () => {
            var _a, _b, _c, _d, _e, _f;
            const user = req.user;
            if (!(user === null || user === void 0 ? void 0 : user.id))
                return;
            const { action, entity } = resolveAction(req.method, (_a = req.url) !== null && _a !== void 0 ? _a : '');
            if (SKIP_ACTIONS.has(action))
                return;
            const ip = req.headers['x-forwarded-for'] ||
                req.ip ||
                ((_b = req.connection) === null || _b === void 0 ? void 0 : _b.remoteAddress) ||
                '0.0.0.0';
            const name = [(_c = user.profile) === null || _c === void 0 ? void 0 : _c.firstName, (_d = user.profile) === null || _d === void 0 ? void 0 : _d.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() || user.email;
            try {
                await this.activityService.log({
                    userId: user.id,
                    action,
                    entity,
                    ip: Array.isArray(ip) ? ip[0] : String(ip).split(',')[0].trim(),
                    userAgent: (_e = req.headers['user-agent']) !== null && _e !== void 0 ? _e : '',
                    metadata: {
                        method: req.method,
                        url: req.url,
                        statusCode: (_f = req.res) === null || _f === void 0 ? void 0 : _f.statusCode,
                    },
                });
                this.activityGateway.broadcastActivity({
                    userId: user.id,
                    action,
                    entity,
                    user: {
                        email: user.email,
                        accountType: user.accountType,
                        name,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            catch {
            }
        }));
    }
};
exports.ActivityInterceptor = ActivityInterceptor;
exports.ActivityInterceptor = ActivityInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [activity_service_1.ActivityService,
        activity_gateway_1.ActivityGateway])
], ActivityInterceptor);
//# sourceMappingURL=activity.interceptor.js.map