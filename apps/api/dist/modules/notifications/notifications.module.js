"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const notifications_controller_1 = require("./notifications.controller");
const notifications_service_1 = require("./notifications.service");
const email_service_1 = require("./email.service");
const email_processor_1 = require("./email.processor");
const push_service_1 = require("./push.service");
const sms_service_1 = require("./sms.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            bull_1.BullModule.registerQueue({
                name: 'email',
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            }),
        ],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [notifications_service_1.NotificationsService, email_service_1.EmailService, email_processor_1.EmailProcessor, push_service_1.PushService, sms_service_1.SmsService],
        exports: [notifications_service_1.NotificationsService, email_service_1.EmailService, push_service_1.PushService, sms_service_1.SmsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map