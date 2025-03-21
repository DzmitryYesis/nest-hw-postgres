import { BaseQueryParams } from '../../../../core';
import { UsersSortByEnum } from '../../../../constants';
import { IsEnum } from 'class-validator';
import { Optional } from '@nestjs/common';

export class UsersQueryParams extends BaseQueryParams<UsersSortByEnum> {
  @Optional()
  @IsEnum(UsersSortByEnum)
  sortBy: UsersSortByEnum = UsersSortByEnum.CREATED_AT;

  @Optional()
  searchLoginTerm: string | null = null;

  @Optional()
  searchEmailTerm: string | null = null;

  constructor(query: Partial<UsersQueryParams> = {}) {
    super(query);
    this.sortBy = query.sortBy ?? UsersSortByEnum.CREATED_AT;
    this.searchLoginTerm = query.searchLoginTerm || null;
    this.searchEmailTerm = query.searchEmailTerm || null;
  }
}
