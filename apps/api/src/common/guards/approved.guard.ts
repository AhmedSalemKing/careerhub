import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ApprovedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    // Admin always passes
    if (user.accountType === 'ADMIN' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check status
    if (user.status === 'PENDING') {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'حسابك في انتظار الموافقة',
        code: 'PENDING_APPROVAL',
      });
    }

    if (user.status === 'BANNED' || user.status === 'REJECTED') {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'تم رفض حسابك أو تعليقه',
        code: 'ACCOUNT_REJECTED',
      });
    }

    return true;
  }
}