import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import { CreateUserDomainDto } from '../dto';
import { HydratedDocument, Model } from 'mongoose';
import { v4 as uuidV4 } from 'uuid';
import { add } from 'date-fns';
import {
  emailMatch,
  loginLength,
  loginMatch,
  UserStatusEnum,
} from '../../../constants';
import {
  PasswordRecovery,
  PasswordRecoverySchema,
} from './password-recovery.schema';

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    type: String,
    ...loginLength,
    match: loginMatch,
    unique: true,
  })
  login: string;

  @Prop({
    required: true,
    type: String,
    match: emailMatch,
    unique: true,
  })
  email: string;

  @Prop({ required: true, type: String })
  passwordHash: string;

  @Prop({ type: EmailConfirmationSchema })
  emailConfirmation: EmailConfirmation;

  @Prop({ type: PasswordRecoverySchema })
  passwordRecovery: PasswordRecovery;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ enum: UserStatusEnum, default: UserStatusEnum.ACTIVE })
  userStatus: UserStatusEnum;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();

    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;

    user.emailConfirmation = {
      confirmationCode: uuidV4(),
      expirationDate: add(new Date(), {
        hours: 1,
        minutes: 3,
      }),
      isConfirmed: dto.isConfirmed,
    } as EmailConfirmation;

    user.passwordRecovery = {
      recoveryCode: null,
      expirationDate: null,
      lastUpdateDate: null,
    } as PasswordRecovery;

    return user as UserDocument;
  }

  confirmUser() {
    this.emailConfirmation.isConfirmed = true;
  }

  changeConfirmationCode() {
    this.emailConfirmation.confirmationCode = uuidV4();
    this.emailConfirmation.expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
  }

  createPasswordRecoveryCode() {
    this.passwordRecovery.recoveryCode = uuidV4();
    this.passwordRecovery.expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
  }

  changePassword(password: string) {
    this.passwordHash = password;
    this.passwordRecovery = {
      recoveryCode: null,
      expirationDate: null,
      lastUpdateDate: new Date(),
    };
  }

  deleteUser() {
    this.userStatus = UserStatusEnum.DELETED;
    this.deletedAt = new Date();
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
