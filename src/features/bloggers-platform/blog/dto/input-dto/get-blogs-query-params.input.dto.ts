import { BaseQueryParams } from '../../../../../core';
import { BlogsSortByEnum } from '../../../../../constants';
import { Optional } from '@nestjs/common';
import { IsEnum } from 'class-validator';

export class BlogsQueryParams extends BaseQueryParams<BlogsSortByEnum> {
  @Optional()
  @IsEnum(BlogsSortByEnum)
  sortBy: BlogsSortByEnum = BlogsSortByEnum.CREATED_AT;

  @Optional()
  searchNameTerm: string | null = null;

  constructor(query: Partial<BlogsQueryParams> = {}) {
    super(query);
    this.sortBy = query.sortBy ?? BlogsSortByEnum.CREATED_AT;
    this.searchNameTerm = query.searchNameTerm || null;
  }
}
