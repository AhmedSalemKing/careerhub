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
exports.ActivityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const activity_service_1 = require("../modules/activity/activity.service");
const jwt_1 = require("@nestjs/jwt");
let ActivityMiddleware = class ActivityMiddleware {
    constructor(activityService, jwtService) {
        this.activityService = activityService;
        this.jwtService = jwtService;
    }
    async use(req, res, next) {
        var _a, _b, _c;
        try {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
            if (token) {
                const payload = this.jwtService.verify(token, {
                    secret: process.env.JWT_SECRET,
                });
                if (payload === null || payload === void 0 ? void 0 : payload.sub) {
                    const action = this.getAction(req.method, req.path);
                    if (action) {
                        await this.activityService.log({
                            userId: payload.sub,
                            action,
                            entity: (_b = this.getEntity(req.path)) !== null && _b !== void 0 ? _b : undefined,
                            entityId: (_c = req.params) === null || _c === void 0 ? void 0 : _c.id,
                            ip: req.ip,
                            userAgent: req.headers['user-agent'],
                            metadata: {
                                method: req.method,
                                path: req.path,
                            },
                        });
                    }
                }
            }
        }
        catch { }
        next();
    }
    getAction(method, path) {
        if (path.includes('/auth/login'))
            return 'LOGIN';
        if (path.includes('/auth/register'))
            return 'REGISTER';
        if (path.includes('/courses') && method === 'POST')
            return 'CREATE_COURSE';
        if (path.includes('/courses') && method === 'GET')
            return 'VIEW_COURSES';
        if (path.includes('/payment'))
            return 'PAYMENT';
        if (path.includes('/upload'))
            return 'UPLOAD';
        if (path.includes('/sessions') && method === 'POST')
            return 'BOOK_SESSION';
        if (path.includes('/certificates'))
            return 'VIEW_CERTIFICATE';
        if (path.includes('/ai/chat'))
            return 'AI_CHAT';
        if (path.includes('/career/assessment'))
            return 'ASSESSMENT';
        if (path.includes('/admin'))
            return 'ADMIN_ACTION';
        return null;
    }
    getEntity(path) {
        if (path.includes('/courses'))
            return 'Course';
        if (path.includes('/sessions'))
            return 'Session';
        if (path.includes('/payment'))
            return 'Payment';
        if (path.includes('/users'))
            return 'User';
        if (path.includes('/certificates'))
            return 'Certificate';
        return null;
    }
};
exports.ActivityMiddleware = ActivityMiddleware;
exports.ActivityMiddleware = ActivityMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [activity_service_1.ActivityService,
        jwt_1.JwtService])
], ActivityMiddleware);
//# sourceMappingURL=activity.middleware.js.map