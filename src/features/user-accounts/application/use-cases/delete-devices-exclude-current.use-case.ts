import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { JwtService } from '../../../service';

export class DeleteDevicesExcludeCurrentCommand {
  constructor(public refreshToken: string) {}
}

@CommandHandler(DeleteDevicesExcludeCurrentCommand)
export class DeleteDevicesExcludeCurrentUseCase
  implements ICommandHandler<DeleteDevicesExcludeCurrentCommand>
{
  constructor(
    private sessionsRepository: SessionsRepository,
    private jwtService: JwtService,
  ) {}

  async execute(command: DeleteDevicesExcludeCurrentCommand): Promise<void> {
    const { userId, deviceId } = await this.jwtService.decodeRefreshToken(
      command.refreshToken,
    );
    await this.sessionsRepository.deleteSessionsExcludeCurrent(
      deviceId,
      userId,
    );
  }
}
