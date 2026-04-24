import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class TrackActivityMiddleware implements NestMiddleware {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private mapEntity;
}
