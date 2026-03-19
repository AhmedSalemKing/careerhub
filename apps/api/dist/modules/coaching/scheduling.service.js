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
exports.SchedulingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const zoom_service_1 = require("./zoom.service");
let SchedulingService = class SchedulingService {
    constructor(prisma, zoomService) {
        this.prisma = prisma;
        this.zoomService = zoomService;
    }
    async getAvailableSlots(coachId, startDate, endDate) {
        return { data: [], total: 0 };
    }
    async getCoachAvailability(coachId, startDate, endDate) {
        return { slots: [] };
    }
    async getCoachSchedule(coachId, date) {
        return { slots: [] };
    }
    async bookSlot(userId, slotId, sessionData) {
        return { success: true, sessionId: 'stub-id' };
    }
    async bookSession(userId, bookingData) {
        return { success: true, sessionId: 'stub-id' };
    }
    async rescheduleSession(sessionId, newSlotId, requestedBy) {
        return { success: true };
    }
    async cancelSession(sessionId, requestedBy, reason) {
        return { success: true };
    }
    async setAvailability(coachId, slots) {
        return { success: true };
    }
    async createSlots(coachId, slots) {
        return { success: true, created: slots.length };
    }
    async bulkCreateSlots(coachId, data) {
        return { success: true };
    }
    async deleteSlot(slotId) {
        return { success: true };
    }
    async getUpcomingSessions(userId, role) {
        return { data: [], total: 0 };
    }
    async getSessionHistory(userId, options) {
        return { data: [], total: 0 };
    }
    async updateSlot(slotId, data) {
        return { success: true };
    }
    async copyWeekSchedule(coachId, sourceDate, targetDate) {
        return { success: true };
    }
    calculateDuration(startTime, endTime) {
        return 60;
    }
};
exports.SchedulingService = SchedulingService;
exports.SchedulingService = SchedulingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, zoom_service_1.ZoomService])
], SchedulingService);
