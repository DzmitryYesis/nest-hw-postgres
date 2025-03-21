import { Injectable, NotFoundException } from '@nestjs/common';
import { UserInfoViewDto, UsersQueryParams, UserViewDto } from '../../dto';
import { User, UserModelType } from '../../domain';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { PaginatedViewDto } from '../../../../core';
import { UserStatusEnum } from '../../../../constants';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async getAllUsers(
    query: UsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const filter = {
      userStatus: { $ne: UserStatusEnum.DELETED },
    };

    if (query.searchEmailTerm) {
      filter['$or'] = [
        {
          email: {
            $regex: query.searchEmailTerm,
            $options: 'i',
          },
        },
      ];
    }

    if (query.searchLoginTerm) {
      filter['$or'] = filter['$or'] || [];
      filter['$or'].push({
        login: {
          $regex: query.searchLoginTerm,
          $options: 'i',
        },
      });
    }

    const users = await this.UserModel.find(filter)
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.UserModel.countDocuments(filter);

    const items = users.map(UserViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getUserById(id: ObjectId): Promise<UserViewDto> {
    const user = await this.UserModel.findOne({
      _id: id,
      userStatus: { $ne: UserStatusEnum.DELETED },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserViewDto.mapToView(user);
  }

  async getUserInfoById(id: string): Promise<UserInfoViewDto> {
    const user = await this.UserModel.findOne({
      _id: new ObjectId(id),
      userStatus: { $ne: UserStatusEnum.DELETED },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserInfoViewDto.mapToView(user);
  }
}
