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
import { CoursesService } from './courses.service';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly enrollmentService: EnrollmentService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'careerPath', required: false, description: 'Filter by career path' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCourses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('careerPath') careerPath?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('language') language?: string,
  ) {
    const courses = await this.coursesService.getCourses({
      page: page || 1,
      limit: limit || 12,
      careerPath,
      level,
      search,
      language: language || 'en',
    });
    return {
      success: true,
      data: courses,
    };
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

  @Get('my-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user enrolled courses' })
  @ApiResponse({ status: 200, description: 'User courses retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status' })
  async getMyCourses(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const courses = await this.coursesService.getMyCourses(user.id, {
      page: page || 1,
      limit: limit || 10,
      status,
    });
    return {
      success: true,
      data: courses,
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get course by slug' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiParam({ name: 'slug', description: 'Course slug' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCourseBySlug(
    @Param('slug') slug: string,
    @Query('language') language?: string,
  ) {
    const course = await this.coursesService.getCourseBySlug(slug, language || 'en');
    return {
      success: true,
      data: { course },
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

  @Get('categories/list')
  @ApiOperation({ summary: 'Get course categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' })
  async getCategories(@Query('language') language?: string) {
    const categories = await this.coursesService.getCategories(language || 'en');
    return {
      success: true,
      data: { categories },
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

  // Admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(@Body() createCourseDto: any) {
    const course = await this.coursesService.createCourse(createCourseDto);
    return {
      success: true,
      message: 'Course created successfully',
      data: { course },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: any,
  ) {
    const course = await this.coursesService.updateCourse(id, updateCourseDto);
    return {
      success: true,
      message: 'Course updated successfully',
      data: { course },
    };
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
}


