"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const courses_controller_1 = require("./courses.controller");
const courses_service_1 = require("./courses.service");
const enrollment_service_1 = require("./enrollment.service");
const progress_service_1 = require("./progress.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const notifications_module_1 = require("../notifications/notifications.module");
let CoursesModule = class CoursesModule {
};
exports.CoursesModule = CoursesModule;
exports.CoursesModule = CoursesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            notifications_module_1.NotificationsModule,
            bull_1.BullModule.registerQueue({ name: 'certificates' }),
        ],
        controllers: [courses_controller_1.CoursesController],
        providers: [courses_service_1.CoursesService, enrollment_service_1.EnrollmentService, progress_service_1.ProgressService],
        exports: [courses_service_1.CoursesService, enrollment_service_1.EnrollmentService, progress_service_1.ProgressService],
    })
], CoursesModule);
