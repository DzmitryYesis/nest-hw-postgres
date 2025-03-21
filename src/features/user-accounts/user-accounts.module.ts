import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain';
import { UsersService } from './application';
import { AuthController, UsersController } from './api';
import { UsersRepository } from './infrastructure';
import { UsersQueryRepository } from './infrastructure';
import { UtilitiesApplicationModule } from '../service';
import { Session, SessionSchema } from './domain/session.entity';
import { SessionsRepository } from './infrastructure/sessions.repository';
import { SecurityController } from './api/security.controller';
import { SessionsQueryRepository } from './infrastructure/query/sessions.query-repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { DeleteUserByIdUseCase } from './application/use-cases/delete-user-by-id.use-case';
import { ConfirmUserUseCase } from './application/use-cases/confirm-user.use-case';
import { ResendConfirmationCodeUseCase } from './application/use-cases/resend-confirmation-code.use-case';
import { PasswordRecoveryUseCase } from './application/use-cases/password-recovery.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { UpdateTokensUseCase } from './application/use-cases/update-tokens.use-case';
import { DeleteDeviceUseCase } from './application/use-cases/delete-device.use-case';
import { DeleteDevicesExcludeCurrentUseCase } from './application/use-cases/delete-devices-exclude-current.use-case';

//import { ThrottlerModule } from '@nestjs/throttler';

const useCases = [
  CreateUserUseCase,
  DeleteUserByIdUseCase,
  ConfirmUserUseCase,
  ResendConfirmationCodeUseCase,
  PasswordRecoveryUseCase,
  ChangePasswordUseCase,
  LoginUseCase,
  LogoutUseCase,
  UpdateTokensUseCase,
  DeleteDeviceUseCase,
  DeleteDevicesExcludeCurrentUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    //TODO delete for e2e tests
    /*ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),*/
    UtilitiesApplicationModule,
    CqrsModule,
  ],
  controllers: [UsersController, AuthController, SecurityController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    SessionsRepository,
    SessionsQueryRepository,
    ...useCases,
  ],
  exports: [MongooseModule, UsersRepository],
})
export class UserAccountsModule {}
