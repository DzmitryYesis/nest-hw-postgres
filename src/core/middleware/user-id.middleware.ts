import { NextFunction, Request } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '../../features/service';

@Injectable()
export class UserIdMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(
    req: Request & { userId?: string },
    res: Response,
    next: NextFunction,
  ) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await this.jwtService.verifyAccessToken(token);

      if (user) {
        req.userId = user.userId;
      }
    }

    next();
  }
}
