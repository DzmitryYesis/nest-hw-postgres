import { BaseQueryParams } from '../../../../../core';
import { PostsSortByEnum } from '../../../../../constants';
import { Optional } from '@nestjs/common';
import { IsEnum } from 'class-validator';

export class PostsQueryParams extends BaseQueryParams<PostsSortByEnum> {
  @Optional()
  @IsEnum(PostsSortByEnum)
  sortBy: PostsSortByEnum = PostsSortByEnum.CREATED_AT;

  constructor(query: Partial<PostsQueryParams> = {}) {
    super(query);
    this.sortBy = query.sortBy || PostsSortByEnum.CREATED_AT;
  }
}
