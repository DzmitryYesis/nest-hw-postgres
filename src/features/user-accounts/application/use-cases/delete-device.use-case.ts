import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { JwtService } from '../../../service';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SETTINGS } from '../../../../settings';

export class DeleteDeviceCommand {
  constructor(
    public deviceId: string,
    public userId: string,
    public refreshToken: string,
  ) {}
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDeviceUseCase
  implements ICommandHandler<DeleteDeviceCommand>
{
  constructor(
    private sessionsRepository: SessionsRepository,
    private jwtService: JwtService,
  ) {}

  async execute(command: DeleteDeviceCommand): Promise<void> {
    const { userId, deviceId, refreshToken } = command;

    const session =
      await this.sessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      throw new NotFoundException();
    }

    const isRefreshTokenExpired = await this.jwtService.isTokenExpired(
      refreshToken,
      SETTINGS.JWT_REFRESH_TOKEN_SECRET,
    );

    if (isRefreshTokenExpired) {
      session.deleteSession();

      await this.sessionsRepository.save(session);

      throw new UnauthorizedException();
    }

    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    session.deleteSession();

    await this.sessionsRepository.save(session);
  }
}
