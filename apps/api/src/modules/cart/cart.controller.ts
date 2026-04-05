import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getCart(@Request() req: any) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: req.user.sub },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                titleEn: true,
                titleAr: true,
                price: true,
                thumbnail: true,
                level: true,
                instructor: {
                  select: {
                    profile: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    return { success: true, data: cart?.items ?? [] };
  }

  @Post('add')
  async addToCart(@Request() req: any, @Body() body: { courseId: string }) {
    if (!body.courseId) {
      throw new BadRequestException('courseId is required');
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId: req.user.sub },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId: req.user.sub },
      });
    }

    // Check if already enrolled
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: req.user.sub, courseId: body.courseId },
      },
    });
    if (enrolled) {
      throw new BadRequestException('أنت مسجل بالفعل في هذا الكورس');
    }

    // Add to cart (ignore duplicate)
    try {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, courseId: body.courseId },
      });
    } catch {
      // Already in cart — not an error
    }

    return { success: true, message: 'تمت الإضافة إلى السلة' };
  }

  @Delete('remove/:courseId')
  async removeFromCart(
    @Request() req: any,
    @Param('courseId') courseId: string,
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: req.user.sub },
    });
    if (!cart) return { success: true };

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, courseId },
    });
    return { success: true, message: 'تمت الإزالة من السلة' };
  }

  @Delete('clear')
  async clearCart(@Request() req: any) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: req.user.sub },
    });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { success: true };
  }

  @Get('count')
  async getCartCount(@Request() req: any) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: req.user.sub },
    });
    if (!cart) return { success: true, data: { count: 0 } };
    const count = await this.prisma.cartItem.count({
      where: { cartId: cart.id },
    });
    return { success: true, data: { count } };
  }
}
