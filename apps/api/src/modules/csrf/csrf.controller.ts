import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CsrfMiddleware } from '../../common/middleware/csrf.middleware';

@ApiTags('CSRF')
@Controller('csrf')
export class CsrfController {
  @Get('token')
  @ApiOperation({ summary: 'Get CSRF token for state-changing requests' })
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const existingToken = req.cookies?.csrf_token;
    const token = existingToken || CsrfMiddleware.generateToken();

    if (!existingToken) {
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    return { success: true, data: { csrfToken: token } };
  }
}
