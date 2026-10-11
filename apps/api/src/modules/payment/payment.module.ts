import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../common/services/audit.module';
import { PaymentController } from './payment.controller';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
