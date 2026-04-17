import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ActivityService } from './activity.service';
import { ActivityGateway } from './activity.gateway';
export declare class ActivityInterceptor implements NestInterceptor {
    private readonly activityService;
    private readonly activityGateway;
    constructor(activityService: ActivityService, activityGateway: ActivityGateway);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
