"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareerModule = void 0;
const common_1 = require("@nestjs/common");
const career_controller_1 = require("./career.controller");
const career_service_1 = require("./career.service");
const assessment_service_1 = require("./assessment.service");
const ai_assessment_service_1 = require("./ai-assessment.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
let CareerModule = class CareerModule {
};
exports.CareerModule = CareerModule;
exports.CareerModule = CareerModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [career_controller_1.CareerController],
        providers: [career_service_1.CareerService, assessment_service_1.AssessmentService, ai_assessment_service_1.AiAssessmentService],
        exports: [career_service_1.CareerService, assessment_service_1.AssessmentService, ai_assessment_service_1.AiAssessmentService],
    })
], CareerModule);
//# sourceMappingURL=career.module.js.map