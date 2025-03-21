import { Injectable } from '@nestjs/common';
import { User, UserDocument, UserModelType } from '../domain';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { UserStatusEnum } from '../../../constants';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async findByCredentials(
    field: string,
    value: string | ObjectId,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      [field]: value,
      userStatus: { $ne: UserStatusEnum.DELETED },
    });
  }

  async findUserByLoginOrEmail(data: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [{ email: data }, { login: data }],
      userStatus: { $ne: UserStatusEnum.DELETED },
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }
}
