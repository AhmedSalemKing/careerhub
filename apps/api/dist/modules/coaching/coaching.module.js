"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachingModule = void 0;
const common_1 = require("@nestjs/common");
const coaching_controller_1 = require("./coaching.controller");
const coaching_service_1 = require("./coaching.service");
const scheduling_service_1 = require("./scheduling.service");
const zoom_service_1 = require("./zoom.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const notifications_module_1 = require("../notifications/notifications.module");
let CoachingModule = class CoachingModule {
};
exports.CoachingModule = CoachingModule;
exports.CoachingModule = CoachingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, notifications_module_1.NotificationsModule],
        controllers: [coaching_controller_1.CoachingController],
        providers: [coaching_service_1.CoachingService, zoom_service_1.ZoomService, scheduling_service_1.SchedulingService],
        exports: [coaching_service_1.CoachingService, zoom_service_1.ZoomService, scheduling_service_1.SchedulingService],
    })
], CoachingModule);
//# sourceMappingURL=coaching.module.js.map