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
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) { }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getLesson(
    @Param('id') id: string,
    @Query('language') language?: string,
  ) {
    const lesson = await this.lessonsService.getLesson(id, language || 'en');
    return {
      success: true,
      data: { lesson },
    };
  }

  @Get(':id/content')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson content (requires enrollment)' })
  @ApiResponse({ status: 200, description: 'Lesson content retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not enrolled in course' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Content language' })
  async getLessonContent(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('language') language?: string,
  ) {
    const content = await this.lessonsService.getLessonContent(
      user.id,
      id,
      language || 'en'
    );
    return {
      success: true,
      data: { content },
    };
  }

  @Get(':id/video')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson video URL (requires enrollment)' })
  @ApiResponse({ status: 200, description: 'Video URL retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not enrolled in course' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  async getLessonVideo(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const videoData = await this.lessonsService.getLessonVideo(user.id, id);
    return {
      success: true,
      data: videoData,
    };
  }

  @Post(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  async updateProgress(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() progressData: {
      progress: number;
      timeSpent?: number;
      currentSecond?: number;
    },
  ) {
    const result = await this.lessonsService.updateProgress(
      user.id,
      id,
      progressData
    );
    return {
      success: true,
      message: 'Progress updated successfully',
      data: result,
    };
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark lesson as completed' })
  @ApiResponse({ status: 200, description: 'Lesson marked as completed' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  async completeLesson(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('timeSpent') timeSpent?: number,
  ) {
    const result = await this.lessonsService.completeLesson(user.id, id, timeSpent);
    return {
      success: true,
      message: 'Lesson completed successfully',
      data: result,
    };
  }

  @Get(':id/quiz')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson quiz' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No quiz found for this lesson' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Quiz language' })
  async getLessonQuiz(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('language') language?: string,
  ) {
    const quiz = await this.lessonsService.getLessonQuiz(
      user.id,
      id
    );
    return {
      success: true,
      data: { quiz },
    };
  }

  @Post(':id/quiz/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit lesson quiz answers' })
  @ApiResponse({ status: 200, description: 'Quiz submitted successfully' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  async submitQuiz(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() submissionData: {
      answers: Array<{ questionId: string; answer: string }>;
      timeSpent?: number;
    },
  ) {
    const result = await this.lessonsService.submitQuiz(user.id, id, submissionData);
    return {
      success: true,
      message: 'Quiz submitted successfully',
      data: result,
    };
  }

  @Get(':id/next')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get next lesson in course' })
  @ApiResponse({ status: 200, description: 'Next lesson retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No next lesson found' })
  @ApiParam({ name: 'id', description: 'Current lesson ID' })
  async getNextLesson(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const nextLesson = await this.lessonsService.getNextLesson(user.id, id);
    return {
      success: true,
      data: { nextLesson },
    };
  }

  @Get(':id/previous')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get previous lesson in course' })
  @ApiResponse({ status: 200, description: 'Previous lesson retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No previous lesson found' })
  @ApiParam({ name: 'id', description: 'Current lesson ID' })
  async getPreviousLesson(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const previousLesson = await this.lessonsService.getPreviousLesson(user.id, id);
    return {
      success: true,
      data: { previousLesson },
    };
  }

  @Get('course/:courseId/outline')
  @ApiOperation({ summary: 'Get course lesson outline' })
  @ApiResponse({ status: 200, description: 'Course outline retrieved successfully' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Content language' })
  async getCourseOutline(
    @Param('courseId') courseId: string,
    @Query('language') language?: string,
  ) {
    const outline = await this.lessonsService.getCourseOutline(
      courseId,
      language || 'en'
    );
    return {
      success: true,
      data: { outline },
    };
  }

  @Get(':id/notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson notes' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  async getLessonNotes(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const notes = await this.lessonsService.getLessonNotes(user.id, id);
    return {
      success: true,
      data: { notes },
    };
  }

  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save lesson notes' })
  @ApiResponse({ status: 201, description: 'Notes saved successfully' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  async saveLessonNotes(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() notesData: {
      content: string;
      timestamp?: number;
    },
  ) {
    const notes = await this.lessonsService.saveLessonNotes(user.id, id, notesData);
    return {
      success: true,
      message: 'Notes saved successfully',
      data: { notes },
    };
  }

  @Get(':id/discussion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson discussion' })
  @ApiResponse({ status: 200, description: 'Discussion retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getLessonDiscussion(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const discussion = await this.lessonsService.getPopularLessons({
      page: page || 1,
      limit: limit || 20,
    });
    return {
      success: true,
      data: discussion,
    };
  }

  // Admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lesson (Admin only)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  async createLesson(@Body() createLessonDto: any) {
    const lesson = await this.lessonsService.createLesson(createLessonDto);
    return {
      success: true,
      message: 'Lesson created successfully',
      data: { lesson },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lesson (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  async updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: any,
  ) {
    const lesson = await this.lessonsService.updateLesson(id, updateLessonDto);
    return {
      success: true,
      message: 'Lesson updated successfully',
      data: { lesson },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson (Admin only)' })
  @ApiResponse({ status: 204, description: 'Lesson deleted successfully' })
  async deleteLesson(@Param('id') id: string) {
    await this.lessonsService.deleteLesson(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a lesson (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lesson published successfully' })
  async publishLesson(@Param('id') id: string) {
    const lesson = await this.lessonsService.publishLesson(id);
    return {
      success: true,
      message: 'Lesson published successfully',
      data: { lesson },
    };
  }

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a lesson (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lesson unpublished successfully' })
  async unpublishLesson(@Param('id') id: string) {
    const lesson = await this.lessonsService.unpublishLesson(id);
    return {
      success: true,
      message: 'Lesson unpublished successfully',
      data: { lesson },
    };
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getLessonAnalytics(@Param('id') id: string) {
    const analytics = await this.lessonsService.getLessonAnalytics(id);
    return {
      success: true,
      data: { analytics },
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all lessons for admin (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  async getAdminLessons(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('courseId') courseId?: string,
    @Query('isPublished') isPublished?: boolean,
  ) {
    const lessons = await this.lessonsService.getAdminLessons({
      page: page || 1,
      limit: limit || 20,
      courseId,
      isPublished,
    });
    return {
      success: true,
      data: lessons,
    };
  }
}





