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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
let CartController = class CartController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCart(req) {
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
    async addToCart(req, body) {
        if (!body.courseId) {
            throw new common_1.BadRequestException('courseId is required');
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
            throw new common_1.BadRequestException('أنت مسجل بالفعل في هذا الكورس');
        }
        // Add to cart (ignore duplicate)
        try {
            await this.prisma.cartItem.create({
                data: { cartId: cart.id, courseId: body.courseId },
            });
        }
        catch {
            // Already in cart — not an error
        }
        return { success: true, message: 'تمت الإضافة إلى السلة' };
    }
    async removeFromCart(req, courseId) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId: req.user.sub },
        });
        if (!cart)
            return { success: true };
        await this.prisma.cartItem.deleteMany({
            where: { cartId: cart.id, courseId },
        });
        return { success: true, message: 'تمت الإزالة من السلة' };
    }
    async clearCart(req) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId: req.user.sub },
        });
        if (cart) {
            await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
        return { success: true };
    }
    async getCartCount(req) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId: req.user.sub },
        });
        if (!cart)
            return { success: true, data: { count: 0 } };
        const count = await this.prisma.cartItem.count({
            where: { cartId: cart.id },
        });
        return { success: true, data: { count } };
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCart", null);
__decorate([
    (0, common_1.Post)('add'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addToCart", null);
__decorate([
    (0, common_1.Delete)('remove/:courseId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "removeFromCart", null);
__decorate([
    (0, common_1.Delete)('clear'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "clearCart", null);
__decorate([
    (0, common_1.Get)('count'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCartCount", null);
exports.CartController = CartController = __decorate([
    (0, common_1.Controller)('cart'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartController);
