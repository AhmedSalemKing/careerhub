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
var TrackActivityMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackActivityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt = __importStar(require("jsonwebtoken"));
const ROUTE_ACTIONS = [
    { pattern: /\/api\/auth\/login$/, action: 'LOGIN', method: 'POST' },
    { pattern: /\/api\/auth\/register$/, action: 'REGISTER', method: 'POST' },
    { pattern: /\/api\/courses\/[^/]+\/enroll/, action: 'ENROLL_COURSE', method: 'POST' },
    { pattern: /\/api\/courses\/search/, action: 'SEARCH_COURSES', method: 'GET' },
    { pattern: /\/api\/courses$/, action: 'VIEW_COURSES', method: 'GET' },
    { pattern: /\/api\/courses\/[^/]+$/, action: 'VIEW_COURSE', method: 'GET' },
    { pattern: /\/api\/payment\/create/, action: 'PAYMENT', method: 'POST' },
    { pattern: /\/api\/wallet\/topup/, action: 'WALLET_TOPUP', method: 'POST' },
    { pattern: /\/api\/certificates/, action: 'VIEW_CERTIFICATE', method: 'GET' },
    { pattern: /\/api\/sessions\/book/, action: 'BOOK_SESSION', method: 'POST' },
    { pattern: /\/api\/ai\/chat/, action: 'AI_CHAT', method: 'POST' },
    { pattern: /\/api\/career\/assessment/, action: 'ASSESSMENT', method: 'POST' },
    { pattern: /\/api\/users\/track-activity/, action: 'TRACK_ACTIVITY', method: 'POST' },
    { pattern: /\/api\/lessons\/[^/]+\/complete/, action: 'COMPLETE_LESSON', method: 'POST' },
];
let TrackActivityMiddleware = TrackActivityMiddleware_1 = class TrackActivityMiddleware {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TrackActivityMiddleware_1.name);
    }
    async use(req, res, next) {
        var _a, _b, _c, _d, _e, _f;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (token) {
            try {
                const payload = jwt.decode(token);
                const userId = (payload === null || payload === void 0 ? void 0 : payload.sub) || (payload === null || payload === void 0 ? void 0 : payload.id);
                if (userId) {
                    const path = req.path;
                    const method = req.method;
                    const tracked = ROUTE_ACTIONS.find(r => {
                        const methodMatch = !r.method || r.method === method;
                        return r.pattern.test(path) && methodMatch;
                    });
                    if (tracked) {
                        const metadata = {};
                        if ((_b = req.params) === null || _b === void 0 ? void 0 : _b.id)
                            metadata.resourceId = req.params.id;
                        if ((_c = req.params) === null || _c === void 0 ? void 0 : _c.courseId)
                            metadata.courseId = req.params.courseId;
                        if ((_d = req.query) === null || _d === void 0 ? void 0 : _d.q)
                            metadata.query = req.query.q;
                        if ((_e = req.body) === null || _e === void 0 ? void 0 : _e.amount)
                            metadata.amount = req.body.amount;
                        try {
                            await this.prisma.userActivity.create({
                                data: {
                                    userId,
                                    action: tracked.action,
                                    entity: this.mapEntity(path),
                                    entityId: (_f = req.params) === null || _f === void 0 ? void 0 : _f.id,
                                    ipAddress: req.ip,
                                    metadata: Object.keys(metadata).length ? metadata : undefined,
                                },
                            });
                            this.logger.log(`[Activity] ${tracked.action} logged for user ${userId}`);
                        }
                        catch (e) {
                            this.logger.error(`[Activity] Failed to log: ${e.message}`);
                        }
                        try {
                            await this.prisma.user.update({
                                where: { id: userId },
                                data: { lastSeenAt: new Date() },
                            });
                        }
                        catch { }
                    }
                }
            }
            catch (e) {
                this.logger.warn(`[Activity] Middleware error: ${e.message}`);
            }
        }
        next();
    }
    mapEntity(path) {
        if (path.includes('/courses'))
            return 'Course';
        if (path.includes('/sessions'))
            return 'Session';
        if (path.includes('/payment'))
            return 'Payment';
        if (path.includes('/users'))
            return 'User';
        if (path.includes('/lessons'))
            return 'Lesson';
        if (path.includes('/certificates'))
            return 'Certificate';
        return null;
    }
};
exports.TrackActivityMiddleware = TrackActivityMiddleware;
exports.TrackActivityMiddleware = TrackActivityMiddleware = TrackActivityMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackActivityMiddleware);
//# sourceMappingURL=track-activity.middleware.js.map