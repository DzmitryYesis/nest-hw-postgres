import { ChangePasswordInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure';
import { CryptoService } from '../../../service';
import { BadRequestException } from '@nestjs/common';

export class ChangePasswordCommand {
  constructor(public dto: ChangePasswordInputDto) {}
}

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordUseCase
  implements ICommandHandler<ChangePasswordCommand>
{
  constructor(
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const { newPassword, recoveryCode } = command.dto;

    const user = await this.usersRepository.findByCredentials(
      'passwordRecovery.recoveryCode',
      recoveryCode,
    );

    if (!user || user.passwordRecovery.expirationDate! < new Date()) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'recoveryCode',
            message: 'Some problem',
          },
        ],
      });
    }

    const passwordHash =
      await this.cryptoService.createPasswordHash(newPassword);

    user.changePassword(passwordHash);

    await this.usersRepository.save(user);
  }
}
