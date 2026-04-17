import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../modules/activity/activity.service';
import { JwtService } from '@nestjs/jwt';
export declare class ActivityMiddleware implements NestMiddleware {
    private activityService;
    private jwtService;
    constructor(activityService: ActivityService, jwtService: JwtService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private getAction;
    private getEntity;
}
