import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './dto/create-package.dto';

const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  /** Public: active packages, optionally `?pathId=` for one track. */
  @Get()
  async findAll(@Query('pathId') pathId?: string) {
    return { success: true, data: await this.packages.findAll(pathId) };
  }

  /** Ids of the packages the signed-in user has paid for. */
  @Get('my/purchased')
  @UseGuards(JwtAuthGuard)
  async myPurchased(@Request() req: any) {
    return { success: true, data: await this.packages.purchasedIds(req.user.id) };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAllAdmin() {
    return { success: true, data: await this.packages.findAllAdmin() };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.packages.findOne(id) };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(pipe) dto: CreatePackageDto) {
    return { success: true, data: await this.packages.create(dto) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body(pipe) dto: UpdatePackageDto) {
    return { success: true, data: await this.packages.update(id, dto) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return { success: true, data: await this.packages.remove(id) };
  }
}
