import { PrismaService } from '../../prisma/prisma.service';
import { ZoomService } from './zoom.service';
export declare class SchedulingService {
    private prisma;
    private zoomService;
    constructor(prisma: PrismaService, zoomService: ZoomService);
    getAvailableSlots(coachId: string, startDate: Date, endDate?: Date): Promise<{
        data: any[];
        total: number;
    }>;
    getCoachAvailability(coachId: string, startDate: Date, endDate: Date): Promise<{
        slots: any[];
    }>;
    getCoachSchedule(coachId: string, date: Date): Promise<{
        slots: any[];
    }>;
    bookSlot(userId: string, slotId: string, sessionData?: any): Promise<{
        success: boolean;
        sessionId: string;
    }>;
    bookSession(userId: string, bookingData: any): Promise<{
        success: boolean;
        sessionId: string;
    }>;
    rescheduleSession(sessionId: string, newSlotId: string, requestedBy?: string): Promise<{
        success: boolean;
    }>;
    cancelSession(sessionId: string, requestedBy?: string, reason?: string): Promise<{
        success: boolean;
    }>;
    setAvailability(coachId: string, slots: any[]): Promise<{
        success: boolean;
    }>;
    createSlots(coachId: string, slots: any[]): Promise<{
        success: boolean;
        created: number;
    }>;
    bulkCreateSlots(coachId: string, data: any): Promise<{
        success: boolean;
    }>;
    deleteSlot(slotId: string): Promise<{
        success: boolean;
    }>;
    getUpcomingSessions(userId: string, role: string): Promise<{
        data: any[];
        total: number;
    }>;
    getSessionHistory(userId: string, options: any): Promise<{
        data: any[];
        total: number;
    }>;
    updateSlot(slotId: string, data: any): Promise<{
        success: boolean;
    }>;
    copyWeekSchedule(coachId: string, sourceDate: Date, targetDate: Date): Promise<{
        success: boolean;
    }>;
    private calculateDuration;
}
