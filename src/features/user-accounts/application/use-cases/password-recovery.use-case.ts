import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure';
import { EmailNotificationService } from '../../../service';
import { v4 as uuidV4 } from 'uuid';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private usersRepository: UsersRepository,
    private emailNotificationService: EmailNotificationService,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<void> {
    const user = await this.usersRepository.findByCredentials(
      'email',
      command.email,
    );

    if (user) {
      user.createPasswordRecoveryCode();

      this.emailNotificationService
        .sendEmailWithRecoveryPasswordCode({
          code: user.passwordRecovery.recoveryCode!,
          email: command.email,
        })
        .catch((e) => console.log('Error send email: ', e));

      await this.usersRepository.save(user);

      return;
    }

    const invalidRecoveryCode = uuidV4();

    this.emailNotificationService
      .sendEmailWithRecoveryPasswordCode({
        code: invalidRecoveryCode,
        email: command.email,
      })
      .catch((e) => console.log('Error send email: ', e));
  }
}
