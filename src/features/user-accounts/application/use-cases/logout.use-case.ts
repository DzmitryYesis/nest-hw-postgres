import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { JwtService } from '../../../service';
import { UnauthorizedException } from '@nestjs/common';
import { SETTINGS } from '../../../../settings';

export class LogoutCommand {
  constructor(public refreshToken: string) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(
    private sessionsRepository: SessionsRepository,
    private jwtService: JwtService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { deviceId, iat } = await this.jwtService.decodeRefreshToken(
      command.refreshToken,
    );

    const session = await this.sessionsRepository.findSessionByDeviceIdAndIat(
      deviceId,
      iat,
    );

    if (!session) {
      throw new UnauthorizedException();
    }

    const isRefreshTokenExpired = await this.jwtService.isTokenExpired(
      command.refreshToken,
      SETTINGS.JWT_REFRESH_TOKEN_SECRET,
    );

    if (isRefreshTokenExpired) {
      session.deleteSession();

      await this.sessionsRepository.save(session);

      throw new UnauthorizedException('Refresh token is missing');
    }

    session.deleteSession();

    await this.sessionsRepository.save(session);
  }
}
