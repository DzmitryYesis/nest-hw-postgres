import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../../../features/service';
import { Request } from 'express';
import { SETTINGS } from '../../../settings';

//TODO refactoring this guard
@Injectable()
export class RefreshAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { userId?: string }>();
    const refreshTokenCookie = request.cookies[SETTINGS.REFRESH_TOKEN_NAME];

    if (!refreshTokenCookie) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const refreshToken = refreshTokenCookie.replace('refreshToken=', '');

    const isValidJWTFormat =
      await this.jwtService.isValidJWTFormat(refreshToken);

    if (!isValidJWTFormat) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const { userId } = await this.jwtService.decodeRefreshToken(refreshToken);

    request.userId = userId;

    return true;
  }
}
