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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackActivityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt = __importStar(require("jsonwebtoken"));
let TrackActivityMiddleware = class TrackActivityMiddleware {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async use(req, res, next) {
        var _a, _b;
        try {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
            if (token) {
                const payload = jwt.decode(token);
                const userId = (payload === null || payload === void 0 ? void 0 : payload.sub) || (payload === null || payload === void 0 ? void 0 : payload.id);
                if (userId) {
                    const action = this.mapAction(req.method, req.path);
                    if (action) {
                        this.prisma.userActivity.create({
                            data: {
                                userId,
                                action,
                                entity: this.mapEntity(req.path),
                                entityId: (_b = req.params) === null || _b === void 0 ? void 0 : _b.id,
                                ipAddress: req.ip,
                                metadata: { method: req.method, path: req.path },
                            },
                        }).catch(() => { });
                        this.prisma.user.update({
                            where: { id: userId },
                            data: { lastSeenAt: new Date() },
                        }).catch(() => { });
                    }
                }
            }
        }
        catch { }
        next();
    }
    mapAction(method, path) {
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
        if (path.includes('/admin') && method !== 'GET')
            return 'ADMIN_ACTION';
        return null;
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
        return null;
    }
};
exports.TrackActivityMiddleware = TrackActivityMiddleware;
exports.TrackActivityMiddleware = TrackActivityMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackActivityMiddleware);
//# sourceMappingURL=track-activity.middleware.js.map