import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure';
import { BadRequestException } from '@nestjs/common';

export class ConfirmUserCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmUserCommand)
export class ConfirmUserUseCase implements ICommandHandler<ConfirmUserCommand> {
  constructor(private usersRepository: UsersRepository) {}

  async execute(command: ConfirmUserCommand): Promise<void> {
    const user = await this.usersRepository.findByCredentials(
      'emailConfirmation.confirmationCode',
      command.code,
    );

    if (
      !user ||
      user.emailConfirmation.confirmationCode !== command.code ||
      user.emailConfirmation.expirationDate < new Date() ||
      user.emailConfirmation.isConfirmed
    ) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'code',
            message: 'Some problem',
          },
        ],
      });
    }

    user.confirmUser();

    await this.usersRepository.save(user);
  }
}
