import { SortDirectionEnum } from '../../constants';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import { Optional } from '@nestjs/common';

export abstract class BaseQueryParams<T> {
  @Optional()
  @IsEnum(SortDirectionEnum)
  sortDirection: SortDirectionEnum = SortDirectionEnum.DESC;

  @IsInt({ message: 'pageSize must be an integer' })
  @IsPositive({ message: 'pageSize must be greater than 0' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  pageNumber: number = 1;

  @IsInt({ message: 'pageSize must be an integer' })
  @IsPositive({ message: 'pageSize must be greater than 0' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  pageSize: number = 10;
  abstract sortBy: T;

  protected constructor(query: Partial<BaseQueryParams<T>> = {}) {
    this.sortDirection = query.sortDirection ?? SortDirectionEnum.DESC;
    this.pageNumber = query.pageNumber ? Number(query.pageNumber) : 1;
    this.pageSize = query.pageSize ? Number(query.pageSize) : 10;
  }
}
