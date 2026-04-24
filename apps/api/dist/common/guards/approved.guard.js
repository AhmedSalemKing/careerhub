"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovedGuard = void 0;
const common_1 = require("@nestjs/common");
let ApprovedGuard = class ApprovedGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Not authenticated');
        }
        if (user.accountType === 'ADMIN' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            return true;
        }
        if (user.status === 'PENDING') {
            throw new common_1.ForbiddenException({
                statusCode: 403,
                message: 'حسابك في انتظار الموافقة',
                code: 'PENDING_APPROVAL',
            });
        }
        if (user.status === 'BANNED' || user.status === 'REJECTED') {
            throw new common_1.ForbiddenException({
                statusCode: 403,
                message: 'تم رفض حسابك أو تعليقه',
                code: 'ACCOUNT_REJECTED',
            });
        }
        return true;
    }
};
exports.ApprovedGuard = ApprovedGuard;
exports.ApprovedGuard = ApprovedGuard = __decorate([
    (0, common_1.Injectable)()
], ApprovedGuard);
//# sourceMappingURL=approved.guard.js.map