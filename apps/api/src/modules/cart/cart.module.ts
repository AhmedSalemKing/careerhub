import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CartController],
})
export class CartModule {}
