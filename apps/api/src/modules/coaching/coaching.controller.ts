import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CoachingService } from './coaching.service';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Coaching')
@Controller('coaching')
export class CoachingController {
  constructor(
    private readonly coachingService: CoachingService,
    private readonly schedulingService: SchedulingService,
  ) {}

  @Get('coaches')
  @ApiOperation({ summary: 'Get available coaches' })
  @ApiResponse({ status: 200, description: 'Coaches retrieved successfully' })
  @ApiQuery({ name: 'specialization', required: false, description: 'Filter by specialization' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCoaches(
    @Query('specialization') specialization?: string,
    @Query('language') language?: string,
  ) {
    const coaches = await this.coachingService.getCoaches(specialization, language || 'en');
    return {
      success: true,
      data: { coaches },
    };
  }

  @Get('coaches/:id')
  @ApiOperation({ summary: 'Get coach by ID' })
  @ApiResponse({ status: 200, description: 'Coach retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Coach not found' })
  @ApiParam({ name: 'id', description: 'Coach ID' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCoach(
    @Param('id') id: string,
    @Query('language') language?: string,
  ) {
    const coach = await this.coachingService.getCoach(id, language || 'en');
    return {
      success: true,
      data: { coach },
    };
  }

  @Get('coaches/:id/availability')
  @ApiOperation({ summary: 'Get coach availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Coach not found' })
  @ApiParam({ name: 'id', description: 'Coach ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  async getCoachAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const availability = await this.schedulingService.getCoachAvailability(
      id,
      new Date(startDate),
      new Date(endDate)
    );
    return {
      success: true,
      data: { availability },
    };
  }

  @Get('coaches/:id/slots')
  @ApiOperation({ summary: 'Get available booking slots' })
  @ApiResponse({ status: 200, description: 'Slots retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Coach not found' })
  @ApiParam({ name: 'id', description: 'Coach ID' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    const slots = await this.schedulingService.getAvailableSlots(id, new Date(date));
    return {
      success: true,
      data: { slots },
    };
  }

  @Post('sessions/book')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book a coaching session' })
  @ApiResponse({ status: 201, description: 'Session booked successfully' })
  @ApiResponse({ status: 400, description: 'Slot not available or booking conflict' })
  async bookSession(
    @CurrentUser() user: User,
    @Body() bookingData: {
      coachId: string;
      slotId: string;
      sessionType: 'ONE_ON_ONE' | 'GROUP';
      notes?: string;
    },
  ) {
    const session = await this.schedulingService.bookSession(user.id, bookingData);
    return {
      success: true,
      message: 'Session booked successfully',
      data: { session },
    };
  }

  @Get('consulting/my-sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get consulting sessions (for CONSULTANTs and students)' })
  @ApiResponse({ status: 200, description: 'Consulting sessions retrieved successfully' })
  async getConsultingSessions(@CurrentUser() user: any) {
    const sessions = await this.coachingService.getConsultingSessions(user.id, user.accountType);
    return { success: true, data: sessions };
  }

  @Patch('consulting/:id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a consulting session (CONSULTANT only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async confirmConsultingSession(@CurrentUser() user: any, @Param('id') id: string) {
    const session = await this.coachingService.confirmConsultingSession(id, user.id);
    return { success: true, message: 'Session confirmed', data: session };
  }

  @Patch('consulting/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a consulting session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async cancelConsultingSession(@CurrentUser() user: any, @Param('id') id: string) {
    const session = await this.coachingService.cancelConsultingSession(id, user.id);
    return { success: true, message: 'Session cancelled', data: session };
  }

  @Patch('consulting/:id/request-reschedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request reschedule (CONSULTANT only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async requestReschedule(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { proposedDate: string; proposedTime: string; reason?: string },
  ) {
    const result = await this.coachingService.requestReschedule(id, user.id, body);
    return result;
  }

  @Patch('consulting/:id/approve-reschedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve reschedule (user only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async approveReschedule(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.coachingService.approveReschedule(id, user.id);
    return result;
  }

  @Patch('consulting/:id/reject-reschedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject reschedule (user only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async rejectReschedule(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.coachingService.rejectReschedule(id, user.id);
    return result;
  }

  @Patch('consulting/:id/meeting-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add meeting link (CONSULTANT only)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async addMeetingLink(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { meetingLink: string; meetingType: string },
  ) {
    const result = await this.coachingService.addMeetingLink(id, user.id, body);
    return result;
  }

  @Patch('consulting/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark session as completed' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async completeConsultingSession(@CurrentUser() user: any, @Param('id') id: string) {
    const session = await this.coachingService.completeConsultingSession(id, user.id);
    return { success: true, message: 'Session completed', data: session };
  }

  @Patch('consulting/:id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark session as paid' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async payConsultingSession(@CurrentUser() user: any, @Param('id') id: string) {
    const session = await this.coachingService.payConsultingSession(id, user.id);
    return { success: true, message: 'Payment successful', data: session };
  }

  @Get('sessions/my-sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user coaching sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async getMySessions(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const sessions = await this.coachingService.getUserSessions(user.id, {
      page: page || 1,
      limit: limit || 10,
      status,
    });
    return {
      success: true,
      data: sessions,
    };
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session details' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async getSession(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const session = await this.coachingService.getSession(user.id, id);
    return {
      success: true,
      data: { session },
    };
  }

  @Patch('sessions/:id/reschedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reschedule session' })
  @ApiResponse({ status: 200, description: 'Session rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Rescheduling not allowed' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async rescheduleSession(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() rescheduleData: {
      newSlotId: string;
      reason?: string;
    },
  ) {
    const session = await this.schedulingService.rescheduleSession(
      user.id,
      id,
      rescheduleData.newSlotId
    );
    return {
      success: true,
      message: 'Session rescheduled successfully',
      data: { session },
    };
  }

  @Patch('sessions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel session' })
  @ApiResponse({ status: 200, description: 'Session cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cancellation not allowed' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async cancelSession(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const session = await this.schedulingService.cancelSession(user.id, id, reason);
    return {
      success: true,
      message: 'Session cancelled successfully',
      data: { session },
    };
  }

  @Post('sessions/:id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join coaching session' })
  @ApiResponse({ status: 200, description: 'Joined session successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async joinSession(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const joinData = await this.coachingService.joinSession(user.id, id);
    return {
      success: true,
      data: joinData,
    };
  }

  @Post('sessions/:id/complete')
  @UseGuards(JwtAuthGuard)
  @Roles('COACH', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark session as completed (Coach/Admin only)' })
  @ApiResponse({ status: 200, description: 'Session marked as completed' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async completeSession(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() completionData: {
      notes?: string;
      followUpActions?: string[];
    },
  ) {
    const session = await this.coachingService.completeSession(user.id, id, completionData);
    return {
      success: true,
      message: 'Session completed successfully',
      data: { session },
    };
  }

  @Post('sessions/:id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit session review' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 400, description: 'Review already submitted' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async submitReview(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() reviewData: {
      rating: number;
      comment?: string;
    },
  ) {
    const review = await this.coachingService.submitReview(user.id, id, reviewData);
    return {
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    };
  }

  @Get('reviews/coach/:coachId')
  @ApiOperation({ summary: 'Get coach reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiParam({ name: 'coachId', description: 'Coach ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getCoachReviews(
    @Param('coachId') coachId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const reviews = await this.coachingService.getCoachReviews(coachId, {
      page: page || 1,
      limit: limit || 10,
    });
    return {
      success: true,
      data: reviews,
    };
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get coaching packages' })
  @ApiResponse({ status: 200, description: 'Packages retrieved successfully' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getPackages(@Query('language') language?: string) {
    const packages = await this.coachingService.getPackages(language || 'en');
    return {
      success: true,
      data: { packages },
    };
  }

  @Post('packages/:id/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase coaching package' })
  @ApiResponse({ status: 201, description: 'Package purchased successfully' })
  @ApiResponse({ status: 400, description: 'Purchase failed' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  async purchasePackage(
    @CurrentUser() user: User,
    @Param('id') packageId: string,
    @Body() purchaseData: {
      paymentMethodId: string;
    },
  ) {
    const purchase = await this.coachingService.purchasePackage(user.id, packageId, purchaseData);
    return {
      success: true,
      message: 'Package purchased successfully',
      data: { purchase },
    };
  }

  @Get('stats/my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user coaching statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getMyStats(@CurrentUser() user: User) {
    const stats = await this.coachingService.getUserStats(user.id);
    return {
      success: true,
      data: { stats },
    };
  }

  // Coach endpoints
  @Get('coach/dashboard')
  @UseGuards(JwtAuthGuard)
  @Roles('COACH', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coach dashboard (Coach/Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getCoachDashboard(@CurrentUser() user: User) {
    const dashboard = await this.coachingService.getCoachDashboard(user.id);
    return {
      success: true,
      data: dashboard,
    };
  }

  @Get('coach/schedule')
  @UseGuards(JwtAuthGuard)
  @Roles('COACH', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coach schedule (Coach/Admin only)' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  async getCoachSchedule(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const schedule = await this.coachingService.getCoachSchedule(
      user.id,
      new Date(startDate),
      new Date(endDate)
    );
    return {
      success: true,
      data: { schedule },
    };
  }

  @Post('coach/availability')
  @UseGuards(JwtAuthGuard)
  @Roles('COACH', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set coach availability (Coach/Admin only)' })
  @ApiResponse({ status: 201, description: 'Availability set successfully' })
  async setAvailability(
    @CurrentUser() user: User,
    @Body() availabilityData: {
      slots: Array<{
        startTime: string;
        endTime: string;
        date: string;
        recurring?: boolean;
      }>;
    },
  ) {
    const result = await this.schedulingService.setAvailability(user.id, availabilityData.slots);
    return {
      success: true,
      message: 'Availability set successfully',
      data: result,
    };
  }

  // Admin endpoints
  @Post('coaches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new coach (Admin only)' })
  @ApiResponse({ status: 201, description: 'Coach created successfully' })
  async createCoach(@Body() coachData: {
    userId: string;
    bio: string;
    specialties: string[];
    hourlyRate: number;
    languages: string[];
    experience: number;
  }) {
    const coach = await this.coachingService.createCoach(coachData);
    return {
      success: true,
      message: 'Coach created successfully',
      data: { coach },
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all coaches (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coaches retrieved successfully' })
  async getAllCoaches(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const coaches = await this.coachingService.getAllCoaches({
      page: page || 1,
      limit: limit || 20,
      status,
    });
    return {
      success: true,
      data: coaches,
    };
  }

  @Get('admin/sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sessions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getAllSessions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('coachId') coachId?: string,
  ) {
    const sessions = await this.coachingService.getAllSessions({
      page: page || 1,
      limit: limit || 20,
      status,
      coachId,
    });
    return {
      success: true,
      data: sessions,
    };
  }

  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coaching analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics() {
    const analytics = await this.coachingService.getAnalytics();
    return {
      success: true,
      data: { analytics },
    };
  }
}

