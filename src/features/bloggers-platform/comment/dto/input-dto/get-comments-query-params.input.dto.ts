import { BaseQueryParams } from '../../../../../core';
import { CommentsSortByEnum } from '../../../../../constants';
import { IsEnum } from 'class-validator';
import { Optional } from '@nestjs/common';

export class CommentsQueryParams extends BaseQueryParams<CommentsSortByEnum> {
  @Optional()
  @IsEnum(CommentsSortByEnum)
  sortBy: CommentsSortByEnum = CommentsSortByEnum.CREATED_AT;

  constructor(query: Partial<CommentsQueryParams> = {}) {
    super(query);
    this.sortBy = query.sortBy || CommentsSortByEnum.CREATED_AT;
  }
}
