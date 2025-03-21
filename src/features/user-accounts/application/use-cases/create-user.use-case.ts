import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain';
import { UsersRepository } from '../../infrastructure';
import { CryptoService, EmailNotificationService } from '../../../service';
import { CreateUserDto } from '../../dto';
import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../users.service';

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersService: UsersService,
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
    private emailNotificationService: EmailNotificationService,
  ) {}

  async execute(command: CreateUserCommand): Promise<ObjectId> {
    const { isAdmin, email, login, password } = command.dto;

    await this.usersService.checkIsUserUnique('login', login);
    await this.usersService.checkIsUserUnique('email', email);

    const passwordHash = await this.cryptoService.createPasswordHash(password);

    const user = this.UserModel.createInstance({
      email,
      login,
      passwordHash: passwordHash,
      isConfirmed: isAdmin,
    });

    if (!isAdmin) {
      this.emailNotificationService
        .sendEmailWithConfirmationCode({
          login: user.login,
          email: user.email,
          code: user.emailConfirmation.confirmationCode,
        })
        .catch((e) => console.log('Error send email: ', e));
    }

    await this.usersRepository.save(user);

    return user._id;
  }
}
