import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class ApprovedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
