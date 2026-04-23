"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const analytics_module_1 = require("../analytics/analytics.module");
const notifications_module_1 = require("../notifications/notifications.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
            platform_express_1.MulterModule.register({
                dest: './uploads/admin',
                limits: {
                    fileSize: 500 * 1024 * 1024,
                },
                fileFilter: (req, file, cb) => {
                    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
                    if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
                        cb(null, true);
                    }
                    else {
                        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
                    }
                },
            }),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map