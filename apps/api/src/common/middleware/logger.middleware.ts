import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

const httpLogger = new Logger('HTTP')

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req
    const start = Date.now()

    res.on('finish', () => {
      const { statusCode } = res
      const duration = Date.now() - start
      httpLogger.log(`${method} ${originalUrl} ${statusCode} ${duration}ms`)
    })

    next()
  }
}
