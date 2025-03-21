import { ObjectId } from 'mongodb';
import { SETTINGS } from '../../../settings';
import jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';

type TAccessTokenData = {
  userId: string;
  iat: number;
  exp: number;
};

type TRefreshTokenData = {
  refreshToken: string;
  deviceId: string;
  userId: string;
  iat: number;
  exp: number;
};

export class JwtService {
  async createAccessJWT(userId: ObjectId): Promise<string> {
    return jwt.sign({ userId: userId }, SETTINGS.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: SETTINGS.JWT_ACCESS_TOKEN_EXPIRES_TIME,
    });
  }

  async createRefreshJWT(
    deviceId: string,
    userId: ObjectId,
  ): Promise<TRefreshTokenData> {
    const refreshToken = jwt.sign(
      {
        deviceId,
        userId,
      },
      SETTINGS.JWT_REFRESH_TOKEN_SECRET,
      { expiresIn: SETTINGS.JWT_REFRESH_TOKEN_EXPIRES_TIME },
    );
    const refreshTokenPayload = jwt.decode(refreshToken) as Omit<
      TRefreshTokenData,
      'refreshToken'
    >;

    return {
      refreshToken,
      deviceId: refreshTokenPayload.deviceId,
      userId: refreshTokenPayload.userId,
      exp: refreshTokenPayload.exp,
      iat: refreshTokenPayload.iat,
    };
  }

  async verifyAccessToken(token: string): Promise<TAccessTokenData> {
    try {
      return jwt.verify(
        token,
        SETTINGS.JWT_ACCESS_TOKEN_SECRET,
      ) as TAccessTokenData;
    } catch (e) {
      throw new UnauthorizedException(e);
    }
  }

  async decodeRefreshToken(
    token: string,
  ): Promise<Omit<TRefreshTokenData, 'refreshToken'>> {
    return jwt.decode(token) as Omit<TRefreshTokenData, 'refreshToken'>;
  }

  async isValidJWTFormat(token: string): Promise<boolean> {
    const jwtParts = token.split('.');

    if (jwtParts.length !== 3) {
      return false;
    }

    try {
      jwtParts.forEach((part) => {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      });
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return false;
    }
  }

  async isTokenExpired(token: string, key: string): Promise<boolean> {
    try {
      jwt.verify(token, key);
      return false;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return true;
    }
  }
}
