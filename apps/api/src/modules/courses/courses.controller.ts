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
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { EnrollmentService } from './enrollment.service';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly enrollmentService: EnrollmentService,
    private readonly recommendationService: RecommendationService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'careerPath', required: false, description: 'Filter by career path' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category (includes subcategories)' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type: recorded, live, offline' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCourses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('careerPath') careerPath?: string,
    @Query('categoryId') categoryId?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('language') language?: string,
    @Query('type') type?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id

    const courses = await this.coursesService.getCourses({
      page: page || 1,
      limit: limit || 12,
      careerPath,
      categoryId,
      level,
      search,
      language: language || 'en',
      type,
      userId,
    });

    if (req?.user?.id && search) {
      this.prisma.userActivity.create({
        data: {
          userId: req.user.id,
          action: 'SEARCH_COURSES',
          entity: 'Course',
          metadata: { query: search },
        },
      }).catch(() => {});
    }

    return {
      success: true,
      data: courses,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Global search for courses and consultants' })
  async globalSearch(@Query('q') q: string) {
    const data = await this.coursesService.globalSearch(q || '');
    return { success: true, data };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all course categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCategories(@Query('language') language?: string) {
    return this.coursesService.getCategories(language || 'en');
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended courses by career paths' })
  @ApiQuery({ name: 'paths', required: false, description: 'Comma-separated career path IDs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of courses to return' })
  async getRecommended(
    @Request() req: any,
    @Query('paths') paths: string,
    @Query('limit') limit?: string,
  ) {
    return this.coursesService.getCourses({
      page: 1,
      limit: parseInt(limit || '12'),
      language: 'en',
    });
  }

  @Get('recommended-public')
  @ApiOperation({ summary: 'Get recommended courses (public, no auth)' })
  @ApiQuery({ name: 'paths', required: false, description: 'Comma-separated career path IDs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of courses to return' })
  async getRecommendedPublic(
    @Query('paths') paths: string,
    @Query('limit') limit?: string,
  ) {
    // Simple: return all published courses
    return this.coursesService.getCourses({
      page: 1,
      limit: parseInt(limit || '12'),
      language: 'en',
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured courses' })
  @ApiResponse({ status: 200, description: 'Featured courses retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of courses to return' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getFeaturedCourses(
    @Query('limit') limit?: number,
    @Query('language') language?: string,
  ) {
    const courses = await this.coursesService.getFeaturedCourses(
      limit || 6,
      language || 'en'
    );
    return {
      success: true,
      data: { courses },
    };
  }

  @Get('bundles')
  @ApiOperation({ summary: 'Get all course bundles' })
  @ApiResponse({ status: 200, description: 'Bundles retrieved successfully' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getBundles(@Query('language') language?: string) {
    const bundles = await this.coursesService.getBundles(language || 'en');
    return { success: true, data: bundles };
  }

  @Get('by-career-path')
  @ApiOperation({ summary: 'Get courses by career path category' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiQuery({ name: 'category', required: false, description: 'Career path category (tech, design, marketing, business)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of courses to return' })
  async getCoursesByCareerPath(
    @Query('category') category?: string,
    @Query('limit') limit?: number,
  ) {
    const courses = await this.coursesService.getCoursesByCareerPath(category || 'tech', limit || 8);
    return { success: true, data: courses };
  }

  @Get('enrolled')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrolled courses for current user' })
  async getEnrolledCourses(@Request() req: any) {
    const userId = req.user.sub || req.user.id
    const result = await this.coursesService.getMyCourses(userId, { page: 1, limit: 100 })
    return { success: true, data: result.enrollments }
  }

  @Get('my-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get courses (enrolled for students, created for instructors)' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async getMyCourses(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    if (req.user.accountType === 'INSTRUCTOR') {
      return this.coursesService.getInstructorCourses(req.user.id);
    }
    const courses = await this.coursesService.getMyCourses(req.user.id, {
      page: page || 1,
      limit: limit || 10,
      status,
    });
    return { success: true, data: courses };
  }

  @Get('my-enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrolled courses for current user with progress' })
  async getMyEnrollments(@Request() req: any) {
    const enrollments = await this.coursesService.getMyEnrollments(req.user.id);
    return { success: true, data: enrollments };
  }

  // ─── Instructor endpoints ─────────────────────────────────────
  @Get('instructor/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor dashboard stats' })
  async getInstructorStats(@Request() req: any) {
    return this.coursesService.getInstructorStats(req.user.id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get course by slug or ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiParam({ name: 'slug', description: 'Course slug or ID' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCourseBySlug(
    @Param('slug') slug: string,
    @Query('language') language?: string,
    @Request() req?: any,
  ) {
    // Try by ID first (cuid format), then fall back to slug
    const isCuid = /^c[a-z0-9]{24,}$/.test(slug);
    let courseData: any;
    if (isCuid) {
      try {
        courseData = await this.coursesService.getCourseById(slug);
      } catch {
        // fall through to slug lookup
      }
    }
    if (!courseData) {
      courseData = await this.coursesService.getCourseBySlug(slug, language || 'en');
    }

    // Track VIEW_COURSE activity if user is authenticated
    if (req?.user?.id) {
      this.prisma.userActivity.create({
        data: {
          userId: req.user.id,
          action: 'VIEW_COURSE',
          entity: 'Course',
          entityId: courseData.id,
          metadata: { slug },
        },
      }).catch(() => {});
    }

    return {
      success: true,
      data: { course: courseData },
    };
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'Get course lessons' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCourseLessons(
    @Param('id') id: string,
    @Query('language') language?: string,
  ) {
    const lessons = await this.coursesService.getCourseLessons(id, language || 'en');
    return {
      success: true,
      data: { lessons },
    };
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({ status: 201, description: 'Enrolled successfully' })
  @ApiResponse({ status: 400, description: 'Already enrolled or course not available' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async enrollInCourse(
    @CurrentUser() user: User,
    @Param('id') courseId: string,
  ) {
    const enrollment = await this.enrollmentService.enrollUser(user.id, courseId);
    return {
      success: true,
      message: 'Enrolled successfully',
      data: { enrollment },
    };
  }

  @Get(':id/enrollment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course enrollment status' })
  @ApiResponse({ status: 200, description: 'Enrollment status retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async getEnrollmentStatus(
    @CurrentUser() user: User,
    @Param('id') courseId: string,
  ) {
    const enrollment = await this.enrollmentService.getEnrollment(user.id, courseId);
    return {
      success: true,
      data: { enrollment },
    };
  }

  @Post(':courseId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a lesson as complete and update progress' })
  @ApiResponse({ status: 200, description: 'Lesson completed, enrollment progress updated' })
  @ApiResponse({ status: 403, description: 'Not enrolled in this course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  async markLessonComplete(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;
    const result = await this.coursesService.markLessonComplete(userId, courseId, lessonId);
    return { success: true, data: result };
  }

  @Post(':courseId/lessons/:lessonId/heartbeat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track time spent on a lesson' })
  @ApiResponse({ status: 200, description: 'Time tracked successfully' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  async heartbeat(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body('seconds') seconds: number,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;
    // Clamp seconds to 1–60 range
    const clampedSeconds = Math.max(1, Math.min(60, Math.floor(Number(seconds) || 30)));
    const result = await this.coursesService.heartbeat(userId, courseId, lessonId, clampedSeconds);
    return { success: true, data: result };
  }

  @Post(':id/complete-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if course is completed and get certificate URL' })
  async completeCheck(@Param('id') courseId: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    const result = await this.coursesService.completeCheck(userId, courseId);
    return { success: true, data: result };
  }

  @Post(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async updateProgress(
    @CurrentUser() user: User,
    @Param('id') courseId: string,
    @Body('lessonId') lessonId: string,
    @Body('progress') progress: number,
    @Body('timeSpent') timeSpent?: number,
  ) {
    const updatedProgress = await this.enrollmentService.updateEnrollmentProgress(user.id, 0);
    return {
      success: true,
      message: 'Progress updated successfully',
      data: updatedProgress,
    };
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async getCourseStats(
    @CurrentUser() user: User,
    @Param('id') courseId: string,
  ) {
    const stats = await this.coursesService.getCourseStats(courseId, user.id);
    return {
      success: true,
      data: { stats },
    };
  }

  @Get('levels/list')
  @ApiOperation({ summary: 'Get course levels' })
  @ApiResponse({ status: 200, description: 'Levels retrieved successfully' })
  async getLevels() {
    const levels = await this.coursesService.getLevels();
    return {
      success: true,
      data: { levels },
    };
  }

  @Post('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendations(@CurrentUser() user: User) {
    const recommendations = await this.coursesService.getRecommendations(user.id);
    return {
      success: true,
      data: { recommendations },
    };
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  async getSearchSuggestions(@Query('q') query: string) {
    const suggestions = await this.coursesService.getSearchSuggestions(query);
    return {
      success: true,
      data: { suggestions },
    };
  }

  // ─── Instructor: sections & lessons ──────────────────────────
  @Get('instructor/:id/details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full course details for instructor' })
  async getInstructorCourseDetails(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.getInstructorCourseDetails(id, req.user.id);
  }

  @Post('instructor/:id/sections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add section to instructor course' })
  async addSection(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { title: string },
  ) {
    return this.coursesService.addSection(id, req.user.id, body.title);
  }

  @Post('sections/:sectionId/lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add lesson to section' })
  async addLesson(@Param('sectionId') sectionId: string, @Body() body: any) {
    return this.coursesService.addLesson(sectionId, body);
  }

  // ─── Admin / Instructor shared CRUD ──────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create course (Admin: full DTO / Instructor: own course)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(@Request() req: any, @Body() body: any) {
    if (req.user.role === 'ADMIN') {
      const course = await this.coursesService.createCourse(body);
      return { success: true, message: 'Course created successfully', data: { course } };
    }
    return this.coursesService.createInstructorCourse(req.user.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (Admin: any / Instructor: own)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async updateCourse(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    if (req.user.role === 'ADMIN') {
      const course = await this.coursesService.updateCourse(id, body);
      return { success: true, message: 'Course updated successfully', data: { course } };
    }
    return this.coursesService.updateInstructorCourse(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiResponse({ status: 204, description: 'Course deleted successfully' })
  async deleteCourse(@Param('id') id: string) {
    await this.coursesService.deleteCourse(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course published successfully' })
  async publishCourse(@Param('id') id: string) {
    const course = await this.coursesService.publishCourse(id);
    return {
      success: true,
      message: 'Course published successfully',
      data: { course },
    };
  }

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course unpublished successfully' })
  async unpublishCourse(@Param('id') id: string) {
    const course = await this.coursesService.unpublishCourse(id);
    return {
      success: true,
      message: 'Course unpublished successfully',
      data: { course },
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all courses for admin (Admin only)' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async getAdminCourses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const courses = await this.coursesService.getAdminCourses({
      page: page || 1,
      limit: limit || 20,
      status,
      search,
    });
    return {
      success: true,
      data: courses,
    };
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getCourseAnalytics(@Param('id') id: string) {
    const analytics = await this.coursesService.getCourseAnalytics(id);
    return {
      success: true,
      data: { analytics },
    };
  }

  @Post(':id/payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for course enrollment' })
  async createCoursePaymentIntent(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { amount: number },
  ) {
    return this.coursesService.createCoursePaymentIntent(id, req.user.id, body.amount);
  }

  @Post(':id/confirm-enrollment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm enrollment after successful payment' })
  async confirmCourseEnrollment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { paymentIntentId: string },
  ) {
    return this.coursesService.confirmCourseEnrollment(id, req.user.id, body.paymentIntentId);
  }
}


