import { LoginInputDto, LoginViewDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../../domain/session.entity';
import { UsersRepository } from '../../infrastructure';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { CryptoService, JwtService } from '../../../service';
import { UnauthorizedException } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';

export class LoginCommand {
  constructor(
    public data: LoginInputDto,
    public ip: string,
    public device: string,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
    private usersRepository: UsersRepository,
    private sessionsRepository: SessionsRepository,
    private cryptoService: CryptoService,
    private jwtService: JwtService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginViewDto> {
    const {
      device,
      ip,
      data: { loginOrEmail, password },
    } = command;

    const user =
      await this.usersRepository.findUserByLoginOrEmail(loginOrEmail);

    if (!user) {
      throw new UnauthorizedException({
        errorsMessages: [
          {
            field: 'loginOrEmail',
            message: 'Bad login or email',
          },
        ],
      });
    }

    const isValidPassword = await this.cryptoService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException({
        errorsMessages: [
          {
            field: 'password',
            message: 'Wrong password',
          },
        ],
      });
    }

    const deviceId = uuidV4();

    const accessToken = await this.jwtService.createAccessJWT(user._id);
    const { refreshToken, exp, iat } = await this.jwtService.createRefreshJWT(
      deviceId,
      user._id,
    );

    const session = this.SessionModel.createInstance({
      iat,
      exp,
      deviceId,
      deviceName: device || 'Unknown device',
      ip,
      userId: user._id.toString(),
    });

    await this.sessionsRepository.save(session);

    return { accessToken, refreshToken };
  }
}
