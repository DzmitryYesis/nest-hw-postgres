import { UsersRepository } from '../../infrastructure';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { EmailNotificationService } from '../../../service';

export class ResendConfirmationCodeCommand {
  constructor(public email: string) {}
}

@CommandHandler(ResendConfirmationCodeCommand)
export class ResendConfirmationCodeUseCase
  implements ICommandHandler<ResendConfirmationCodeCommand>
{
  constructor(
    private usersRepository: UsersRepository,
    private emailNotificationService: EmailNotificationService,
  ) {}

  async execute(command: ResendConfirmationCodeCommand): Promise<void> {
    const user = await this.usersRepository.findByCredentials(
      'email',
      command.email,
    );

    if (
      !user ||
      user.emailConfirmation.expirationDate < new Date() ||
      user.emailConfirmation.isConfirmed
    ) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'email',
            message: 'Some problem',
          },
        ],
      });
    }

    user.changeConfirmationCode();

    this.emailNotificationService
      .sendEmailWithConfirmationCode({
        login: user.login,
        email: user.email,
        code: user.emailConfirmation.confirmationCode,
      })
      .catch((e) => console.log('Error send email: ', e));

    await this.usersRepository.save(user);
  }
}
