import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentController } from './payment.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
